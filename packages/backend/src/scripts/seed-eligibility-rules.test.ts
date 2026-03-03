/**
 * Tests for Seed Eligibility Rules Script
 * 
 * These tests verify that the sample eligibility rules are correctly structured
 * and can be seeded into DynamoDB.
 */

import { sampleEligibilityRules } from '../data/sample-eligibility-rules';
import { EligibilityRule } from '../types/eligibility-rules';

describe('Seed Eligibility Rules', () => {
  describe('Sample Rules Structure', () => {
    it('should have exactly 3 sample rules', () => {
      expect(sampleEligibilityRules).toHaveLength(3);
    });

    it('should have unique rule IDs', () => {
      const ruleIds = sampleEligibilityRules.map(rule => rule.id);
      const uniqueIds = new Set(ruleIds);
      expect(uniqueIds.size).toBe(ruleIds.length);
    });

    it('should have unique scheme IDs', () => {
      const schemeIds = sampleEligibilityRules.map(rule => rule.schemeId);
      const uniqueIds = new Set(schemeIds);
      expect(uniqueIds.size).toBe(schemeIds.length);
    });

    it('should match frontend scheme IDs', () => {
      const expectedSchemeIds = [
        'scheme-pm-scholarship',
        'scheme-skill-development',
        'scheme-widow-pension-karnataka',
      ];

      const actualSchemeIds = sampleEligibilityRules.map(rule => rule.schemeId);
      
      expectedSchemeIds.forEach(expectedId => {
        expect(actualSchemeIds).toContain(expectedId);
      });
    });
  });

  describe('PM Scholarship Rule', () => {
    let rule: EligibilityRule;

    beforeEach(() => {
      rule = sampleEligibilityRules.find(r => r.schemeId === 'scheme-pm-scholarship')!;
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should have correct category', () => {
      expect(rule.category).toBe('education');
    });

    it('should have mandatory criteria', () => {
      const mandatoryCriteria = rule.criteria.filter(c => c.mandatory);
      expect(mandatoryCriteria.length).toBeGreaterThan(0);
    });

    it('should have required documents', () => {
      expect(rule.requiredDocuments.length).toBeGreaterThan(0);
      
      // Should have Aadhaar as mandatory
      const aadhaar = rule.requiredDocuments.find(d => d.type === 'aadhaar');
      expect(aadhaar).toBeDefined();
      expect(aadhaar?.mandatory).toBe(true);
    });

    it('should have valid weights that sum to reasonable value', () => {
      const totalWeight = rule.criteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalWeight).toBeGreaterThan(0);
      expect(totalWeight).toBeLessThanOrEqual(2); // Allow some flexibility
    });

    it('should have application mode and URL', () => {
      expect(rule.applicationMode).toBeDefined();
      expect(rule.applicationUrl).toBeDefined();
    });

    it('should have trust level and source', () => {
      expect(rule.trustLevel).toBe('verified');
      expect(rule.sourceUrl).toBeDefined();
    });
  });

  describe('Skill Development Rule', () => {
    let rule: EligibilityRule;

    beforeEach(() => {
      rule = sampleEligibilityRules.find(r => r.schemeId === 'scheme-skill-development')!;
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should have correct category', () => {
      expect(rule.category).toBe('employment');
    });

    it('should be open-ended', () => {
      expect(rule.isOpenEnded).toBe(true);
    });

    it('should support both online and offline application', () => {
      expect(rule.applicationMode).toBe('both');
      expect(rule.officeLocations).toBeDefined();
      expect(rule.officeLocations!.length).toBeGreaterThan(0);
    });

    it('should have employment status criteria', () => {
      const employmentCriteria = rule.criteria.find(c => c.field === 'employmentStatus');
      expect(employmentCriteria).toBeDefined();
    });
  });

  describe('Widow Pension Rule', () => {
    let rule: EligibilityRule;

    beforeEach(() => {
      rule = sampleEligibilityRules.find(r => r.schemeId === 'scheme-widow-pension-karnataka')!;
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should have correct category', () => {
      expect(rule.category).toBe('welfare');
    });

    it('should be Karnataka-specific', () => {
      expect(rule.applicableStates).toContain('Karnataka');
    });

    it('should have gender criteria', () => {
      const genderCriteria = rule.criteria.find(c => c.field === 'gender');
      expect(genderCriteria).toBeDefined();
      expect(genderCriteria?.value).toBe('female');
      expect(genderCriteria?.mandatory).toBe(true);
    });

    it('should require death certificate', () => {
      const deathCert = rule.requiredDocuments.find(d => d.type === 'death_certificate');
      expect(deathCert).toBeDefined();
      expect(deathCert?.mandatory).toBe(true);
    });

    it('should have state location criteria', () => {
      const stateCriteria = rule.criteria.find(c => c.field === 'location.state');
      expect(stateCriteria).toBeDefined();
      expect(stateCriteria?.value).toBe('Karnataka');
    });
  });

  describe('Rule Validation', () => {
    it('all rules should have valid structure', () => {
      sampleEligibilityRules.forEach(rule => {
        // Required fields
        expect(rule.id).toBeDefined();
        expect(rule.schemeId).toBeDefined();
        expect(rule.schemeName).toBeDefined();
        expect(rule.description).toBeDefined();
        expect(rule.category).toBeDefined();
        expect(rule.targetAudience).toBeDefined();
        expect(rule.criteria).toBeDefined();
        expect(rule.requiredDocuments).toBeDefined();
        expect(rule.applicableStates).toBeDefined();
        expect(rule.isOpenEnded).toBeDefined();
        expect(rule.applicationMode).toBeDefined();
        expect(rule.trustLevel).toBeDefined();
        expect(rule.sourceUrl).toBeDefined();
        expect(rule.lastVerified).toBeDefined();
        expect(rule.createdAt).toBeDefined();
        expect(rule.updatedAt).toBeDefined();

        // Arrays should not be empty
        expect(rule.targetAudience.length).toBeGreaterThan(0);
        expect(rule.criteria.length).toBeGreaterThan(0);
        expect(rule.requiredDocuments.length).toBeGreaterThan(0);
      });
    });

    it('all criteria should have valid operators', () => {
      const validOperators = ['eq', 'lt', 'gt', 'lte', 'gte', 'in', 'range', 'contains'];
      
      sampleEligibilityRules.forEach(rule => {
        rule.criteria.forEach(criterion => {
          expect(validOperators).toContain(criterion.operator);
        });
      });
    });

    it('all criteria weights should be between 0 and 1', () => {
      sampleEligibilityRules.forEach(rule => {
        rule.criteria.forEach(criterion => {
          expect(criterion.weight).toBeGreaterThanOrEqual(0);
          expect(criterion.weight).toBeLessThanOrEqual(1);
        });
      });
    });

    it('all rules should have at least one mandatory criterion', () => {
      sampleEligibilityRules.forEach(rule => {
        const mandatoryCriteria = rule.criteria.filter(c => c.mandatory);
        expect(mandatoryCriteria.length).toBeGreaterThan(0);
      });
    });

    it('all rules should have at least one mandatory document', () => {
      sampleEligibilityRules.forEach(rule => {
        const mandatoryDocs = rule.requiredDocuments.filter(d => d.mandatory);
        expect(mandatoryDocs.length).toBeGreaterThan(0);
      });
    });

    it('all rules should have valid trust levels', () => {
      const validTrustLevels = ['verified', 'partially_correct', 'misleading', 'unverifiable'];
      
      sampleEligibilityRules.forEach(rule => {
        expect(validTrustLevels).toContain(rule.trustLevel);
      });
    });

    it('all rules should have valid categories', () => {
      const validCategories = ['education', 'health', 'employment', 'housing', 'agriculture', 'welfare'];
      
      sampleEligibilityRules.forEach(rule => {
        expect(validCategories).toContain(rule.category);
      });
    });

    it('all rules should have valid application modes', () => {
      const validModes = ['online', 'offline', 'both'];
      
      sampleEligibilityRules.forEach(rule => {
        expect(validModes).toContain(rule.applicationMode);
      });
    });

    it('rules with offline mode should have office locations or URL', () => {
      sampleEligibilityRules.forEach(rule => {
        if (rule.applicationMode === 'offline' || rule.applicationMode === 'both') {
          const hasOfficeLocations = rule.officeLocations && rule.officeLocations.length > 0;
          const hasUrl = !!rule.applicationUrl;
          expect(hasOfficeLocations || hasUrl).toBe(true);
        }
      });
    });
  });
});
