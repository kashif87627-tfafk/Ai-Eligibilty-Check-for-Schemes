/**
 * Lambda Handler for Scheme Management
 * 
 * Handles API requests for scheme discovery, listing, and management.
 * Uses Claude (Bedrock) for intelligent scheme discovery from web sources.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  getAllEligibilityRules,
  saveEligibilityRule 
} from '../repositories/eligibility-rule-repository';
import { EligibilityRule } from '../types/eligibility-rules';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

// Use APAC inference profile for Nova Lite (works with AWS credits, no payment method needed)
const BEDROCK_MODEL_ID = 'apac.amazon.nova-lite-v1:0';

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
 * Invoke Claude to discover schemes
 */
async function discoverSchemesWithClaude(
  query: string,
  category?: string,
  state?: string
): Promise<any[]> {
  const prompt = `You are an expert at finding and structuring information about Indian government welfare schemes.

User Query: "${query}"
${category ? `Category Filter: ${category}` : ''}
${state ? `State Filter: ${state}` : ''}

Task:
Search for relevant government schemes based on the query. For each scheme you find, extract and structure the following information:

1. Scheme name (official name)
2. Brief description (2-3 sentences)
3. Category (education, employment, welfare, health, agriculture, etc.)
4. Target audience (who is it for?)
5. Eligibility criteria (age, income, location, etc.)
6. Required documents
7. Application process (online/offline/both)
8. Source URL (official government website)

Return your findings in this JSON format:
{
  "schemes": [
    {
      "name": "Scheme Name",
      "description": "Brief description",
      "category": "education",
      "targetAudience": ["students", "youth"],
      "eligibility": {
        "ageRange": ["18-25", "26-35"],
        "incomeLimit": "200000",
        "states": ["Karnataka", "All"],
        "otherCriteria": ["Must be enrolled in college"]
      },
      "documents": [
        "Aadhaar Card",
        "Income Certificate",
        "Educational Certificates"
      ],
      "applicationMode": "online",
      "sourceUrl": "https://official-website.gov.in",
      "confidence": 85
    }
  ],
  "totalFound": 3,
  "searchSummary": "Found 3 education schemes for students in Karnataka"
}

Important:
- Only include schemes from official government sources
- Provide accurate, verifiable information
- Include confidence score (0-100) for each scheme
- If you're unsure about details, indicate lower confidence
- Focus on currently active schemes

Respond with ONLY the JSON object, no additional text.`;

  const requestBody = {
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      max_new_tokens: 4096,
      temperature: 0.3,
      top_p: 0.9
    }
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody)
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Extract text from Nova response format
  if (responseBody.output?.message?.content && Array.isArray(responseBody.output.message.content)) {
    const textContent = responseBody.output.message.content.find((c: any) => c.text);
    if (textContent) {
      const text = textContent.text;
      
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      return parsed.schemes || [];
    }
  }
  
  return [];
}

/**
 * Convert discovered scheme to EligibilityRule format
 */
