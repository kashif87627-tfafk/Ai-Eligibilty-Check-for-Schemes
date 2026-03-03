/**
 * Rule Operator Evaluation Logic
 * 
 * This module provides functions to evaluate eligibility criteria
 * using various operators against user profile data.
 */

import { RuleOperator } from '../types/eligibility-rules';

/**
 * Get a nested property value from an object using dot notation
 * Example: getNestedValue({ location: { state: 'Karnataka' } }, 'location.state') => 'Karnataka'
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Evaluate a criterion against a user value using the specified operator
 * 
 * @param operator - The comparison operator to use
 * @param userValue - The value from the user profile
 * @param criterionValue - The expected value from the criterion
 * @returns true if the criterion is satisfied, false otherwise
 */
export function evaluateCriterion(
  operator: RuleOperator,
  userValue: any,
  criterionValue: any
): boolean {
  // Handle missing user value
  if (userValue === undefined || userValue === null) {
    return false;
  }

  switch (operator) {
    case 'eq':
      return evaluateEquals(userValue, criterionValue);
    
    case 'lt':
      return evaluateLessThan(userValue, criterionValue);
    
    case 'gt':
      return evaluateGreaterThan(userValue, criterionValue);
    
    case 'lte':
      return evaluateLessThanOrEqual(userValue, criterionValue);
    
    case 'gte':
      return evaluateGreaterThanOrEqual(userValue, criterionValue);
    
    case 'in':
      return evaluateIn(userValue, criterionValue);
    
    case 'range':
      return evaluateRange(userValue, criterionValue);
    
    case 'contains':
      return evaluateContains(userValue, criterionValue);
    
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Evaluate equality (eq operator)
 */
function evaluateEquals(userValue: any, criterionValue: any): boolean {
  // Case-insensitive string comparison
  if (typeof userValue === 'string' && typeof criterionValue === 'string') {
    return userValue.toLowerCase() === criterionValue.toLowerCase();
  }
  
  return userValue === criterionValue;
}

/**
 * Evaluate less than (lt operator)
 */
function evaluateLessThan(userValue: any, criterionValue: any): boolean {
  const userNum = parseNumericValue(userValue);
  const criterionNum = parseNumericValue(criterionValue);
  
  if (userNum === null || criterionNum === null) {
    return false;
  }
  
  return userNum < criterionNum;
}

/**
 * Evaluate greater than (gt operator)
 */
function evaluateGreaterThan(userValue: any, criterionValue: any): boolean {
  const userNum = parseNumericValue(userValue);
  const criterionNum = parseNumericValue(criterionValue);
  
  if (userNum === null || criterionNum === null) {
    return false;
  }
  
  return userNum > criterionNum;
}

/**
 * Evaluate less than or equal (lte operator)
 */
function evaluateLessThanOrEqual(userValue: any, criterionValue: any): boolean {
  const userNum = parseNumericValue(userValue);
  const criterionNum = parseNumericValue(criterionValue);
  
  if (userNum === null || criterionNum === null) {
    return false;
  }
  
  return userNum <= criterionNum;
}

/**
 * Evaluate greater than or equal (gte operator)
 */
function evaluateGreaterThanOrEqual(userValue: any, criterionValue: any): boolean {
  const userNum = parseNumericValue(userValue);
  const criterionNum = parseNumericValue(criterionValue);
  
  if (userNum === null || criterionNum === null) {
    return false;
  }
  
  return userNum >= criterionNum;
}

/**
 * Evaluate membership in array (in operator)
 */
function evaluateIn(userValue: any, criterionValue: any): boolean {
  if (!Array.isArray(criterionValue)) {
    console.warn('Criterion value for "in" operator must be an array');
    return false;
  }
  
  // Case-insensitive string comparison for arrays
  if (typeof userValue === 'string') {
    return criterionValue.some(
      (val) => typeof val === 'string' && val.toLowerCase() === userValue.toLowerCase()
    );
  }
  
  return criterionValue.includes(userValue);
}

/**
 * Evaluate range (range operator)
 * Criterion value should be { min: number, max: number }
 */
function evaluateRange(userValue: any, criterionValue: any): boolean {
  if (typeof criterionValue !== 'object' || criterionValue === null) {
    console.warn('Criterion value for "range" operator must be an object with min and max');
    return false;
  }
  
  const { min, max } = criterionValue;
  const userNum = parseNumericValue(userValue);
  
  if (userNum === null || min === undefined || max === undefined) {
    return false;
  }
  
  return userNum >= min && userNum <= max;
}

/**
 * Evaluate contains (contains operator)
 * Checks if userValue contains criterionValue (for strings or arrays)
 */
function evaluateContains(userValue: any, criterionValue: any): boolean {
  // String contains
  if (typeof userValue === 'string' && typeof criterionValue === 'string') {
    return userValue.toLowerCase().includes(criterionValue.toLowerCase());
  }
  
  // Array contains
  if (Array.isArray(userValue)) {
    if (typeof criterionValue === 'string') {
      return userValue.some(
        (val) => typeof val === 'string' && val.toLowerCase() === criterionValue.toLowerCase()
      );
    }
    return userValue.includes(criterionValue);
  }
  
  return false;
}

/**
 * Parse a value to a number, handling various formats
 * Returns null if the value cannot be parsed
 */
function parseNumericValue(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove common non-numeric characters
    const cleaned = value.replace(/[,₹$\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Calculate confidence score based on matched criteria
 * 
 * @param totalWeight - Sum of weights of all criteria
 * @param matchedWeight - Sum of weights of matched criteria
 * @param mandatoryMet - Whether all mandatory criteria are met
 * @returns Confidence score between 0 and 100
 */
export function calculateConfidenceScore(
  totalWeight: number,
  matchedWeight: number,
  mandatoryMet: boolean
): number {
  if (totalWeight === 0) {
    return 0;
  }
  
  // If mandatory criteria are not met, confidence is very low
  if (!mandatoryMet) {
    return Math.min(20, (matchedWeight / totalWeight) * 100);
  }
  
  // Calculate percentage of matched weight
  const score = (matchedWeight / totalWeight) * 100;
  
  // Round to 2 decimal places
  return Math.round(score * 100) / 100;
}

/**
 * Classify eligibility status based on confidence score
 * 
 * @param confidenceScore - Confidence score (0-100)
 * @param mandatoryMet - Whether all mandatory criteria are met
 * @returns Eligibility status
 */
export function classifyEligibilityStatus(
  confidenceScore: number,
  mandatoryMet: boolean
): 'strongly_eligible' | 'conditionally_eligible' | 'needs_verification' | 'not_eligible' {
  if (!mandatoryMet) {
    return 'not_eligible';
  }
  
  if (confidenceScore >= 80) {
    return 'strongly_eligible';
  } else if (confidenceScore >= 50) {
    return 'conditionally_eligible';
  } else if (confidenceScore >= 20) {
    return 'needs_verification';
  } else {
    return 'not_eligible';
  }
}
