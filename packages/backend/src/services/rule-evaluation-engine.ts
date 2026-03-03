/**
 * Rule Evaluation Engine
 * 
 * Core engine for evaluating user eligibility against scheme rules.
 * Uses deterministic rule-based logic with confidence scoring.
 */

import { v4 as uuidv4 } from 'uuid';
import { EligibilityRule, EligibilityCriterion, DocumentRequirement } from '../types/eligibility-rules';
import { 
  EligibilityEvaluationResult, 
  CriterionEvaluationResult,
  MissingCriterion,
  MissingDocument,
  EligibilityStatus
} from '../types/eligibility-evaluation';
import { 
  evaluateCriterion, 
  getNestedValue, 
  calculateConfidenceScore,
  classifyEligibilityStatus 
} from '../utils/rule-operators';

/**
 * Evaluate user eligibility against a scheme rule
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rule - Eligibility rule to evaluate against
 * @param userDocuments - List of document types the user has uploaded (optional)
 * @returns Complete eligibility evaluation result
 */
export function evaluateEligibility(
  userId: string,
  userProfile: any,
  rule: EligibilityRule,
  userDocuments: string[] = []
): EligibilityEvaluationResult {
  // Evaluate all criteria
  const criteriaResults = evaluateCriteria(userProfile, rule.criteria);
  
  // Separate matched, unmatched, and missing criteria
  const matchedCriteria = criteriaResults.filter(r => r.matched);
  const unmatchedCriteria = criteriaResults.filter(r => !r.matched && r.userValue !== undefined && r.userValue !== null);
  const missingCriteria = criteriaResults
    .filter(r => !r.matched && (r.userValue === undefined || r.userValue === null))
    .map(r => ({
      criterion: r.criterion,
      explanation: `Missing information: ${r.criterion.description}`
    }));
  
  // Check if all mandatory criteria are met
  const mandatoryCriteriaMet = checkMandatoryCriteria(criteriaResults);
  
  // Calculate confidence score
  const totalWeight = rule.criteria.reduce((sum, c) => sum + c.weight, 0);
  const matchedWeight = matchedCriteria.reduce((sum, r) => sum + r.criterion.weight, 0);
  const confidenceScore = calculateConfidenceScore(totalWeight, matchedWeight, mandatoryCriteriaMet);
  
  // Classify eligibility status
  const status = classifyEligibilityStatus(confidenceScore, mandatoryCriteriaMet);
  
  // Identify missing documents
  const missingDocuments = identifyMissingDocuments(rule.requiredDocuments, userDocuments);
  
  // Generate reasoning
  const reasoning = generateReasoning(status, matchedCriteria, unmatchedCriteria, missingCriteria, missingDocuments);
  
  return {
    evaluationId: uuidv4(),
    userId,
    schemeId: rule.schemeId,
    schemeName: rule.schemeName,
    status,
    confidenceScore,
    matchedCriteria,
    unmatchedCriteria,
    missingCriteria,
    missingDocuments,
    mandatoryCriteriaMet,
    reasoning,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Evaluate all criteria against user profile
 */
function evaluateCriteria(
  userProfile: any,
  criteria: EligibilityCriterion[]
): CriterionEvaluationResult[] {
  return criteria.map(criterion => {
    // Get user value using nested path (e.g., 'location.state')
    const userValue = getNestedValue(userProfile, criterion.field);
    
    // Evaluate the criterion
    const matched = evaluateCriterion(criterion.operator, userValue, criterion.value);
    
    // Generate reason
    const reason = generateCriterionReason(criterion, userValue, matched);
    
    return {
      criterion,
      matched,
      userValue,
      reason
    };
  });
}

/**
 * Check if all mandatory criteria are met
 */
function checkMandatoryCriteria(results: CriterionEvaluationResult[]): boolean {
  const mandatoryResults = results.filter(r => r.criterion.mandatory);
  return mandatoryResults.every(r => r.matched);
}

/**
 * Identify missing documents
 */
function identifyMissingDocuments(
  requiredDocuments: DocumentRequirement[],
  userDocuments: string[]
): MissingDocument[] {
  return requiredDocuments
    .filter(doc => {
      // Check if user has this document or any alternative
      const hasDocument = userDocuments.includes(doc.type);
      const hasAlternative = doc.alternativeDocuments?.some(alt => userDocuments.includes(alt));
      
      return !hasDocument && !hasAlternative;
    })
    .map(doc => ({
      document: doc,
      explanation: doc.mandatory 
        ? `Required document: ${doc.description}`
        : `Optional document: ${doc.description}`
    }));
}

/**
 * Generate reason for a single criterion evaluation
 */
function generateCriterionReason(
  criterion: EligibilityCriterion,
  userValue: any,
  matched: boolean
): string {
  if (userValue === undefined || userValue === null) {
    return `Missing: ${criterion.description}`;
  }
  
  if (matched) {
    return `✓ Matched: ${criterion.description}`;
  }
  
  // Generate specific mismatch reason based on operator
  switch (criterion.operator) {
    case 'eq':
      return `✗ Does not match: Expected ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'lt':
      return `✗ Too high: Expected less than ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'gt':
      return `✗ Too low: Expected greater than ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'lte':
      return `✗ Too high: Expected at most ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'gte':
      return `✗ Too low: Expected at least ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'in':
      return `✗ Not in allowed values: Expected one of ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    case 'range':
      const range = criterion.value as { min: number; max: number };
      return `✗ Out of range: Expected between ${range.min} and ${range.max}, got ${formatValue(userValue)}`;
    
    case 'contains':
      return `✗ Does not contain: Expected to contain ${formatValue(criterion.value)}, got ${formatValue(userValue)}`;
    
    default:
      return `✗ Does not match: ${criterion.description}`;
  }
}

/**
 * Format a value for display in reasons
 */
function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Generate overall reasoning for the evaluation
 */
function generateReasoning(
  status: EligibilityStatus,
  matchedCriteria: CriterionEvaluationResult[],
  unmatchedCriteria: CriterionEvaluationResult[],
  missingCriteria: MissingCriterion[],
  missingDocuments: MissingDocument[]
): string {
  const parts: string[] = [];
  
  // Status-based opening
  switch (status) {
    case 'strongly_eligible':
      parts.push('You are strongly eligible for this scheme.');
      parts.push(`You meet ${matchedCriteria.length} out of ${matchedCriteria.length + unmatchedCriteria.length + missingCriteria.length} criteria.`);
      break;
    
    case 'conditionally_eligible':
      parts.push('You are conditionally eligible for this scheme.');
      parts.push(`You meet ${matchedCriteria.length} criteria, but some requirements need verification.`);
      break;
    
    case 'needs_verification':
      parts.push('Your eligibility needs verification.');
      parts.push(`You meet ${matchedCriteria.length} criteria, but important information is missing.`);
      break;
    
    case 'not_eligible':
      parts.push('You do not meet the eligibility requirements for this scheme.');
      break;
  }
  
  // Add information about unmatched mandatory criteria
  const unmatchedMandatory = unmatchedCriteria.filter(r => r.criterion.mandatory);
  if (unmatchedMandatory.length > 0) {
    parts.push(`You do not meet ${unmatchedMandatory.length} mandatory requirement(s).`);
  }
  
  // Add information about missing criteria
  if (missingCriteria.length > 0) {
    const missingMandatory = missingCriteria.filter(m => m.criterion.mandatory);
    if (missingMandatory.length > 0) {
      parts.push(`${missingMandatory.length} mandatory field(s) are missing from your profile.`);
    }
  }
  
  // Add information about missing documents
  if (missingDocuments.length > 0) {
    const mandatoryDocs = missingDocuments.filter(d => d.document.mandatory);
    if (mandatoryDocs.length > 0) {
      parts.push(`You need to provide ${mandatoryDocs.length} required document(s).`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Batch evaluate multiple schemes for a user
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rules - Array of eligibility rules to evaluate
 * @param userDocuments - List of document types the user has uploaded (optional)
 * @returns Array of evaluation results
 */
export function batchEvaluateEligibility(
  userId: string,
  userProfile: any,
  rules: EligibilityRule[],
  userDocuments: string[] = []
): EligibilityEvaluationResult[] {
  return rules.map(rule => evaluateEligibility(userId, userProfile, rule, userDocuments));
}

/**
 * Filter evaluation results by status
 * 
 * @param results - Array of evaluation results
 * @param statuses - Statuses to filter by
 * @returns Filtered results
 */
export function filterByStatus(
  results: EligibilityEvaluationResult[],
  statuses: EligibilityStatus[]
): EligibilityEvaluationResult[] {
  return results.filter(r => statuses.includes(r.status));
}

/**
 * Sort evaluation results by confidence score (descending)
 * 
 * @param results - Array of evaluation results
 * @returns Sorted results
 */
export function sortByConfidence(
  results: EligibilityEvaluationResult[]
): EligibilityEvaluationResult[] {
  return [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);
}
