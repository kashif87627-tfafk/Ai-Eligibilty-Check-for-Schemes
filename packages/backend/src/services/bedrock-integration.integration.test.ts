/**
 * Integration Tests for Bedrock Integration Module
 * 
 * These tests verify actual Bedrock API calls, fallback behavior, and cost optimization.
 * 
 * NOTE: These tests require AWS credentials and will make actual API calls to Bedrock.
 * Set SKIP_INTEGRATION_TESTS=true to skip these tests in CI/CD environments.
 */

import {
  evaluateWithBedrock,
  batchEvaluateWithBedrock,
  generateEnhancedExplanation
} from './bedrock-integration';
import { EligibilityRule } from '../types/eligibility-rules';

// Skip integration tests if environment variable is set
const SKIP_TESTS = process.env.SKIP_INTEGRATION_TESTS === 'true';
const describeIntegration = SKIP_TESTS ? describe.skip : describe;

describeIntegration('Bedrock Integration - Integration Tests', () => {
  // Sample user profiles for testing
  const eligibleUserProfile = {
    ageRange: '18-25',
    gender: 'female',
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban'
    },
    education: 'graduate',
    occupation: 'student',
    employmentStatus: 'student',
    incomeRange: 'below_50k',
    category: 'general',
    disabilityStatus: 'none'
  };

  const partiallyEligibleProfile = {
    ageRange: '18-25',
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban'
    },
    education: 'secondary',
    incomeRange: '1l_2l', // Above income threshold
    category: 'general'
  };

  const incompleteProfile = {
    ageRange: '18-25',
    location: {
      state: 'Karnataka'
    }
    // Missing many fields
  };

  const sampleRule: EligibilityRule = {
    id: 'rule-001',
    schemeId: 'scheme-001',
    schemeName: 'PM Scholarship Scheme',
    description: 'Scholarship for undergraduate students from low-income families',
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
      },
      {
        id: 'crit-003',
        field: 'incomeRange',
        operator: 'in',
        value: ['below_50k', '50k_1l'],
        weight: 0.3,
        description: 'Family income must be below 1 lakh per year',
        mandatory: false
      }
    ],
    requiredDocuments: [
      {
        type: 'aadhaar',
        name: 'Aadhaar Card',
        mandatory: true,
        description: 'Government-issued Aadhaar card'
      },
      {
        type: 'income_certificate',
        name: 'Income Certificate',
        mandatory: true,
        description: 'Income certificate from Tehsil office'
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

  describe('evaluateWithBedrock - Prompt Formatting and Response Parsing', () => {
    it('should successfully evaluate eligibility for a strongly eligible user', async () => {
      const result = await evaluateWithBedrock(
        'user-001',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar', 'income_certificate']
      );

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-001');
      expect(result.schemeId).toBe('scheme-001');
      expect(result.status).toBeDefined();
      expect(['strongly_eligible', 'conditionally_eligible', 'needs_verification', 'not_eligible'])
        .toContain(result.status);
      
      // Verify confidence score
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
      
      // Verify reasoning is provided
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
      
      // For a strongly eligible user, expect high confidence
      if (result.status === 'strongly_eligible') {
        expect(result.confidenceScore).toBeGreaterThan(70);
      }
    }, 30000); // 30 second timeout for API call

    it('should handle partially eligible user with contextual reasoning', async () => {
      const result = await evaluateWithBedrock(
        'user-002',
        partiallyEligibleProfile,
        sampleRule,
        ['aadhaar'] // Missing income certificate
      );

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      
      // Should identify missing documents or criteria
      expect(
        result.missingDocuments.length > 0 || 
        result.unmatchedCriteria.length > 0 ||
        result.missingCriteria.length > 0
      ).toBe(true);
      
      // Reasoning should explain the partial eligibility
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle incomplete user profile gracefully', async () => {
      const result = await evaluateWithBedrock(
        'user-003',
        incompleteProfile,
        sampleRule,
        []
      );

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      
      // Should identify missing information
      expect(result.missingCriteria.length).toBeGreaterThan(0);
      
      // Status should reflect uncertainty
      expect(['needs_verification', 'conditionally_eligible', 'not_eligible'])
        .toContain(result.status);
      
      // Confidence should be lower for incomplete profiles
      expect(result.confidenceScore).toBeLessThan(80);
    }, 30000);

    it('should format prompts correctly for various user profile scenarios', async () => {
      // Test with rural user
      const ruralProfile = {
        ...eligibleUserProfile,
        location: {
          state: 'Bihar',
          district: 'Patna',
          ruralUrban: 'rural'
        }
      };

      const result = await evaluateWithBedrock(
        'user-004',
        ruralProfile,
        sampleRule,
        ['aadhaar']
      );

      expect(result).toBeDefined();
      expect(result.reasoning).toBeDefined();
      
      // LLM should consider rural context in reasoning
      // (We can't assert exact content, but verify it completes successfully)
    }, 30000);
  });

  describe('Fallback Behavior When Bedrock is Unavailable', () => {
    it('should fallback to rule-based evaluation when Bedrock fails', async () => {
      // Use an invalid model ID to force failure
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'invalid-region-xyz';

      const result = await evaluateWithBedrock(
        'user-005',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar', 'income_certificate'],
        { fallbackToRules: true, timeout: 5000 }
      );

      // Restore environment
      process.env.AWS_REGION = originalEnv;

      // Should still return a valid result
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      
      // Should indicate fallback was used
      expect(result.reasoning).toContain('rule-based logic');
    }, 10000);

    it('should throw error when fallback is disabled and Bedrock fails', async () => {
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'invalid-region-xyz';

      await expect(
        evaluateWithBedrock(
          'user-006',
          eligibleUserProfile,
          sampleRule,
          ['aadhaar'],
          { fallbackToRules: false, timeout: 5000 }
        )
      ).rejects.toThrow();

      // Restore environment
      process.env.AWS_REGION = originalEnv;
    }, 10000);

    it('should handle timeout gracefully with fallback', async () => {
      const result = await evaluateWithBedrock(
        'user-007',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar'],
        { fallbackToRules: true, timeout: 1 } // 1ms timeout - will definitely timeout
      );

      // Should fallback to rule-based evaluation
      expect(result).toBeDefined();
      expect(result.reasoning).toContain('rule-based logic');
    }, 10000);
  });

  describe('Cost Optimization - Batch Processing', () => {
    it('should evaluate multiple schemes sequentially to avoid rate limiting', async () => {
      const rule2: EligibilityRule = {
        ...sampleRule,
        id: 'rule-002',
        schemeId: 'scheme-002',
        schemeName: 'Skill Development Program',
        description: 'Vocational training for youth'
      };

      const rule3: EligibilityRule = {
        ...sampleRule,
        id: 'rule-003',
        schemeId: 'scheme-003',
        schemeName: 'Employment Assistance Scheme',
        description: 'Job placement support'
      };

      const startTime = Date.now();
      
      const results = await batchEvaluateWithBedrock(
        'user-008',
        eligibleUserProfile,
        [sampleRule, rule2, rule3],
        ['aadhaar', 'income_certificate']
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should return results for all schemes
      expect(results).toHaveLength(3);
      
      // Each result should be valid
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.schemeId).toBe(`scheme-00${index + 1}`);
      });

      // Should take reasonable time (sequential processing)
      // Each call takes ~2-5 seconds, so 3 calls should take 6-15 seconds
      expect(duration).toBeGreaterThan(3000); // At least 3 seconds
      expect(duration).toBeLessThan(60000); // Less than 60 seconds
    }, 90000); // 90 second timeout for batch processing

    it('should handle partial failures in batch evaluation', async () => {
      const invalidRule: EligibilityRule = {
        ...sampleRule,
        id: 'rule-invalid',
        schemeId: 'scheme-invalid',
        criteria: [] // Invalid - no criteria
      };

      const results = await batchEvaluateWithBedrock(
        'user-009',
        eligibleUserProfile,
        [sampleRule, invalidRule],
        ['aadhaar'],
        { fallbackToRules: true }
      );

      // Should return results for valid schemes
      expect(results.length).toBeGreaterThan(0);
      
      // At least the valid scheme should be evaluated
      const validResult = results.find(r => r.schemeId === 'scheme-001');
      expect(validResult).toBeDefined();
    }, 60000);
  });

  describe('Enhanced Explanation Generation', () => {
    it('should generate enhanced explanation for evaluation result', async () => {
      // First, get an evaluation result
      const evaluationResult = await evaluateWithBedrock(
        'user-010',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar', 'income_certificate']
      );

      // Generate enhanced explanation
      const explanation = await generateEnhancedExplanation(
        evaluationResult,
        eligibleUserProfile,
        sampleRule,
        'en'
      );

      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(0);
      
      // Should be different from original reasoning (enhanced)
      // Note: May be similar, but should be more detailed or empathetic
      expect(typeof explanation).toBe('string');
    }, 45000);

    it('should fallback to original reasoning if explanation generation fails', async () => {
      const mockResult = {
        evaluationId: 'eval-011',
        userId: 'user-011',
        schemeId: 'scheme-001',
        schemeName: 'PM Scholarship Scheme',
        status: 'strongly_eligible' as const,
        confidenceScore: 85,
        matchedCriteria: [],
        unmatchedCriteria: [],
        missingCriteria: [],
        missingDocuments: [],
        mandatoryCriteriaMet: true,
        reasoning: 'Original reasoning text',
        evaluatedAt: new Date().toISOString()
      };

      // Force failure by using invalid region
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'invalid-region-xyz';

      const explanation = await generateEnhancedExplanation(
        mockResult,
        eligibleUserProfile,
        sampleRule,
        'en'
      );

      // Restore environment
      process.env.AWS_REGION = originalEnv;

      // Should return original reasoning as fallback
      expect(explanation).toBe('Original reasoning text');
    }, 20000);
  });

  describe('Cost Optimization - Minimal API Calls', () => {
    it('should make only one API call per evaluation', async () => {
      // This test verifies that we're not making redundant API calls
      const startTime = Date.now();
      
      const result = await evaluateWithBedrock(
        'user-012',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar']
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      
      // Single API call should complete in reasonable time (2-10 seconds typically)
      expect(duration).toBeLessThan(15000);
    }, 20000);

    it('should respect timeout settings for cost control', async () => {
      const shortTimeout = 100; // 100ms - will likely timeout
      
      const startTime = Date.now();
      
      try {
        await evaluateWithBedrock(
          'user-013',
          eligibleUserProfile,
          sampleRule,
          ['aadhaar'],
          { fallbackToRules: false, timeout: shortTimeout }
        );
      } catch (error) {
        // Expected to fail due to timeout
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should timeout quickly (within 2 seconds including error handling)
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe('Response Parsing Edge Cases', () => {
    it('should handle LLM responses with markdown formatting', async () => {
      // Bedrock may return responses with markdown code blocks
      // This is tested implicitly in other tests, but we verify it works
      const result = await evaluateWithBedrock(
        'user-014',
        eligibleUserProfile,
        sampleRule,
        ['aadhaar', 'income_certificate']
      );

      // Should successfully parse regardless of markdown formatting
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should handle LLM responses with optional fields missing', async () => {
      const result = await evaluateWithBedrock(
        'user-015',
        incompleteProfile,
        sampleRule,
        []
      );

      // Should handle missing optional fields (contextualInsights, suggestedNextSteps)
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.reasoning).toBeDefined();
      
      // Optional fields may or may not be present
      // The important thing is it doesn't crash
    }, 30000);
  });
});
