/**
 * Tests for Bedrock Integration Module
 */

import { formatPromptForLLM, parseLLMResponse } from './bedrock-integration';
import { EligibilityRule } from '../types/eligibility-rules';

describe('Bedrock Integration', () => {
  describe('formatPromptForLLM', () => {
    const sampleUserProfile = {
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

    const sampleRule: EligibilityRule = {
      id: 'rule-001',
      schemeId: 'scheme-001',
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

    it('should format a complete prompt with all user profile fields', () => {
      const prompt = formatPromptForLLM(sampleUserProfile, sampleRule);

      expect(prompt).toContain('PM Scholarship Scheme');
      expect(prompt).toContain('Age Range: 18-25');
      expect(prompt).toContain('Karnataka');
      expect(prompt).toContain('Bangalore Urban');
      expect(prompt).toContain('graduate');
      expect(prompt).toContain('student');
      expect(prompt).toContain('below_50k');
    });

    it('should include all eligibility criteria in the prompt', () => {
      const prompt = formatPromptForLLM(sampleUserProfile, sampleRule);

      expect(prompt).toContain('Age must be between 18-35 years');
      expect(prompt).toContain('[MANDATORY]');
      expect(prompt).toContain('Family income must be below 1 lakh per year');
    });

    it('should include required documents in the prompt', () => {
      const prompt = formatPromptForLLM(sampleUserProfile, sampleRule);

      expect(prompt).toContain('Aadhaar Card');
      expect(prompt).toContain('[REQUIRED]');
      expect(prompt).toContain('Income Certificate');
    });

    it('should handle missing user profile fields gracefully', () => {
      const incompleteProfile = {
        ageRange: '18-25',
        location: {
          state: 'Karnataka'
        }
      };

      const prompt = formatPromptForLLM(incompleteProfile, sampleRule);

      expect(prompt).toContain('Age Range: 18-25');
      expect(prompt).toContain('Gender: Not provided');
      expect(prompt).toContain('Education: Not provided');
      expect(prompt).toContain('Not provided');
    });

    it('should format range criteria correctly', () => {
      const ruleWithRange: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-range',
            field: 'age',
            operator: 'range',
            value: { min: 18, max: 35 },
            weight: 1.0,
            description: 'Age must be between 18 and 35',
            mandatory: true
          }
        ]
      };

      const prompt = formatPromptForLLM(sampleUserProfile, ruleWithRange);

      expect(prompt).toContain('18 to 35');
    });

    it('should format array criteria correctly', () => {
      const prompt = formatPromptForLLM(sampleUserProfile, sampleRule);

      expect(prompt).toContain('18-25, 26-35');
    });

    it('should include JSON output format instructions', () => {
      const prompt = formatPromptForLLM(sampleUserProfile, sampleRule);

      expect(prompt).toContain('JSON format');
      expect(prompt).toContain('"status"');
      expect(prompt).toContain('"confidence"');
      expect(prompt).toContain('"reasoning"');
    });
  });

  describe('parseLLMResponse', () => {
    it('should parse a valid JSON response', () => {
      const validResponse = JSON.stringify({
        status: 'strongly_eligible',
        confidence: 85,
        reasoning: 'You meet all the mandatory criteria for this scheme.',
        contextualInsights: 'Your urban location provides easy access to application facilities.',
        suggestedNextSteps: [
          'Gather your Aadhaar card',
          'Obtain income certificate from Tehsil office',
          'Apply online before the deadline'
        ]
      });

      const parsed = parseLLMResponse(validResponse);

      expect(parsed.status).toBe('strongly_eligible');
      expect(parsed.confidence).toBe(85);
      expect(parsed.reasoning).toContain('mandatory criteria');
      expect(parsed.contextualInsights).toContain('urban location');
      expect(parsed.suggestedNextSteps).toHaveLength(3);
    });

    it('should parse response with markdown code blocks', () => {
      const responseWithMarkdown = `\`\`\`json
{
  "status": "conditionally_eligible",
  "confidence": 65,
  "reasoning": "You meet most criteria but need to verify income."
}
\`\`\``;

      const parsed = parseLLMResponse(responseWithMarkdown);

      expect(parsed.status).toBe('conditionally_eligible');
      expect(parsed.confidence).toBe(65);
    });

    it('should parse response without optional fields', () => {
      const minimalResponse = JSON.stringify({
        status: 'needs_verification',
        confidence: 45,
        reasoning: 'Some information is missing from your profile.'
      });

      const parsed = parseLLMResponse(minimalResponse);

      expect(parsed.status).toBe('needs_verification');
      expect(parsed.confidence).toBe(45);
      expect(parsed.suggestedNextSteps).toEqual([]);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = 'This is not valid JSON';

      expect(() => parseLLMResponse(invalidJson)).toThrow('Failed to parse LLM response');
    });

    it('should throw error for missing required fields', () => {
      const missingFields = JSON.stringify({
        status: 'strongly_eligible'
        // Missing confidence and reasoning
      });

      expect(() => parseLLMResponse(missingFields)).toThrow('Missing required fields');
    });

    it('should throw error for invalid status value', () => {
      const invalidStatus = JSON.stringify({
        status: 'invalid_status',
        confidence: 80,
        reasoning: 'Some reasoning'
      });

      expect(() => parseLLMResponse(invalidStatus)).toThrow('Invalid status value');
    });

    it('should throw error for confidence out of range', () => {
      const outOfRange = JSON.stringify({
        status: 'strongly_eligible',
        confidence: 150,
        reasoning: 'Some reasoning'
      });

      expect(() => parseLLMResponse(outOfRange)).toThrow('Confidence score out of range');
    });

    it('should handle all valid eligibility statuses', () => {
      const statuses = [
        'strongly_eligible',
        'conditionally_eligible',
        'needs_verification',
        'not_eligible'
      ];

      statuses.forEach(status => {
        const response = JSON.stringify({
          status,
          confidence: 50,
          reasoning: 'Test reasoning'
        });

        const parsed = parseLLMResponse(response);
        expect(parsed.status).toBe(status);
      });
    });

    it('should handle confidence at boundary values', () => {
      const minConfidence = JSON.stringify({
        status: 'not_eligible',
        confidence: 0,
        reasoning: 'No criteria matched'
      });

      const maxConfidence = JSON.stringify({
        status: 'strongly_eligible',
        confidence: 100,
        reasoning: 'All criteria matched perfectly'
      });

      expect(parseLLMResponse(minConfidence).confidence).toBe(0);
      expect(parseLLMResponse(maxConfidence).confidence).toBe(100);
    });

    it('should preserve special characters in reasoning', () => {
      const specialChars = JSON.stringify({
        status: 'strongly_eligible',
        confidence: 90,
        reasoning: 'You meet criteria: age (18-25), income (<₹50k), & education!'
      });

      const parsed = parseLLMResponse(specialChars);
      expect(parsed.reasoning).toContain('₹50k');
      expect(parsed.reasoning).toContain('&');
    });

    it('should handle empty suggested next steps array', () => {
      const emptySteps = JSON.stringify({
        status: 'strongly_eligible',
        confidence: 95,
        reasoning: 'Fully eligible',
        suggestedNextSteps: []
      });

      const parsed = parseLLMResponse(emptySteps);
      expect(parsed.suggestedNextSteps).toEqual([]);
    });
  });
});
