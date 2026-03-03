/**
 * Unit tests for rule operator evaluation logic
 */

import {
  evaluateCriterion,
  getNestedValue,
  calculateConfidenceScore,
  classifyEligibilityStatus,
} from './rule-operators';

describe('Rule Operators', () => {
  describe('getNestedValue', () => {
    it('should get top-level property', () => {
      const obj = { name: 'John', age: 25 };
      expect(getNestedValue(obj, 'name')).toBe('John');
      expect(getNestedValue(obj, 'age')).toBe(25);
    });

    it('should get nested property', () => {
      const obj = { location: { state: 'Karnataka', district: 'Bangalore' } };
      expect(getNestedValue(obj, 'location.state')).toBe('Karnataka');
      expect(getNestedValue(obj, 'location.district')).toBe('Bangalore');
    });

    it('should return undefined for missing property', () => {
      const obj = { name: 'John' };
      expect(getNestedValue(obj, 'age')).toBeUndefined();
      expect(getNestedValue(obj, 'location.state')).toBeUndefined();
    });
  });

  describe('evaluateCriterion - eq operator', () => {
    it('should match equal strings (case-insensitive)', () => {
      expect(evaluateCriterion('eq', 'Karnataka', 'Karnataka')).toBe(true);
      expect(evaluateCriterion('eq', 'karnataka', 'Karnataka')).toBe(true);
      expect(evaluateCriterion('eq', 'KARNATAKA', 'karnataka')).toBe(true);
    });

    it('should match equal numbers', () => {
      expect(evaluateCriterion('eq', 25, 25)).toBe(true);
      expect(evaluateCriterion('eq', 25, 30)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(evaluateCriterion('eq', null, 'value')).toBe(false);
      expect(evaluateCriterion('eq', undefined, 'value')).toBe(false);
    });
  });

  describe('evaluateCriterion - lt operator', () => {
    it('should evaluate less than for numbers', () => {
      expect(evaluateCriterion('lt', 20, 25)).toBe(true);
      expect(evaluateCriterion('lt', 25, 25)).toBe(false);
      expect(evaluateCriterion('lt', 30, 25)).toBe(false);
    });

    it('should parse string numbers', () => {
      expect(evaluateCriterion('lt', '20', 25)).toBe(true);
      expect(evaluateCriterion('lt', 20, '25')).toBe(true);
    });
  });

  describe('evaluateCriterion - gt operator', () => {
    it('should evaluate greater than for numbers', () => {
      expect(evaluateCriterion('gt', 30, 25)).toBe(true);
      expect(evaluateCriterion('gt', 25, 25)).toBe(false);
      expect(evaluateCriterion('gt', 20, 25)).toBe(false);
    });
  });

  describe('evaluateCriterion - lte operator', () => {
    it('should evaluate less than or equal', () => {
      expect(evaluateCriterion('lte', 20, 25)).toBe(true);
      expect(evaluateCriterion('lte', 25, 25)).toBe(true);
      expect(evaluateCriterion('lte', 30, 25)).toBe(false);
    });
  });

  describe('evaluateCriterion - gte operator', () => {
    it('should evaluate greater than or equal', () => {
      expect(evaluateCriterion('gte', 30, 25)).toBe(true);
      expect(evaluateCriterion('gte', 25, 25)).toBe(true);
      expect(evaluateCriterion('gte', 20, 25)).toBe(false);
    });
  });

  describe('evaluateCriterion - in operator', () => {
    it('should match value in array', () => {
      expect(evaluateCriterion('in', '18-25', ['18-25', '26-35'])).toBe(true);
      expect(evaluateCriterion('in', '36-45', ['18-25', '26-35'])).toBe(false);
    });

    it('should match case-insensitive strings', () => {
      expect(evaluateCriterion('in', 'karnataka', ['Karnataka', 'Tamil Nadu'])).toBe(true);
      expect(evaluateCriterion('in', 'KARNATAKA', ['karnataka', 'tamil nadu'])).toBe(true);
    });

    it('should match numbers in array', () => {
      expect(evaluateCriterion('in', 25, [18, 25, 35])).toBe(true);
      expect(evaluateCriterion('in', 30, [18, 25, 35])).toBe(false);
    });
  });

  describe('evaluateCriterion - range operator', () => {
    it('should match value in range', () => {
      expect(evaluateCriterion('range', 50000, { min: 0, max: 100000 })).toBe(true);
      expect(evaluateCriterion('range', 0, { min: 0, max: 100000 })).toBe(true);
      expect(evaluateCriterion('range', 100000, { min: 0, max: 100000 })).toBe(true);
      expect(evaluateCriterion('range', 150000, { min: 0, max: 100000 })).toBe(false);
    });

    it('should parse string numbers', () => {
      expect(evaluateCriterion('range', '50000', { min: 0, max: 100000 })).toBe(true);
    });
  });

  describe('evaluateCriterion - contains operator', () => {
    it('should match substring in string', () => {
      expect(evaluateCriterion('contains', 'Karnataka State', 'Karnataka')).toBe(true);
      expect(evaluateCriterion('contains', 'karnataka state', 'KARNATAKA')).toBe(true);
      expect(evaluateCriterion('contains', 'Tamil Nadu', 'Karnataka')).toBe(false);
    });

    it('should match value in array', () => {
      expect(evaluateCriterion('contains', ['programming', 'design'], 'programming')).toBe(true);
      expect(evaluateCriterion('contains', ['programming', 'design'], 'PROGRAMMING')).toBe(true);
      expect(evaluateCriterion('contains', ['programming', 'design'], 'marketing')).toBe(false);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate correct percentage', () => {
      expect(calculateConfidenceScore(1.0, 0.8, true)).toBe(80);
      expect(calculateConfidenceScore(1.0, 0.5, true)).toBe(50);
      expect(calculateConfidenceScore(1.0, 1.0, true)).toBe(100);
    });

    it('should cap score at 20% if mandatory not met', () => {
      expect(calculateConfidenceScore(1.0, 0.8, false)).toBe(20);
      expect(calculateConfidenceScore(1.0, 0.3, false)).toBe(20);
      expect(calculateConfidenceScore(1.0, 0.1, false)).toBe(10);
    });

    it('should return 0 for zero total weight', () => {
      expect(calculateConfidenceScore(0, 0, true)).toBe(0);
    });
  });

  describe('classifyEligibilityStatus', () => {
    it('should classify as strongly_eligible for high scores', () => {
      expect(classifyEligibilityStatus(85, true)).toBe('strongly_eligible');
      expect(classifyEligibilityStatus(100, true)).toBe('strongly_eligible');
    });

    it('should classify as conditionally_eligible for medium scores', () => {
      expect(classifyEligibilityStatus(70, true)).toBe('conditionally_eligible');
      expect(classifyEligibilityStatus(50, true)).toBe('conditionally_eligible');
    });

    it('should classify as needs_verification for low scores', () => {
      expect(classifyEligibilityStatus(40, true)).toBe('needs_verification');
      expect(classifyEligibilityStatus(20, true)).toBe('needs_verification');
    });

    it('should classify as not_eligible for very low scores', () => {
      expect(classifyEligibilityStatus(15, true)).toBe('not_eligible');
      expect(classifyEligibilityStatus(0, true)).toBe('not_eligible');
    });

    it('should classify as not_eligible if mandatory not met', () => {
      expect(classifyEligibilityStatus(85, false)).toBe('not_eligible');
      expect(classifyEligibilityStatus(100, false)).toBe('not_eligible');
    });
  });
});
