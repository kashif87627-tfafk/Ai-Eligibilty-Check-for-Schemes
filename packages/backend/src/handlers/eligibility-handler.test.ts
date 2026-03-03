/**
 * Unit Tests for Eligibility Handler
 * 
 * Tests API Gateway endpoints for eligibility evaluation
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

// Declare mocks before jest.mock calls for proper hoisting
const mockEvaluateHybrid = jest.fn();
const mockBatchEvaluateHybrid = jest.fn();
const mockFormatHybridResponse = jest.fn();
const mockSortHybridByConfidence = jest.fn();
const mockGetEligibilityRulesBySchemeId = jest.fn();
const mockGetAllEligibilityRules = jest.fn();
const mockGetById = jest.fn();
const mockSend = jest.fn();
const mockGetCachedEvaluationResult = jest.fn();
const mockCacheEvaluationResult = jest.fn();
const mockTrackLatency = jest.fn();
const mockTrackError = jest.fn();
const mockTrackCacheHit = jest.fn();
const mockCreateTimer = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockIncrementRateLimit = jest.fn();

// Mock all dependencies
jest.mock('../services/hybrid-eligibility-service', () => ({
  evaluateHybrid: (...args: any[]) => mockEvaluateHybrid(...args),
  batchEvaluateHybrid: (...args: any[]) => mockBatchEvaluateHybrid(...args),
  formatHybridResponse: (...args: any[]) => mockFormatHybridResponse(...args),
  sortHybridByConfidence: (...args: any[]) => mockSortHybridByConfidence(...args)
}));

jest.mock('../services/evaluation-cache', () => ({
  getCachedEvaluationResult: (...args: any[]) => mockGetCachedEvaluationResult(...args),
  cacheEvaluationResult: (...args: any[]) => mockCacheEvaluationResult(...args)
}));

jest.mock('../services/metrics', () => ({
  trackLatency: (...args: any[]) => mockTrackLatency(...args),
  trackError: (...args: any[]) => mockTrackError(...args),
  trackCacheHit: (...args: any[]) => mockTrackCacheHit(...args),
  createTimer: () => mockCreateTimer()
}));

jest.mock('../services/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  incrementRateLimit: (...args: any[]) => mockIncrementRateLimit(...args)
}));

jest.mock('../repositories/eligibility-rule-repository', () => ({
  getEligibilityRulesBySchemeId: (...args: any[]) => mockGetEligibilityRulesBySchemeId(...args),
  getAllEligibilityRules: (...args: any[]) => mockGetAllEligibilityRules(...args),
  getEligibilityRulesByCategory: jest.fn(),
  getEligibilityRulesByStateAndCategory: jest.fn()
}));

jest.mock('../repositories/user-profile-repository', () => ({
  UserProfileRepository: jest.fn(() => ({
    getById: (...args: any[]) => mockGetById(...args)
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: (...args: any[]) => mockSend(...args)
    }))
  },
  PutCommand: jest.fn().mockImplementation((params) => params),
  GetCommand: jest.fn().mockImplementation((params) => params),
  QueryCommand: jest.fn().mockImplementation((params) => params),
  UpdateCommand: jest.fn().mockImplementation((params) => params)
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

// Now import the handlers
import { 
  evaluateHandler, 
  getUserEvaluationsHandler, 
  reEvaluateHandler 
} from './eligibility-handler';

describe('Eligibility Handler', () => {
  let mockUserProfile: any;
  let mockEligibilityRule: any;
  let mockHybridResult: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user profile
    mockUserProfile = {
      id: 'user-123',
      phoneNumber: '+919876543210',
      ageRange: '18-25',
      location: {
        state: 'Karnataka',
        district: 'Bangalore',
        ruralUrban: 'urban'
      },
      education: 'graduate',
      category: 'obc',
      consentGiven: true
    };

    // Mock eligibility rule
    mockEligibilityRule = {
      id: 'rule-1',
      schemeId: 'scheme-123',
      schemeName: 'PM Scholarship',
      criteria: [],
      documents: []
    };

    // Mock hybrid evaluation result
    mockHybridResult = {
      evaluationId: 'eval-123',
      userId: 'user-123',
      schemeId: 'scheme-123',
      schemeName: 'PM Scholarship',
      status: 'strongly_eligible',
      confidenceScore: 90,
      matchedCriteria: [],
      unmatchedCriteria: [],
      missingCriteria: [],
      missingDocuments: [],
      mandatoryCriteriaMet: true,
      reasoning: 'User meets all criteria',
      evaluatedAt: '2024-01-01T00:00:00Z',
      usedLLM: true,
      evaluationMethod: 'llm_enhanced',
      ruleBasedConfidence: 85
    };

    // Set default mock return values
    mockGetById.mockResolvedValue(mockUserProfile);
    mockGetCachedEvaluationResult.mockResolvedValue(null); // No cache by default
    mockCacheEvaluationResult.mockResolvedValue(undefined);
    mockTrackLatency.mockResolvedValue(undefined);
    mockTrackError.mockResolvedValue(undefined);
    mockTrackCacheHit.mockResolvedValue(undefined);
    mockCreateTimer.mockReturnValue({ stop: () => 100 });
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: new Date().toISOString() });
    mockIncrementRateLimit.mockResolvedValue(undefined);
  });

  describe('POST /api/v1/eligibility/evaluate', () => {
    it('should evaluate eligibility successfully', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          userId: 'user-123',
          schemeId: 'scheme-123',
          userDocuments: ['aadhaar', 'income_certificate']
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        } as any
      };

      mockGetEligibilityRulesBySchemeId.mockResolvedValue([mockEligibilityRule]);
      mockEvaluateHybrid.mockResolvedValue(mockHybridResult);
      mockFormatHybridResponse.mockReturnValue({
        evaluationId: 'eval-123',
        eligibility: {
          status: 'strongly_eligible',
          confidence: 90
        }
      });
      mockSend.mockResolvedValue({});

      const result = await evaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        cached: false,
        data: expect.objectContaining({
          evaluationId: 'eval-123'
        })
      });
      expect(mockEvaluateHybrid).toHaveBeenCalledWith(
        'user-123',
        mockUserProfile,
        mockEligibilityRule,
        ['aadhaar', 'income_certificate'],
        {}
      );
    });

    it('should return 400 for missing userId', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          schemeId: 'scheme-123'
        })
      };

      const result = await evaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('userId')
        ])
      });
    });

    it('should return 400 for missing schemeId', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          userId: 'user-123'
        })
      };

      const result = await evaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('schemeId')
        ])
      });
    });

    it('should return 404 for non-existent user profile', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          userId: 'user-999',
          schemeId: 'scheme-123'
        })
      };

      mockGetById.mockResolvedValueOnce(null);

      const result = await evaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: 'User profile not found',
        message: expect.stringContaining('user-999')
      });
    });

    it('should return 404 for non-existent scheme', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          userId: 'user-123',
          schemeId: 'scheme-999'
        })
      };

      mockGetEligibilityRulesBySchemeId.mockResolvedValue([]);

      const result = await evaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Scheme not found',
        message: expect.stringContaining('scheme-999')
      });
    });

    it('should handle evaluation options', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/evaluate',
        body: JSON.stringify({
          userId: 'user-123',
          schemeId: 'scheme-123',
          options: {
            forceLLM: true,
            language: 'hi'
          }
        })
      };

      mockGetEligibilityRulesBySchemeId.mockResolvedValue([mockEligibilityRule]);
      mockEvaluateHybrid.mockResolvedValue(mockHybridResult);
      mockFormatHybridResponse.mockReturnValue({});
      mockSend.mockResolvedValue({});

      await evaluateHandler(event as APIGatewayProxyEvent);

      expect(mockEvaluateHybrid).toHaveBeenCalledWith(
        'user-123',
        mockUserProfile,
        mockEligibilityRule,
        [],
        { forceLLM: true, language: 'hi' }
      );
    });
  });

  describe('GET /api/v1/eligibility/user/:userId', () => {
    it('should retrieve user evaluation history', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/api/v1/eligibility/user/user-123',
        pathParameters: {
          userId: 'user-123'
        },
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        } as any
      };

      mockSend.mockResolvedValue({
        Items: [
          {
            evaluationId: 'eval-1',
            schemeId: 'scheme-123',
            schemeName: 'PM Scholarship',
            status: 'strongly_eligible',
            confidenceScore: 90,
            usedLLM: true,
            evaluationMethod: 'llm_enhanced',
            evaluatedAt: '2024-01-01T00:00:00Z',
            result: {
              matchedCriteria: [1, 2, 3],
              unmatchedCriteria: [],
              missingCriteria: [],
              missingDocuments: []
            }
          }
        ]
      });

      const result = await getUserEvaluationsHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe('user-123');
      expect(body.data.evaluations).toHaveLength(1);
      expect(body.data.evaluations[0]).toEqual({
        evaluationId: 'eval-1',
        schemeId: 'scheme-123',
        schemeName: 'PM Scholarship',
        status: 'strongly_eligible',
        confidenceScore: 90,
        usedLLM: true,
        evaluationMethod: 'llm_enhanced',
        evaluatedAt: '2024-01-01T00:00:00Z',
        summary: {
          matchedCriteria: 3,
          unmatchedCriteria: 0,
          missingCriteria: 0,
          missingDocuments: 0
        }
      });
    });

    it('should return 400 for missing userId parameter', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/api/v1/eligibility/user/',
        pathParameters: {}
      };

      const result = await getUserEvaluationsHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing required parameter: userId'
      });
    });

    it('should return 403 when accessing another user\'s history', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/api/v1/eligibility/user/user-456',
        pathParameters: {
          userId: 'user-456'
        },
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        } as any
      };

      const result = await getUserEvaluationsHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Forbidden',
        message: expect.stringContaining('your own')
      });
    });
  });

  describe('POST /api/v1/eligibility/re-evaluate', () => {
    it('should re-evaluate specific schemes', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/re-evaluate',
        body: JSON.stringify({
          userId: 'user-123',
          schemeIds: ['scheme-123', 'scheme-456']
        })
      };

      mockGetEligibilityRulesBySchemeId
        .mockResolvedValueOnce([mockEligibilityRule])
        .mockResolvedValueOnce([{ ...mockEligibilityRule, schemeId: 'scheme-456' }]);
      
      mockBatchEvaluateHybrid.mockResolvedValue([
        mockHybridResult,
        { ...mockHybridResult, schemeId: 'scheme-456' }
      ]);
      
      mockSortHybridByConfidence.mockReturnValue([
        mockHybridResult,
        { ...mockHybridResult, schemeId: 'scheme-456' }
      ]);
      
      mockFormatHybridResponse.mockReturnValue({});
      mockSend.mockResolvedValue({});

      const result = await reEvaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.totalSchemes).toBe(2);
      expect(mockBatchEvaluateHybrid).toHaveBeenCalled();
    });

    it('should re-evaluate all schemes when schemeIds not provided', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/re-evaluate',
        body: JSON.stringify({
          userId: 'user-123'
        })
      };

      mockGetAllEligibilityRules.mockResolvedValue([mockEligibilityRule]);
      mockBatchEvaluateHybrid.mockResolvedValue([mockHybridResult]);
      mockSortHybridByConfidence.mockReturnValue([mockHybridResult]);
      mockFormatHybridResponse.mockReturnValue({});
      mockSend.mockResolvedValue({});

      const result = await reEvaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetAllEligibilityRules).toHaveBeenCalled();
    });

    it('should return 400 for missing userId', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/re-evaluate',
        body: JSON.stringify({
          schemeIds: ['scheme-123']
        })
      };

      const result = await reEvaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('userId')
        ])
      });
    });

    it('should return 404 when no schemes found', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/api/v1/eligibility/re-evaluate',
        body: JSON.stringify({
          userId: 'user-123',
          schemeIds: ['scheme-999']
        })
      };

      mockGetById.mockResolvedValueOnce(mockUserProfile);
      mockGetEligibilityRulesBySchemeId.mockResolvedValue([]);

      const result = await reEvaluateHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: 'No schemes found',
        message: expect.stringContaining('None of the specified')
      });
    });
  });
});
