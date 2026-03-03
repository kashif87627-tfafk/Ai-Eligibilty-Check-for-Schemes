/**
 * Lambda Handler for Eligibility Evaluation
 * 
 * Handles API requests for eligibility evaluation against scheme rules.
 * Uses hybrid evaluation (rule-based + LLM) for optimal results.
 * 
 * Requirements: FR-2.1, FR-2.5
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  evaluateHybrid, 
  batchEvaluateHybrid, 
  formatHybridResponse,
  sortHybridByConfidence,
  HybridEvaluationResult
} from '../services/hybrid-eligibility-service';
import { 
  getEligibilityRulesBySchemeId,
  getEligibilityRulesByCategory,
  getEligibilityRulesByStateAndCategory,
  getAllEligibilityRules
} from '../repositories/eligibility-rule-repository';
import { UserProfileRepository } from '../repositories/user-profile-repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { 
  getCachedEvaluationResult, 
  cacheEvaluationResult 
} from '../services/evaluation-cache';
import { 
  trackLatency, 
  trackError, 
  trackCacheHit, 
  createTimer 
} from '../services/metrics';
import { 
  checkRateLimit, 
  incrementRateLimit 
} from '../services/rate-limiter';
import {
  detectDocumentGaps,
  generateDocumentGapSummary,
  getDocumentActionSteps,
  DocumentGapResult
} from '../services/document-gap-detection';

const profileRepository = new UserProfileRepository();

// Initialize DynamoDB client for storing evaluation results
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'eligibility-mvp-table';

/**
 * Generate suggested next steps based on evaluation result
 */
function generateNextSteps(result: HybridEvaluationResult): string[] {
  const steps: string[] = [];
  
  if (result.status === 'strongly_eligible') {
    steps.push('Proceed with application submission');
    if (result.missingDocuments.length > 0) {
      steps.push(`Upload ${result.missingDocuments.length} required document(s)`);
    }
  } else if (result.status === 'conditionally_eligible') {
    if (result.missingCriteria.length > 0) {
      steps.push('Update your profile with missing information');
    }
    if (result.missingDocuments.length > 0) {
      steps.push('Gather and upload required documents');
    }
    steps.push('Review unmatched criteria to see if you can meet them');
  } else if (result.status === 'needs_verification') {
    steps.push('Provide additional information for verification');
    if (result.missingDocuments.length > 0) {
      steps.push('Upload supporting documents');
    }
  } else {
    steps.push('Review other available schemes that may be a better match');
    if (result.unmatchedCriteria.length > 0) {
      steps.push('Check which criteria you do not meet');
    }
  }
  
  return steps;
}

/**
 * Analyze document gaps for a scheme and user documents
 */
function analyzeDocumentGaps(
  rule: any,
  userDocuments: string[]
): DocumentGapResult {
  return detectDocumentGaps(
    rule.requiredDocuments || [],
    userDocuments
  );
}

/**
 * Store evaluation result in DynamoDB
 */
async function storeEvaluationResult(result: HybridEvaluationResult): Promise<void> {
  const timestamp = new Date().toISOString();
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${result.userId}`,
      SK: `EVAL#${timestamp}#${result.evaluationId}`,
      GSI1PK: `SCHEME#${result.schemeId}`,
      GSI1SK: `EVAL#${timestamp}`,
      entityType: 'EVALUATION',
      evaluationId: result.evaluationId,
      userId: result.userId,
      schemeId: result.schemeId,
      schemeName: result.schemeName,
      status: result.status,
      confidenceScore: result.confidenceScore,
      usedLLM: result.usedLLM,
      evaluationMethod: result.evaluationMethod,
      evaluatedAt: result.evaluatedAt,
      result: result, // Store full result for retrieval
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days retention
    }
  }));
}

/**
 * Validate request body for evaluation endpoint
 */
function validateEvaluateRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body.userId || typeof body.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }
  
  if (!body.schemeId || typeof body.schemeId !== 'string') {
    errors.push('schemeId is required and must be a string');
  }
  
  if (body.userDocuments && !Array.isArray(body.userDocuments)) {
    errors.push('userDocuments must be an array');
  }
  
  if (body.options) {
    if (body.options.forceLLM !== undefined && typeof body.options.forceLLM !== 'boolean') {
      errors.push('options.forceLLM must be a boolean');
    }
    if (body.options.skipLLM !== undefined && typeof body.options.skipLLM !== 'boolean') {
      errors.push('options.skipLLM must be a boolean');
    }
    if (body.options.language && typeof body.options.language !== 'string') {
      errors.push('options.language must be a string');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate request body for re-evaluate endpoint
 */
function validateReEvaluateRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body.userId || typeof body.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }
  
  if (body.schemeIds && !Array.isArray(body.schemeIds)) {
    errors.push('schemeIds must be an array');
  }
  
  if (body.userDocuments && !Array.isArray(body.userDocuments)) {
    errors.push('userDocuments must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract user ID from Cognito authorizer context
 */
function getUserIdFromContext(event: APIGatewayProxyEvent): string | null {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
}

/**
 * Helper function to create API Gateway response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

/**
 * POST /api/v1/eligibility/evaluate
 * Evaluate user eligibility for a specific scheme using hybrid approach
 * 
 * Requirements: FR-2.1, FR-2.5, FR-2.3, FR-3.1, NFR-5
 */
export async function evaluateHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const timer = createTimer();
  const endpoint = '/api/v1/eligibility/evaluate';
  
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validation = validateEvaluateRequest(body);
    if (!validation.isValid) {
      await trackError(endpoint, 'ValidationError');
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    const { userId, schemeId, userDocuments, options } = body;
    
    // Check rate limit
    const rateLimit = await checkRateLimit(userId, 'evaluation');
    if (!rateLimit.allowed) {
      await trackError(endpoint, 'RateLimitExceeded');
      return createResponse(429, {
        error: 'Rate limit exceeded',
        message: `You have exceeded the ${rateLimit.limitType} limit`,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      });
    }
    
    // Optional: Verify user from Cognito context matches request
    const cognitoUserId = getUserIdFromContext(event);
    if (cognitoUserId && cognitoUserId !== userId) {
      console.warn(`User ID mismatch: Cognito=${cognitoUserId}, Request=${userId}`);
      // In production, you might want to enforce this check
    }
    
    // Fetch user profile
    const userProfile = await profileRepository.getById(userId);
    if (!userProfile) {
      await trackError(endpoint, 'UserNotFound');
      return createResponse(404, {
        error: 'User profile not found',
        message: `No profile found for user ID: ${userId}`
      });
    }
    
    // Check cache first (unless forceLLM is set)
    if (!options?.forceLLM) {
      const cachedResult = await getCachedEvaluationResult(userId, schemeId, userProfile);
      if (cachedResult) {
        await trackCacheHit(true);
        const formattedResponse = formatHybridResponse(cachedResult);
        
        // Fetch rule for document gap analysis
        const rules = await getEligibilityRulesBySchemeId(schemeId);
        if (rules && rules.length > 0) {
          const rule = rules[0];
          const documentGaps = analyzeDocumentGaps(rule, userDocuments || []);
          const documentGapSummary = generateDocumentGapSummary(documentGaps);
          const documentActionSteps = getDocumentActionSteps(documentGaps.missingDocuments);
          
          // Add cache metadata and document gaps
          const responseWithCache = {
            success: true,
            data: {
              ...formattedResponse,
              document_gaps: {
                summary: documentGapSummary,
                total_required: documentGaps.totalRequired,
                documents_provided: documentGaps.documentsProvided,
                missing_mandatory: documentGaps.missingMandatory,
                missing_optional: documentGaps.missingOptional,
                completion_percentage: documentGaps.completionPercentage,
                has_all_mandatory: documentGaps.hasAllMandatory,
                missing_documents: documentGaps.missingDocuments,
                action_steps: documentActionSteps
              }
            },
            cached: true,
            cachedAt: cachedResult.evaluatedAt
          };
          
          await trackLatency(endpoint, timer.stop());
          return createResponse(200, responseWithCache);
        }
        
        // Fallback if rule not found (shouldn't happen)
        const responseWithCache = {
          success: true,
          data: formattedResponse,
          cached: true,
          cachedAt: cachedResult.evaluatedAt
        };
        
        await trackLatency(endpoint, timer.stop());
        return createResponse(200, responseWithCache);
      }
      await trackCacheHit(false);
    }
    
    // Fetch eligibility rule
    const rules = await getEligibilityRulesBySchemeId(schemeId);
    if (!rules || rules.length === 0) {
      await trackError(endpoint, 'SchemeNotFound');
      return createResponse(404, {
        error: 'Scheme not found',
        message: `No eligibility rules found for scheme ID: ${schemeId}`
      });
    }
    
    // Use the first rule (there should typically be one rule per scheme)
    const rule = rules[0];
    
    // Evaluate eligibility using hybrid approach
    const result = await evaluateHybrid(
      userId, 
      userProfile, 
      rule, 
      userDocuments || [],
      options || {}
    );
    
    // Increment rate limit counter
    await incrementRateLimit(userId, 'evaluation');
    
    // Cache the result
    try {
      await cacheEvaluationResult(userId, schemeId, userProfile, result);
    } catch (error) {
      console.error('Failed to cache evaluation result:', error);
      // Don't fail the request if caching fails
    }
    
    // Store evaluation result for history
    try {
      await storeEvaluationResult(result);
    } catch (error) {
      console.error('Failed to store evaluation result:', error);
      // Don't fail the request if storage fails
    }
    
    // Format and return response
    const formattedResponse = formatHybridResponse(result);
    
    // Analyze document gaps
    const documentGaps = analyzeDocumentGaps(rule, userDocuments || []);
    const documentGapSummary = generateDocumentGapSummary(documentGaps);
    const documentActionSteps = getDocumentActionSteps(documentGaps.missingDocuments);
    
    // Add suggested next steps and document gap information
    const responseWithNextSteps = {
      success: true,
      data: {
        ...formattedResponse,
        suggested_next_steps: generateNextSteps(result),
        document_gaps: {
          summary: documentGapSummary,
          total_required: documentGaps.totalRequired,
          documents_provided: documentGaps.documentsProvided,
          missing_mandatory: documentGaps.missingMandatory,
          missing_optional: documentGaps.missingOptional,
          completion_percentage: documentGaps.completionPercentage,
          has_all_mandatory: documentGaps.hasAllMandatory,
          missing_documents: documentGaps.missingDocuments,
          action_steps: documentActionSteps
        }
      },
      cached: false
    };
    
    await trackLatency(endpoint, timer.stop());
    return createResponse(200, responseWithNextSteps);
    
  } catch (error) {
    console.error('Error evaluating eligibility:', error);
    await trackError(endpoint, 'InternalError');
    await trackLatency(endpoint, timer.stop());
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/eligibility/evaluate-all
 * Evaluate user eligibility for all applicable schemes
 */
export async function evaluateAllHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const timer = createTimer();
  const endpoint = '/api/v1/eligibility/evaluate-all';
  
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { userId, userDocuments, category, state } = body;
    
    // Validate required fields
    if (!userId) {
      await trackError(endpoint, 'ValidationError');
      return createResponse(400, {
        error: 'Missing required field: userId'
      });
    }
    
    // Check rate limit (stricter for batch operations)
    const rateLimit = await checkRateLimit(userId, 'evaluation');
    if (!rateLimit.allowed) {
      await trackError(endpoint, 'RateLimitExceeded');
      return createResponse(429, {
        error: 'Rate limit exceeded',
        message: `You have exceeded the ${rateLimit.limitType} limit`,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      });
    }
    
    // Fetch user profile
    const userProfile = await profileRepository.getById(userId);
    if (!userProfile) {
      await trackError(endpoint, 'UserNotFound');
      return createResponse(404, {
        error: 'User profile not found'
      });
    }
    
    // Fetch applicable rules
    let rules;
    if (state) {
      rules = await getEligibilityRulesByStateAndCategory(state, category);
    } else if (category) {
      rules = await getEligibilityRulesByCategory(category);
    } else {
      rules = await getAllEligibilityRules();
    }
    
    // Evaluate eligibility for all rules using hybrid approach
    const results = await batchEvaluateHybrid(userId, userProfile, rules, userDocuments || []);
    
    // Increment rate limit counter
    await incrementRateLimit(userId, 'evaluation');
    
    // Store evaluation results
    try {
      await Promise.all(results.map(result => storeEvaluationResult(result)));
    } catch (error) {
      console.error('Failed to store some evaluation results:', error);
    }
    
    // Sort by confidence score
    const sortedResults = sortHybridByConfidence(results);
    
    // Format responses
    const formattedResults = sortedResults.map(r => formatHybridResponse(r));
    
    await trackLatency(endpoint, timer.stop());
    return createResponse(200, {
      success: true,
      data: {
        totalSchemes: results.length,
        results: formattedResults
      }
    });
    
  } catch (error) {
    console.error('Error evaluating all schemes:', error);
    await trackError(endpoint, 'InternalError');
    await trackLatency(endpoint, timer.stop());
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Main Lambda handler - routes to appropriate handler based on HTTP method and path
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;
  
  console.log(`${method} ${path}`);
  
  try {
    // Route to appropriate handler
    if (method === 'POST' && path.endsWith('/evaluate')) {
      return await evaluateHandler(event);
    } else if (method === 'POST' && path.endsWith('/re-evaluate')) {
      return await reEvaluateHandler(event);
    } else if (method === 'POST' && path.endsWith('/evaluate-all')) {
      return await evaluateAllHandler(event);
    } else if (method === 'GET' && path.includes('/user/')) {
      return await getUserEvaluationsHandler(event);
    } else {
      return createResponse(404, {
        error: 'Not found',
        message: `No handler for ${method} ${path}`
      });
    }
  } catch (error) {
    console.error('Unhandled error in main handler:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/eligibility/user/:userId
 * Get all past evaluations for a user
 * 
 * Requirements: FR-2.5
 */
export async function getUserEvaluationsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return createResponse(400, {
        error: 'Missing required parameter: userId'
      });
    }
    
    // Optional: Verify user from Cognito context matches request
    const cognitoUserId = getUserIdFromContext(event);
    if (cognitoUserId && cognitoUserId !== userId) {
      return createResponse(403, {
        error: 'Forbidden',
        message: 'You can only access your own evaluation history'
      });
    }
    
    // Query evaluations from DynamoDB
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'EVAL#'
      },
      ScanIndexForward: false, // Most recent first
      Limit: 50 // Limit to last 50 evaluations
    }));
    
    const evaluations = (result.Items || []).map(item => ({
      evaluationId: item.evaluationId,
      schemeId: item.schemeId,
      schemeName: item.schemeName,
      status: item.status,
      confidenceScore: item.confidenceScore,
      usedLLM: item.usedLLM,
      evaluationMethod: item.evaluationMethod,
      evaluatedAt: item.evaluatedAt,
      // Include summary, not full result
      summary: {
        matchedCriteria: item.result?.matchedCriteria?.length || 0,
        unmatchedCriteria: item.result?.unmatchedCriteria?.length || 0,
        missingCriteria: item.result?.missingCriteria?.length || 0,
        missingDocuments: item.result?.missingDocuments?.length || 0
      }
    }));
    
    return createResponse(200, {
      success: true,
      data: {
        userId,
        totalEvaluations: evaluations.length,
        evaluations
      }
    });
    
  } catch (error) {
    console.error('Error fetching user evaluations:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/eligibility/re-evaluate
 * Re-evaluate eligibility after profile update using hybrid approach
 * 
 * Requirements: FR-2.1, FR-2.5
 */
export async function reEvaluateHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validation = validateReEvaluateRequest(body);
    if (!validation.isValid) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    const { userId, schemeIds, userDocuments, options } = body;
    
    // Optional: Verify user from Cognito context matches request
    const cognitoUserId = getUserIdFromContext(event);
    if (cognitoUserId && cognitoUserId !== userId) {
      console.warn(`User ID mismatch: Cognito=${cognitoUserId}, Request=${userId}`);
    }
    
    // Fetch user profile
    const userProfile = await profileRepository.getById(userId);
    if (!userProfile) {
      return createResponse(404, {
        error: 'User profile not found',
        message: `No profile found for user ID: ${userId}`
      });
    }
    
    // Fetch rules to re-evaluate
    let rules;
    if (schemeIds && Array.isArray(schemeIds) && schemeIds.length > 0) {
      // Re-evaluate specific schemes
      const ruleArrays = await Promise.all(
        schemeIds.map(id => getEligibilityRulesBySchemeId(id))
      );
      rules = ruleArrays.flat().filter((r): r is NonNullable<typeof r> => r !== null);
      
      if (rules.length === 0) {
        return createResponse(404, {
          error: 'No schemes found',
          message: 'None of the specified scheme IDs were found'
        });
      }
    } else {
      // Re-evaluate all schemes
      rules = await getAllEligibilityRules();
    }
    
    // Evaluate eligibility using hybrid approach
    const results = await batchEvaluateHybrid(
      userId, 
      userProfile, 
      rules, 
      userDocuments || [],
      options || {}
    );
    
    // Store evaluation results
    try {
      await Promise.all(results.map(result => storeEvaluationResult(result)));
    } catch (error) {
      console.error('Failed to store some evaluation results:', error);
      // Don't fail the request if storage fails
    }
    
    // Sort by confidence score
    const sortedResults = sortHybridByConfidence(results);
    
    // Format responses
    const formattedResults = sortedResults.map(r => formatHybridResponse(r));
    
    return createResponse(200, {
      success: true,
      data: {
        totalSchemes: results.length,
        results: formattedResults,
        message: 'Re-evaluation completed successfully'
      }
    });
    
  } catch (error) {
    console.error('Error re-evaluating eligibility:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
