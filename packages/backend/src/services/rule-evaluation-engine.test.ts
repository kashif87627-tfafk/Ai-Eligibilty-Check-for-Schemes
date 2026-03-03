/**
 * Unit Tests for Rule Evaluation Engine
 * 
 * Tests the core eligibility evaluation logic including:
 * - Criterion matching (exact, range, approximate)
 * - Confidence score calculation
 * - Missing criteria identification
 * - Document gap detection
 */

import { describe, it, expect } from '@jest/globals';
import { 
  evaluateEligibility, 
  batchEvaluateEligibility,
  filterByStatus,
  sortByConfidence
} from './rule-evaluation-engine';
import { EligibilityRule } from '../types/eligibility-rules';
import { UserProfile } from '../types/user-profile';

// Sample user profile for testing
const sampleUserProfile: UserProfile = {
  id: 'user-123',
  phoneNumber: '+919876543210',
  ageRange: '18-25',
  gender: 'male',
  location: {
    state: 'Karnataka',
    district: 'Bangalore Urban',
    ruralUrban: 'urban'
  },
  education: 'graduate',
  occupation: 'Student',
  employmentStatus: 'student',
  incomeRange: '50k_1l',
  category: 'obc',
  disabilityStatus: 'none',
  language: 'en',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Sample eligibility rule for testing
const sampleRule: EligibilityRule = {
  id: 'rule-test-001',
  schemeId: 'scheme-test-001',
  schemeName: 'Test Scholarship Scheme',
  description: 'Test scheme for unit testing',
  category: 'education',
  targetAudience: ['students'],
  criteria: [
    {
      id: 'crit-age',
      field: 'ageRange',
      operator: 'in',
      value: ['18-25', '26-35'],
      weight: 0.2,
      description: 'Age must be between 18-35',
      mandatory: true
    },
    {
      id: 'crit-education',
      field: 'education',
      operator: 'in',
      value: ['secondary', 'graduate', 'postgraduate'],
      weight: 0.3,
      description: 'Must have secondary education or higher',
      mandatory: true
    },
    {
      id: 'crit-income',
      field: 'incomeRange',
      operator: 'in',
      value: ['below_50k', '50k_1l'],
      weight: 0.3,
      description: 'Income must be below 1 lakh',
      mandatory: true
    },
    {
      id: 'crit-category',
      field: 'category',
      operator: 'in',
      value: ['sc', 'st', 'obc'],
      weight: 0.2,
      description: 'Preference for SC/ST/OBC',
      mandatory: false
    }
  ],
  requiredDocuments: [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Valid Aadhaar card'
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Income certificate from authority'
    },
    {
      type: 'education',
      name: 'Educational Certificates',
      mandatory: true,
      description: 'Mark sheets and certificates'
    }
  ],
  applicableStates: ['Karnataka'],
  ruralUrbanFilter: 'both',
  isOpenEnded: true,
  applicationMode: 'online',
  trustLevel: 'verified',
  sourceUrl: 'https://example.com',
  lastVerified: '2024-01-01',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

describe('Rule Evaluation Engine', () => {
  describe('evaluateEligibility', () => {
    it('should return strongly_eligible when all criteria are met', () => {
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        ['aadhaar', 'income_certificate', 'education']
      );
      
      expect(result.status).toBe('strongly_eligible');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(result.mandatoryCriteriaMet).toBe(true);
      expect(result.matchedCriteria).toHaveLength(4);
      expect(result.unmatchedCriteria).toHaveLength(0);
      expect(result.missingDocuments).toHaveLength(0);
    });
    
    it('should return conditionally_eligible when some optional criteria are not met', () => {
      const profileWithoutCategory = {
        ...sampleUserProfile,
        category: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithoutCategory,
        sampleRule,
        ['aadhaar', 'income_certificate', 'education']
      );
      
      expect(result.status).toBe('strongly_eligible'); // Still strongly eligible because category is optional
      expect(result.mandatoryCriteriaMet).toBe(true);
      expect(result.matchedCriteria).toHaveLength(3);
      expect(result.missingCriteria).toHaveLength(1);
    });
    
    it('should return not_eligible when mandatory criteria are not met', () => {
      const profileWrongAge = {
        ...sampleUserProfile,
        ageRange: '60+' as const
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWrongAge,
        sampleRule,
        ['aadhaar', 'income_certificate', 'education']
      );
      
      expect(result.status).toBe('not_eligible');
      expect(result.mandatoryCriteriaMet).toBe(false);
      expect(result.confidenceScore).toBeLessThanOrEqual(20);
    });
    
    it('should identify missing criteria from user profile', () => {
      const incompleteProfile = {
        ...sampleUserProfile,
        education: undefined,
        incomeRange: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        incompleteProfile,
        sampleRule,
        []
      );
      
      expect(result.missingCriteria.length).toBeGreaterThan(0);
      expect(result.mandatoryCriteriaMet).toBe(false);
      expect(result.status).toBe('not_eligible');
    });
    
    it('should identify missing documents', () => {
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        ['aadhaar'] // Only one document provided
      );
      
      expect(result.missingDocuments).toHaveLength(2);
      expect(result.missingDocuments.some(d => d.document.type === 'income_certificate')).toBe(true);
      expect(result.missingDocuments.some(d => d.document.type === 'education')).toBe(true);
    });
    
    it('should handle nested field paths correctly', () => {
      const ruleWithNestedField: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-state',
            field: 'location.state',
            operator: 'eq',
            value: 'Karnataka',
            weight: 1.0,
            description: 'Must be from Karnataka',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleWithNestedField,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('Karnataka');
    });
    
    it('should calculate confidence score correctly', () => {
      // All criteria matched (weights: 0.2 + 0.3 + 0.3 + 0.2 = 1.0)
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        []
      );
      
      expect(result.confidenceScore).toBe(100);
    });
    
    it('should generate appropriate reasoning', () => {
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        []
      );
      
      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning).toContain('eligible');
    });
    
    it('should handle range operator correctly', () => {
      const ruleWithRange: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-age-range',
            field: 'age',
            operator: 'range',
            value: { min: 18, max: 35 },
            weight: 1.0,
            description: 'Age must be between 18 and 35',
            mandatory: true
          }
        ]
      };
      
      const profileWithAge = {
        ...sampleUserProfile,
        age: 25
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithAge,
        ruleWithRange,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
    });
    
    it('should handle alternative documents', () => {
      const ruleWithAlternatives: EligibilityRule = {
        ...sampleRule,
        requiredDocuments: [
          {
            type: 'income_certificate',
            name: 'Income Certificate',
            mandatory: true,
            description: 'Income proof',
            alternativeDocuments: ['salary_slip', 'bank_statement']
          }
        ]
      };
      
      // User has alternative document
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleWithAlternatives,
        ['salary_slip']
      );
      
      expect(result.missingDocuments).toHaveLength(0);
    });
  });
  
  describe('batchEvaluateEligibility', () => {
    it('should evaluate multiple schemes', () => {
      const rule2: EligibilityRule = {
        ...sampleRule,
        id: 'rule-test-002',
        schemeId: 'scheme-test-002',
        schemeName: 'Test Employment Scheme'
      };
      
      const results = batchEvaluateEligibility(
        'user-123',
        sampleUserProfile,
        [sampleRule, rule2],
        []
      );
      
      expect(results).toHaveLength(2);
      expect(results[0].schemeId).toBe('scheme-test-001');
      expect(results[1].schemeId).toBe('scheme-test-002');
    });
  });
  
  describe('filterByStatus', () => {
    it('should filter results by status', () => {
      const results = [
        { status: 'strongly_eligible' } as any,
        { status: 'not_eligible' } as any,
        { status: 'conditionally_eligible' } as any
      ];
      
      const filtered = filterByStatus(results, ['strongly_eligible', 'conditionally_eligible']);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.status !== 'not_eligible')).toBe(true);
    });
  });
  
  describe('sortByConfidence', () => {
    it('should sort results by confidence score descending', () => {
      const results = [
        { confidenceScore: 50 } as any,
        { confidenceScore: 90 } as any,
        { confidenceScore: 70 } as any
      ];
      
      const sorted = sortByConfidence(results);
      
      expect(sorted[0].confidenceScore).toBe(90);
      expect(sorted[1].confidenceScore).toBe(70);
      expect(sorted[2].confidenceScore).toBe(50);
    });
    
    it('should not mutate original array', () => {
      const results = [
        { confidenceScore: 50 } as any,
        { confidenceScore: 90 } as any
      ];
      
      const sorted = sortByConfidence(results);
      
      expect(results[0].confidenceScore).toBe(50);
      expect(sorted[0].confidenceScore).toBe(90);
    });
  });
  
  describe('Exact Match Scenarios (FR-2.1, FR-2.2)', () => {
    it('should match exact age range', () => {
      const ruleAgeExact: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-age-exact',
            field: 'ageRange',
            operator: 'eq',
            value: '18-25',
            weight: 1.0,
            description: 'Age must be 18-25',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleAgeExact,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('18-25');
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should match exact location (state)', () => {
      const ruleLocationExact: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-location-state',
            field: 'location.state',
            operator: 'eq',
            value: 'Karnataka',
            weight: 1.0,
            description: 'Must be from Karnataka',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleLocationExact,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('Karnataka');
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should match exact location (district)', () => {
      const ruleLocationDistrict: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-location-district',
            field: 'location.district',
            operator: 'eq',
            value: 'Bangalore Urban',
            weight: 1.0,
            description: 'Must be from Bangalore Urban',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleLocationDistrict,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('Bangalore Urban');
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should match exact category', () => {
      const ruleCategoryExact: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-category-exact',
            field: 'category',
            operator: 'eq',
            value: 'obc',
            weight: 1.0,
            description: 'Must be OBC category',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleCategoryExact,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('obc');
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should not match when exact criteria fails', () => {
      const ruleWrongCategory: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-category-wrong',
            field: 'category',
            operator: 'eq',
            value: 'sc',
            weight: 1.0,
            description: 'Must be SC category',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleWrongCategory,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(0);
      expect(result.unmatchedCriteria).toHaveLength(1);
      expect(result.status).toBe('not_eligible');
    });
  });
  
  describe('Range Matching Scenarios (FR-2.2)', () => {
    it('should match income range with "in" operator', () => {
      const ruleIncomeRange: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-income-range',
            field: 'incomeRange',
            operator: 'in',
            value: ['below_50k', '50k_1l', '1l_2l'],
            weight: 1.0,
            description: 'Income must be below 2 lakhs',
            mandatory: true
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleIncomeRange,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe('50k_1l');
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should match numeric range with "range" operator', () => {
      const ruleNumericRange: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-age-numeric',
            field: 'age',
            operator: 'range',
            value: { min: 18, max: 35 },
            weight: 1.0,
            description: 'Age must be between 18 and 35',
            mandatory: true
          }
        ]
      };
      
      const profileWithAge = {
        ...sampleUserProfile,
        age: 25
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithAge,
        ruleNumericRange,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.matchedCriteria[0].userValue).toBe(25);
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should not match when value is outside range', () => {
      const ruleNumericRange: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-age-numeric',
            field: 'age',
            operator: 'range',
            value: { min: 18, max: 35 },
            weight: 1.0,
            description: 'Age must be between 18 and 35',
            mandatory: true
          }
        ]
      };
      
      const profileOldAge = {
        ...sampleUserProfile,
        age: 45
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileOldAge,
        ruleNumericRange,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(0);
      expect(result.unmatchedCriteria).toHaveLength(1);
      expect(result.status).toBe('not_eligible');
    });
    
    it('should match income with comparison operators', () => {
      const ruleIncomeLessThan: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-income-lt',
            field: 'monthlyIncome',
            operator: 'lt',
            value: 100000,
            weight: 1.0,
            description: 'Monthly income must be less than 1 lakh',
            mandatory: true
          }
        ]
      };
      
      const profileWithIncome = {
        ...sampleUserProfile,
        monthlyIncome: 75000
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithIncome,
        ruleIncomeLessThan,
        []
      );
      
      expect(result.matchedCriteria).toHaveLength(1);
      expect(result.status).toBe('strongly_eligible');
    });
  });
  
  describe('Confidence Score Calculation (FR-2.3)', () => {
    it('should calculate 100% confidence when all criteria matched', () => {
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        []
      );
      
      expect(result.confidenceScore).toBe(100);
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should calculate partial confidence when some criteria matched', () => {
      const profilePartialMatch = {
        ...sampleUserProfile,
        category: undefined // Missing optional criterion (weight 0.2)
      };
      
      const result = evaluateEligibility(
        'user-123',
        profilePartialMatch,
        sampleRule,
        []
      );
      
      // Matched: age (0.2) + education (0.3) + income (0.3) = 0.8 out of 1.0 = 80%
      expect(result.confidenceScore).toBe(80);
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should calculate low confidence when mandatory criteria not met', () => {
      const profileNoMatch = {
        ...sampleUserProfile,
        ageRange: '60+' as const,
        education: undefined,
        incomeRange: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileNoMatch,
        sampleRule,
        []
      );
      
      expect(result.confidenceScore).toBeLessThanOrEqual(20);
      expect(result.status).toBe('not_eligible');
      expect(result.mandatoryCriteriaMet).toBe(false);
    });
    
    it('should classify as strongly_eligible for confidence > 80%', () => {
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        sampleRule,
        []
      );
      
      expect(result.confidenceScore).toBeGreaterThan(80);
      expect(result.status).toBe('strongly_eligible');
    });
    
    it('should classify as conditionally_eligible for confidence 50-80%', () => {
      const ruleForConditional: EligibilityRule = {
        ...sampleRule,
        criteria: [
          {
            id: 'crit-1',
            field: 'ageRange',
            operator: 'in',
            value: ['18-25'],
            weight: 0.6,
            description: 'Age criterion',
            mandatory: false
          },
          {
            id: 'crit-2',
            field: 'category',
            operator: 'eq',
            value: 'sc',
            weight: 0.4,
            description: 'Category criterion',
            mandatory: false
          }
        ]
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleForConditional,
        []
      );
      
      // Only age matches (0.6 out of 1.0 = 60%)
      expect(result.confidenceScore).toBe(60);
      expect(result.status).toBe('conditionally_eligible');
    });
  });
  
  describe('Missing Criteria Identification (FR-2.2)', () => {
    it('should identify all missing mandatory criteria', () => {
      const incompleteProfile = {
        id: 'user-123',
        phoneNumber: '+919876543210',
        ageRange: '18-25' as const,
        // Missing: education, incomeRange, category
        consentGiven: true
      };
      
      const result = evaluateEligibility(
        'user-123',
        incompleteProfile,
        sampleRule,
        []
      );
      
      expect(result.missingCriteria.length).toBeGreaterThanOrEqual(2);
      expect(result.missingCriteria.some(m => m.criterion.field === 'education')).toBe(true);
      expect(result.missingCriteria.some(m => m.criterion.field === 'incomeRange')).toBe(true);
    });
    
    it('should identify missing optional criteria separately', () => {
      const profileNoCategory = {
        ...sampleUserProfile,
        category: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileNoCategory,
        sampleRule,
        []
      );
      
      const missingCategory = result.missingCriteria.find(m => m.criterion.field === 'category');
      expect(missingCategory).toBeDefined();
      expect(missingCategory?.criterion.mandatory).toBe(false);
    });
    
    it('should provide explanations for missing criteria', () => {
      const incompleteProfile = {
        ...sampleUserProfile,
        education: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        incompleteProfile,
        sampleRule,
        []
      );
      
      const missingEducation = result.missingCriteria.find(m => m.criterion.field === 'education');
      expect(missingEducation).toBeDefined();
      expect(missingEducation?.explanation).toContain('Missing information');
    });
    
    it('should distinguish between missing and unmatched criteria', () => {
      const profileWithWrongValues = {
        ...sampleUserProfile,
        ageRange: '60+' as const, // Wrong value (unmatched)
        education: undefined // Missing value
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithWrongValues,
        sampleRule,
        []
      );
      
      expect(result.unmatchedCriteria.length).toBeGreaterThan(0);
      expect(result.missingCriteria.length).toBeGreaterThan(0);
      expect(result.unmatchedCriteria.some(u => u.criterion.field === 'ageRange')).toBe(true);
      expect(result.missingCriteria.some(m => m.criterion.field === 'education')).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty criteria array', () => {
      const ruleNoCriteria: EligibilityRule = {
        ...sampleRule,
        criteria: []
      };
      
      const result = evaluateEligibility(
        'user-123',
        sampleUserProfile,
        ruleNoCriteria,
        []
      );
      
      expect(result.confidenceScore).toBe(0);
      expect(result.status).toBe('not_eligible');
    });
    
    it('should handle empty user profile', () => {
      const result = evaluateEligibility(
        'user-123',
        {},
        sampleRule,
        []
      );
      
      expect(result.mandatoryCriteriaMet).toBe(false);
      expect(result.status).toBe('not_eligible');
    });
    
    it('should handle null/undefined values gracefully', () => {
      const profileWithNulls = {
        ...sampleUserProfile,
        education: null,
        category: undefined
      };
      
      const result = evaluateEligibility(
        'user-123',
        profileWithNulls,
        sampleRule,
        []
      );
      
      expect(result).toBeDefined();
      expect(result.missingCriteria.length).toBeGreaterThan(0);
    });
  });
});
