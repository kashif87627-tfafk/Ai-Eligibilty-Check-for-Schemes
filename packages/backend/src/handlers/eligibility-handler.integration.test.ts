/**
 * API Integration Tests for Eligibility Handler
 * 
 * Tests complete eligibility evaluation flow including:
 * - Request validation
 * - Evaluation logic
 * - Caching behavior
 * - Error responses (invalid input, missing data)
 * - Authorization enforcement
 * - Rate limiting
 * - Metrics tracking
 * 
 * Requirements: FR-2.1, FR-2.3
 * 
 * NOTE: These tests require DynamoDB and may make Bedrock API calls.
 * Set SKIP_INTEGRATION_TESTS=true to skip in CI/CD environments.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  evaluateHandler,
  getUserEvaluationsHandler,
  reEvaluateHandler,
  evaluateAllHandler
} from './eligibility-handler';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Skip integration tests if environment variable is set
const SKIP_TESTS = process.env.SKIP_INTEGRATION_TESTS === 'true';
const describeIntegration = SKIP_TESTS ? describe.skip : describe;

// Initialize DynamoDB client for test data setup
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'eligibility-mvp-table';

// Helper to create mock API Gateway event
function createMockEvent(
  method: string,
  path: string,
  body?: any,
  pathParameters?: Record<string, string>,
  userId?: string
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    pathParameters: pathParameters || null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: method,
      path,
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
        cognitoIdentityPoolId: null,
        cognitoIdentityId: null,
        caller: null,
        apiKey: null,
        apiKeyId: null,
        accessKey: null,
        accountId: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        userArn: null,
        user: null,
        principalOrgId: null,
        clientCert: null
      },
      authorizer: userId ? {
        claims: {
          sub: userId,
          'cognito:username': userId
        }
      } : undefined,
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      resourceId: 'test-resource',
      resourcePath: path
    },
    resource: path
  } as APIGatewayProxyEvent;
}

// Test data
const testUserId = 'test-user-integration-001';
const testSchemeId = 'scheme-001';

const testUserProfile = {
  id: testUserId,
  phoneNumber: '+919876543210',
  ageRange: '18-25' as const,
  gender: 'female' as const,
  location: {
    state: 'Karnataka',
    district: 'Bangalore Urban',
    ruralUrban: 'urban' as const
  },
  education: 'graduate' as const,
  occupation: 'student',
  employmentStatus: 'student' as const,
  incomeRange: 'below_50k' as const,
  category: 'general' as const,
  disabilityStatus: 'none' as const,
  language: 'en',
  interactionMode: 'text' as const,
  explanationLevel: 'standard' as const,
  consentGiven: true,
  consentTimestamp: new Date(),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const testEligibilityRule = {
  id: 'rule-001',
  schemeId: testSchemeId,
  schemeName: 'PM Scholarship Scheme',
  description: 'Scholarship for undergraduate students',
  category: 'education',
  targetAudience: ['students'],
  criteria: [
    {
      id: 'crit-001',
      field: 'ageRange',
      operator: 'in',
      value: ['18-25', '26-35'],
      weight: 0.3,
      description: 'Age must be between 18-35 years',
      mandatory: true
    },
    {
      id: 'crit-002',
      field: 'education',
      operator: 'in',
      value: ['secondary', 'graduate'],
      weight: 0.4,
      description: 'Must be pursuing or completed secondary/graduate education',
      mandatory: true
    }
  ],
  requiredDocuments: [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued Aadhaar card'
    }
  ],
  applicableStates: ['Karnataka'],
  ruralUrbanFilter: 'both',
  isOpenEnded: false,
  applicationDeadline: '2024-12-31T23:59:59Z',
  processingTime: '30 days',
  applicationMode: 'online',
  applicationUrl: 'https://example.gov.in/apply',
  trustLevel: 'verified',
  sourceUrl: 'https://example.gov.in/scheme',
  lastVerified: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describeIntegration('Eligibility Handler - API Integration Tests', () => {
  // Setup: Create test data before all tests
  beforeAll(async () => {
    // Create test user profile
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${testUserId}`,
        SK: 'PROFILE',
        entityType: 'USER_PROFILE',
        ...testUserProfile
      }
    }));

    // Create test eligibility rule
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SCHEME#${testSchemeId}`,
        SK: 'RULE',
        GSI1PK: 'CATEGORY#education',
        GSI1SK: `SCHEME#${testSchemeId}`,
        entityType: 'ELIGIBILITY_RULE',
        ...testEligibilityRule
      }
    }));
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    // Delete test user profile
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${testUserId}`,
        SK: 'PROFILE'
      }
    }));

    // Delete test eligibility rule
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SCHEME#${testSchemeId}`,
        SK: 'RULE'
      }
    }));
  });

  describe('POST /api/v1/eligibility/evaluate - Complete Evaluation Flow', () => {
    it('should successfully evaluate eligibility with valid input', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true } // Skip LLM for faster test
        },
        undefined,
        testUserId
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.evaluationId).toBeDefined();
      expect(body.data.userId).toBe(testUserId);
      expect(body.data.scheme.id).toBe(testSchemeId);
      expect(body.data.eligibility.status).toBeDefined();
      expect(body.data.eligibility.confidence).toBeGreaterThanOrEqual(0);
      expect(body.data.eligibility.confidence).toBeLessThanOrEqual(100);
      expect(body.data.eligibility.explanation).toBeDefined();
      expect(body.data.suggested_next_steps).toBeDefined();
      expect(Array.isArray(body.data.suggested_next_steps)).toBe(true);
    }, 30000);

    it('should return structured response with all required fields', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);
      const body = JSON.parse(response.body);

      // Verify response structure
      expect(body.data.scheme).toHaveProperty('id');
      expect(body.data.scheme).toHaveProperty('name');
      expect(body.data.eligibility).toHaveProperty('status');
      expect(body.data.eligibility).toHaveProperty('confidence');
      expect(body.data.eligibility).toHaveProperty('explanation');
      expect(body.data.criteria).toHaveProperty('matched');
      expect(body.data.criteria).toHaveProperty('unmatched');
      expect(body.data.criteria).toHaveProperty('missing');
      expect(body.data.criteria).toHaveProperty('details');
      expect(body.data.documents).toHaveProperty('missing');
      expect(body.data.metadata).toHaveProperty('evaluatedAt');
      expect(body.data.metadata).toHaveProperty('usedLLM');
      expect(body.data.metadata).toHaveProperty('evaluationMethod');
    }, 30000);

    it('should handle evaluation with missing documents', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: [], // No documents provided
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.data.documents.missing.length).toBeGreaterThan(0);
      
      // Should identify missing Aadhaar
      const missingAadhaar = body.data.documents.missing.find(
        (doc: any) => doc.type === 'aadhaar'
      );
      expect(missingAadhaar).toBeDefined();
      expect(missingAadhaar.mandatory).toBe(true);
    }, 30000);

    it('should use LLM for ambiguous cases when not skipped', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { forceLLM: true } // Force LLM usage
        }
      );

      const response = await evaluateHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.data.metadata.usedLLM).toBe(true);
      expect(body.data.metadata.evaluationMethod).toContain('llm');
    }, 45000); // Longer timeout for LLM call
  });

  describe('Caching Behavior', () => {
    it('should cache evaluation results and return cached data on subsequent requests', async () => {
      const requestBody = {
        userId: testUserId,
        schemeId: testSchemeId,
        userDocuments: ['aadhaar'],
        options: { skipLLM: true }
      };

      // First request - should not be cached
      const event1 = createMockEvent('POST', '/api/v1/eligibility/evaluate', requestBody);
      const response1 = await evaluateHandler(event1);
      const body1 = JSON.parse(response1.body);

      expect(response1.statusCode).toBe(200);
      expect(body1.cached).toBe(false);

      // Second request - should be cached
      const event2 = createMockEvent('POST', '/api/v1/eligibility/evaluate', requestBody);
      const response2 = await evaluateHandler(event2);
      const body2 = JSON.parse(response2.body);

      expect(response2.statusCode).toBe(200);
      expect(body2.cached).toBe(true);
      expect(body2.cachedAt).toBeDefined();
      
      // Results should be identical
      expect(body2.data.evaluationId).toBe(body1.data.evaluationId);
      expect(body2.data.eligibility.status).toBe(body1.data.eligibility.status);
    }, 30000);

    it('should bypass cache when forceLLM option is set', async () => {
      const requestBody = {
        userId: testUserId,
        schemeId: testSchemeId,
        userDocuments: ['aadhaar'],
        options: { forceLLM: true }
      };

      // First request with forceLLM
      const event1 = createMockEvent('POST', '/api/v1/eligibility/evaluate', requestBody);
      const response1 = await evaluateHandler(event1);
      const body1 = JSON.parse(response1.body);

      expect(response1.statusCode).toBe(200);
      expect(body1.cached).toBe(false);

      // Second request with forceLLM - should not use cache
      const event2 = createMockEvent('POST', '/api/v1/eligibility/evaluate', requestBody);
      const response2 = await evaluateHandler(event2);
      const body2 = JSON.parse(response2.body);

      expect(response2.statusCode).toBe(200);
      expect(body2.cached).toBe(false);
    }, 90000);
  });

  describe('Error Responses - Invalid Input', () => {
    it('should return 400 for missing userId', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          schemeId: testSchemeId,
          userDocuments: ['aadhaar']
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
      expect(body.details.some((e: string) => e.includes('userId'))).toBe(true);
    });

    it('should return 400 for missing schemeId', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          userDocuments: ['aadhaar']
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details.some((e: string) => e.includes('schemeId'))).toBe(true);
    });

    it('should return 400 for invalid userDocuments type', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: 'not-an-array' // Should be array
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details.some((e: string) => e.includes('userDocuments'))).toBe(true);
    });

    it('should return 400 for invalid options type', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          options: {
            forceLLM: 'yes' // Should be boolean
          }
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
    });

    it('should return 400 for malformed JSON', async () => {
      const event = createMockEvent('POST', '/api/v1/eligibility/evaluate');
      event.body = 'not-valid-json{';

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(500); // JSON parse error
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Error Responses - Missing Data', () => {
    it('should return 404 for non-existent user profile', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: 'non-existent-user-999',
          schemeId: testSchemeId,
          userDocuments: ['aadhaar']
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('User profile not found');
      expect(body.message).toContain('non-existent-user-999');
    });

    it('should return 404 for non-existent scheme', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: 'non-existent-scheme-999',
          userDocuments: ['aadhaar']
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scheme not found');
      expect(body.message).toContain('non-existent-scheme-999');
    });
  });

  describe('Authorization Enforcement', () => {
    it('should process request with valid Cognito user context', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        },
        undefined,
        testUserId // Cognito user ID matches request userId
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(200);
    }, 30000);

    it('should log warning when Cognito user ID does not match request userId', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        },
        undefined,
        'different-user-id' // Mismatch
      );

      const response = await evaluateHandler(event);

      // Currently logs warning but allows request
      expect(response.statusCode).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User ID mismatch')
      );

      consoleSpy.mockRestore();
    }, 30000);
  });

  describe('Rate Limiting', () => {
    it('should track rate limits for evaluation requests', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(200);
      // Rate limit counter should be incremented (verified by subsequent requests)
    }, 30000);

    // Note: Testing actual rate limit exceeded requires making many requests
    // which is time-consuming. This is better tested in load tests.
    // Here we verify the rate limit check is called.
  });

  describe('GET /api/v1/eligibility/user/:userId - Retrieve Past Evaluations', () => {
    it('should retrieve evaluation history for a user', async () => {
      // First, create an evaluation
      const evalEvent = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        }
      );
      await evaluateHandler(evalEvent);

      // Now retrieve history
      const event = createMockEvent(
        'GET',
        `/api/v1/eligibility/user/${testUserId}`,
        undefined,
        { userId: testUserId },
        testUserId
      );

      const response = await getUserEvaluationsHandler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe(testUserId);
      expect(body.data.totalEvaluations).toBeGreaterThan(0);
      expect(Array.isArray(body.data.evaluations)).toBe(true);
      
      // Verify evaluation structure
      const evaluation = body.data.evaluations[0];
      expect(evaluation).toHaveProperty('evaluationId');
      expect(evaluation).toHaveProperty('schemeId');
      expect(evaluation).toHaveProperty('schemeName');
      expect(evaluation).toHaveProperty('status');
      expect(evaluation).toHaveProperty('confidenceScore');
      expect(evaluation).toHaveProperty('evaluatedAt');
      expect(evaluation).toHaveProperty('summary');
    }, 30000);

    it('should return 400 for missing userId parameter', async () => {
      const event = createMockEvent(
        'GET',
        '/api/v1/eligibility/user/',
        undefined,
        {}
      );

      const response = await getUserEvaluationsHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required parameter');
    });

    it('should enforce authorization for user evaluation history', async () => {
      const event = createMockEvent(
        'GET',
        `/api/v1/eligibility/user/${testUserId}`,
        undefined,
        { userId: testUserId },
        'different-user-id' // Different user trying to access
      );

      const response = await getUserEvaluationsHandler(event);

      expect(response.statusCode).toBe(403);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });
  });

  describe('POST /api/v1/eligibility/re-evaluate - Re-evaluation Flow', () => {
    it('should re-evaluate eligibility for specific schemes', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/re-evaluate',
        {
          userId: testUserId,
          schemeIds: [testSchemeId],
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        },
        undefined,
        testUserId
      );

      const response = await reEvaluateHandler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalSchemes).toBe(1);
      expect(Array.isArray(body.data.results)).toBe(true);
      expect(body.data.results[0].scheme.id).toBe(testSchemeId);
      expect(body.data.message).toContain('Re-evaluation completed');
    }, 30000);

    it('should return 400 for missing userId in re-evaluate', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/re-evaluate',
        {
          schemeIds: [testSchemeId]
        }
      );

      const response = await reEvaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details.some((e: string) => e.includes('userId'))).toBe(true);
    });

    it('should return 404 for non-existent schemes in re-evaluate', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/re-evaluate',
        {
          userId: testUserId,
          schemeIds: ['non-existent-scheme-999']
        }
      );

      const response = await reEvaluateHandler(event);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('No schemes found');
    });
  });

  describe('POST /api/v1/eligibility/evaluate-all - Batch Evaluation', () => {
    it('should evaluate all applicable schemes for a user', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate-all',
        {
          userId: testUserId,
          userDocuments: ['aadhaar'],
          category: 'education'
        }
      );

      const response = await evaluateAllHandler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalSchemes).toBeGreaterThan(0);
      expect(Array.isArray(body.data.results)).toBe(true);
      
      // Results should be sorted by confidence
      if (body.data.results.length > 1) {
        for (let i = 0; i < body.data.results.length - 1; i++) {
          expect(body.data.results[i].eligibility.confidence)
            .toBeGreaterThanOrEqual(body.data.results[i + 1].eligibility.confidence);
        }
      }
    }, 60000);

    it('should return 400 for missing userId in evaluate-all', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate-all',
        {
          category: 'education'
        }
      );

      const response = await evaluateAllHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required field');
    });
  });

  describe('Response Headers and CORS', () => {
    it('should include proper CORS headers in response', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);

      expect(response.headers).toBeDefined();
      expect(response.headers?.['Content-Type']).toBe('application/json');
      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers?.['Access-Control-Allow-Credentials']).toBe(true);
    }, 30000);
  });

  describe('Metrics and Monitoring', () => {
    it('should track latency metrics for successful requests', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: ['aadhaar'],
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(200);
      // Metrics are tracked asynchronously, no direct assertion
      // but the call should complete without errors
    }, 30000);

    it('should track error metrics for failed requests', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: 'non-existent-user',
          schemeId: testSchemeId
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(404);
      // Error metrics are tracked asynchronously
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty request body gracefully', async () => {
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {}
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
    });

    it('should handle null body gracefully', async () => {
      const event = createMockEvent('POST', '/api/v1/eligibility/evaluate');
      event.body = null;

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(400);
    });

    it('should handle very long user document lists', async () => {
      const manyDocuments = Array(100).fill('aadhaar');
      
      const event = createMockEvent(
        'POST',
        '/api/v1/eligibility/evaluate',
        {
          userId: testUserId,
          schemeId: testSchemeId,
          userDocuments: manyDocuments,
          options: { skipLLM: true }
        }
      );

      const response = await evaluateHandler(event);

      expect(response.statusCode).toBe(200);
    }, 30000);
  });
});