function convertToEligibilityRule(discoveredScheme: any): EligibilityRule {
  const schemeId = `scheme-${discoveredScheme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const ruleId = `rule-${schemeId}-${Date.now()}`;
  
  // Convert eligibility to criteria format
  const criteria: any[] = [];
  let criteriaIndex = 1;
  
  if (discoveredScheme.eligibility.ageRange) {
    criteria.push({
      id: `crit-age-${criteriaIndex++}`,
      field: 'ageRange',
      operator: 'in',
      value: discoveredScheme.eligibility.ageRange,
      weight: 0.2,
      description: `Age must be in range: ${discoveredScheme.eligibility.ageRange.join(', ')}`,
      mandatory: true
    });
  }
  
  if (discoveredScheme.eligibility.incomeLimit) {
    criteria.push({
      id: `crit-income-${criteriaIndex++}`,
      field: 'incomeRange',
      operator: 'lte',
      value: discoveredScheme.eligibility.incomeLimit,
      weight: 0.25,
      description: `Annual income must be below ₹${parseInt(discoveredScheme.eligibility.incomeLimit).toLocaleString('en-IN')}`,
      mandatory: true
    });
  }
  
  if (discoveredScheme.eligibility.states && discoveredScheme.eligibility.states.length > 0) {
    const states = discoveredScheme.eligibility.states.filter((s: string) => s !== 'All');
    if (states.length > 0) {
      criteria.push({
        id: `crit-state-${criteriaIndex++}`,
        field: 'location.state',
        operator: 'in',
        value: states,
        weight: 0.2,
        description: `Must be resident of: ${states.join(', ')}`,
        mandatory: true
      });
    }
  }
  
  // Convert documents to required format
  const requiredDocuments = (discoveredScheme.documents || []).map((doc: string, index: number) => ({
    type: doc.toLowerCase().replace(/\s+/g, '_'),
    name: doc,
    mandatory: index < 3, // First 3 are mandatory
    description: `${doc} for verification`
  }));
  
  const rule: EligibilityRule = {
    id: ruleId,
    schemeId: schemeId,
    schemeName: discoveredScheme.name,
    schemeNameTranslations: {},
    description: discoveredScheme.description,
    descriptionTranslations: {},
    category: discoveredScheme.category || 'general',
    targetAudience: discoveredScheme.targetAudience || [],
    criteria: criteria,
    requiredDocuments: requiredDocuments,
    applicableStates: discoveredScheme.eligibility.states || [],
    ruralUrbanFilter: 'both',
    isOpenEnded: true,
    processingTime: '30-45 days',
    applicationMode: discoveredScheme.applicationMode || 'online',
    applicationUrl: discoveredScheme.sourceUrl,
    trustLevel: 'unverifiable',
    sourceUrl: discoveredScheme.sourceUrl,
    lastVerified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return rule;
}

/**
 * POST /api/v1/schemes/discover
 * Discover schemes using Claude
 */
export async function discoverHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { query, category, state } = body;
    
    if (!query || typeof query !== 'string') {
      return createResponse(400, {
        error: 'Missing required field: query'
      });
    }
    
    console.log(`Discovering schemes for query: "${query}"`);
    
    const discoveredSchemes = await discoverSchemesWithClaude(query, category, state);
    
    return createResponse(200, {
      success: true,
      data: {
        schemes: discoveredSchemes,
        totalFound: discoveredSchemes.length,
        query: query
      }
    });
    
  } catch (error) {
    console.error('Error discovering schemes:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/schemes/add
 * Add a discovered scheme to the database
 */
export async function addSchemeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { scheme } = body;
    
    if (!scheme) {
      return createResponse(400, {
        error: 'Missing required field: scheme'
      });
    }
    
    // Convert to EligibilityRule format
    const rule = convertToEligibilityRule(scheme);
    
    // Check if scheme already exists (by name, not ID, since same scheme can have different IDs)
    const existingRules = await getAllEligibilityRules();
    const duplicate = existingRules.find(r => 
      r.schemeName.toLowerCase().trim() === rule.schemeName.toLowerCase().trim()
    );
    
    if (duplicate) {
      return createResponse(409, {
        error: 'Scheme already exists',
        message: `A scheme with the name "${rule.schemeName}" has already been added to the database.`,
        existingSchemeId: duplicate.schemeId
      });
    }
    
    // Save to database
    await saveEligibilityRule(rule);
    
    console.log(`Added scheme: ${rule.schemeName} (${rule.schemeId})`);
    
    return createResponse(200, {
      success: true,
      data: {
        message: 'Scheme added successfully',
        schemeId: rule.schemeId,
        schemeName: rule.schemeName
      }
    });
    
  } catch (error) {
    console.error('Error adding scheme:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/schemes/list
 * List all schemes
 */
export async function listSchemesHandler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const rules = await getAllEligibilityRules();
    
    const schemes = rules.map(rule => ({
      id: rule.schemeId,
      name: rule.schemeName,
      description: rule.description,
      category: rule.category,
      targetAudience: rule.targetAudience,
      createdAt: rule.createdAt
    }));
    
    return createResponse(200, {
      success: true,
      data: {
        schemes: schemes,
        total: schemes.length
      }
    });
    
  } catch (error) {
    console.error('Error listing schemes:', error);
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
    if (method === 'POST' && path.endsWith('/discover')) {
      return await discoverHandler(event);
    } else if (method === 'POST' && path.endsWith('/add')) {
      return await addSchemeHandler(event);
    } else if (method === 'GET' && path.endsWith('/list')) {
      return await listSchemesHandler(event);
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
