/**
 * Hybrid Eligibility Evaluation Service
 * 
 * Orchestrates eligibility evaluation using a hybrid approach:
 * 1. Apply deterministic rules first for clear-cut cases
 * 2. Call Bedrock only when contextual reasoning is needed (ambiguous cases)
 * 3. Merge rule-based and LLM results into unified confidence score
 * 4. Generate why/why-not explanation using LLM
 * 5. Return structured JSON response
 * 
 * Requirements: FR-2.1, FR-2.3, FR-3.1, FR-3.2, FR-3.3
 */

import { EligibilityRule } from '../types/eligibility-rules';
import { EligibilityEvaluationResult, EligibilityStatus } from '../types/eligibility-evaluation';
import { evaluateEligibility } from './rule-evaluation-engine';
import { evaluateWithBedrock, generateEnhancedExplanation } from './bedrock-integration';

/**
 * Thresholds for determining when to use LLM
 */
const CLEAR_ELIGIBLE_THRESHOLD = 85; // >= 85% confidence = clearly eligible
const CLEAR_INELIGIBLE_THRESHOLD = 20; // <= 20% confidence = clearly ineligible
const AMBIGUOUS_RANGE = { min: 20, max: 85 }; // Between 20-85% = ambiguous, needs LLM

/**
 * Options for hybrid evaluation
 */
export interface HybridEvaluationOptions {
  /** Force LLM evaluation even for clear cases */
  forceLLM?: boolean;
  
  /** Skip LLM evaluation even for ambiguous cases */
  skipLLM?: boolean;
  
  /** Timeout for LLM calls in milliseconds */
  llmTimeout?: number;
  
  /** Language for explanation generation */
  language?: string;
  
  /** Whether to generate enhanced explanation */
  enhanceExplanation?: boolean;
}

/**
 * Hybrid evaluation result with metadata
 */
export interface HybridEvaluationResult extends EligibilityEvaluationResult {
  /** Whether LLM was used in this evaluation */
  usedLLM: boolean;
  
  /** Reason for using or not using LLM */
  evaluationMethod: 'rule_based_clear' | 'rule_based_ambiguous' | 'llm_enhanced' | 'llm_fallback';
  
  /** Original rule-based confidence score (before LLM adjustment) */
  ruleBasedConfidence?: number;
}

/**
 * Determine if a case is ambiguous and needs LLM reasoning
 * 
 * @param ruleBasedResult - Result from rule-based evaluation
 * @returns True if case is ambiguous and needs LLM
 */
function isAmbiguousCase(ruleBasedResult: EligibilityEvaluationResult): boolean {
  const { confidenceScore, missingCriteria, unmatchedCriteria } = ruleBasedResult;
  
  // Case 1: Confidence score in ambiguous range
  if (confidenceScore > AMBIGUOUS_RANGE.min && confidenceScore < AMBIGUOUS_RANGE.max) {
    return true;
  }
  
  // Case 2: Has missing criteria but some matched criteria (partial information)
  if (missingCriteria.length > 0 && ruleBasedResult.matchedCriteria.length > 0) {
    return true;
  }
  
  // Case 3: Has unmatched mandatory criteria but high overall match
  const unmatchedMandatory = unmatchedCriteria.filter(c => c.criterion.mandatory);
  if (unmatchedMandatory.length > 0 && confidenceScore > 50) {
    return true;
  }
  
  // Case 4: Conditionally eligible status (inherently ambiguous)
  if (ruleBasedResult.status === 'conditionally_eligible') {
    return true;
  }
  
  return false;
}

/**
 * Merge rule-based and LLM results into unified evaluation
 * 
 * @param ruleBasedResult - Result from rule-based evaluation
 * @param llmResult - Result from LLM evaluation
 * @returns Merged result with unified confidence score
 */
function mergeEvaluationResults(
  ruleBasedResult: EligibilityEvaluationResult,
  llmResult: EligibilityEvaluationResult
): EligibilityEvaluationResult {
  // Use weighted average for confidence score
  // Rule-based: 40%, LLM: 60% (LLM has more weight for contextual reasoning)
  const mergedConfidence = Math.round(
    (ruleBasedResult.confidenceScore * 0.4) + (llmResult.confidenceScore * 0.6)
  );
  
  // Use LLM status if confidence scores are close, otherwise use higher confidence
  let mergedStatus: EligibilityStatus;
  const confidenceDiff = Math.abs(ruleBasedResult.confidenceScore - llmResult.confidenceScore);
  
  if (confidenceDiff <= 15) {
    // Close scores: trust LLM's contextual reasoning
    mergedStatus = llmResult.status;
  } else if (llmResult.confidenceScore > ruleBasedResult.confidenceScore) {
    // LLM more confident: use LLM status
    mergedStatus = llmResult.status;
  } else {
    // Rule-based more confident: use rule-based status
    mergedStatus = ruleBasedResult.status;
  }
  
  // Combine reasoning from both approaches
  const mergedReasoning = `${llmResult.reasoning}\n\n[Technical Details: ${ruleBasedResult.matchedCriteria.length} criteria matched, ${ruleBasedResult.unmatchedCriteria.length} unmatched, ${ruleBasedResult.missingCriteria.length} missing]`;
  
  return {
    ...ruleBasedResult,
    status: mergedStatus,
    confidenceScore: mergedConfidence,
    reasoning: mergedReasoning,
  };
}

/**
 * Evaluate eligibility using hybrid approach
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rule - Eligibility rule to evaluate against
 * @param userDocuments - List of document types the user has uploaded
 * @param options - Evaluation options
 * @returns Hybrid evaluation result
 */
export async function evaluateHybrid(
  userId: string,
  userProfile: any,
  rule: EligibilityRule,
  userDocuments: string[] = [],
  options: HybridEvaluationOptions = {}
): Promise<HybridEvaluationResult> {
  const {
    forceLLM = false,
    skipLLM = false,
    llmTimeout = 30000,
    language = 'en',
    enhanceExplanation = true
  } = options;
  
  // Step 1: Always run rule-based evaluation first
  const ruleBasedResult = evaluateEligibility(userId, userProfile, rule, userDocuments);
  
  // Step 2: Determine if LLM is needed
  const needsLLM = forceLLM || (!skipLLM && isAmbiguousCase(ruleBasedResult));
  
  // Step 3: If clear-cut case and LLM not forced, return rule-based result
  if (!needsLLM) {
    const evaluationMethod = ruleBasedResult.confidenceScore >= CLEAR_ELIGIBLE_THRESHOLD
      ? 'rule_based_clear'
      : ruleBasedResult.confidenceScore <= CLEAR_INELIGIBLE_THRESHOLD
        ? 'rule_based_clear'
        : 'rule_based_ambiguous';
    
    return {
      ...ruleBasedResult,
      usedLLM: false,
      evaluationMethod,
      ruleBasedConfidence: ruleBasedResult.confidenceScore
    };
  }
  
  // Step 4: Use LLM for ambiguous cases
  try {
    const llmResult = await evaluateWithBedrock(
      userId,
      userProfile,
      rule,
      userDocuments,
      {
        fallbackToRules: true,
        timeout: llmTimeout
      }
    );
    
    // Step 5: Merge rule-based and LLM results
    const mergedResult = mergeEvaluationResults(ruleBasedResult, llmResult);
    
    // Step 6: Optionally enhance explanation
    let finalReasoning = mergedResult.reasoning;
    if (enhanceExplanation) {
      try {
        finalReasoning = await generateEnhancedExplanation(
          mergedResult,
          userProfile,
          rule,
          language
        );
      } catch (error) {
        console.error('Failed to enhance explanation, using merged reasoning:', error);
        // Keep merged reasoning if enhancement fails
      }
    }
    
    return {
      ...mergedResult,
      reasoning: finalReasoning,
      usedLLM: true,
      evaluationMethod: 'llm_enhanced',
      ruleBasedConfidence: ruleBasedResult.confidenceScore
    };
  } catch (error) {
    console.error('LLM evaluation failed, using rule-based result:', error);
    
    // Fallback to rule-based result with note
    return {
      ...ruleBasedResult,
      reasoning: `${ruleBasedResult.reasoning}\n\n[Note: Advanced reasoning unavailable, using rule-based evaluation]`,
      usedLLM: false,
      evaluationMethod: 'llm_fallback',
      ruleBasedConfidence: ruleBasedResult.confidenceScore
    };
  }
}

/**
 * Batch evaluate multiple schemes using hybrid approach
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rules - Array of eligibility rules to evaluate
 * @param userDocuments - List of document types the user has uploaded
 * @param options - Evaluation options
 * @returns Array of hybrid evaluation results
 */
export async function batchEvaluateHybrid(
  userId: string,
  userProfile: any,
  rules: EligibilityRule[],
  userDocuments: string[] = [],
  options: HybridEvaluationOptions = {}
): Promise<HybridEvaluationResult[]> {
  const results: HybridEvaluationResult[] = [];
  
  // Evaluate schemes sequentially to avoid overwhelming Bedrock API
  for (const rule of rules) {
    try {
      const result = await evaluateHybrid(userId, userProfile, rule, userDocuments, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to evaluate scheme ${rule.schemeId}:`, error);
      // Continue with other schemes even if one fails
    }
  }
  
  return results;
}

/**
 * Generate structured JSON response for API
 * 
 * @param result - Hybrid evaluation result
 * @returns Structured JSON response matching frontend expectations
 */
export function formatHybridResponse(result: HybridEvaluationResult): any {
  return {
    evaluation_id: result.evaluationId,
    user_id: result.userId,
    scheme_id: result.schemeId,
    scheme_name: result.schemeName,
    status: result.status,
    confidence_score: result.confidenceScore,
    reasoning: result.reasoning,
    matched_criteria: result.matchedCriteria,
    unmatched_criteria: result.unmatchedCriteria,
    missing_criteria: result.missingCriteria,
    missing_documents: result.missingDocuments,
    mandatory_criteria_met: result.mandatoryCriteriaMet,
    evaluated_at: result.evaluatedAt,
    // Additional metadata for debugging/analytics
    used_llm: result.usedLLM,
    evaluation_method: result.evaluationMethod,
    rule_based_confidence: result.ruleBasedConfidence
  };
}

/**
 * Sort hybrid results by confidence score (descending)
 * 
 * @param results - Array of hybrid evaluation results
 * @returns Sorted results
 */
export function sortHybridByConfidence(
  results: HybridEvaluationResult[]
): HybridEvaluationResult[] {
  return [...results].sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Filter hybrid results by status
 * 
 * @param results - Array of hybrid evaluation results
 * @param statuses - Statuses to filter by
 * @returns Filtered results
 */
export function filterHybridByStatus(
  results: HybridEvaluationResult[],
  statuses: EligibilityStatus[]
): HybridEvaluationResult[] {
  return results.filter(r => statuses.includes(r.status));
}

/**
 * Get statistics about hybrid evaluations
 * 
 * @param results - Array of hybrid evaluation results
 * @returns Statistics object
 */
export function getHybridStatistics(results: HybridEvaluationResult[]): {
  total: number;
  usedLLM: number;
  ruleBasedOnly: number;
  averageConfidence: number;
  statusBreakdown: Record<EligibilityStatus, number>;
  methodBreakdown: Record<string, number>;
} {
  const total = results.length;
  const usedLLM = results.filter(r => r.usedLLM).length;
  const ruleBasedOnly = total - usedLLM;
  
  const averageConfidence = total > 0
    ? Math.round(results.reduce((sum, r) => sum + r.confidenceScore, 0) / total)
    : 0;
  
  const statusBreakdown: Record<EligibilityStatus, number> = {
    strongly_eligible: 0,
    conditionally_eligible: 0,
    needs_verification: 0,
    not_eligible: 0
  };
  
  const methodBreakdown: Record<string, number> = {
    rule_based_clear: 0,
    rule_based_ambiguous: 0,
    llm_enhanced: 0,
    llm_fallback: 0
  };
  
  results.forEach(r => {
    statusBreakdown[r.status]++;
    methodBreakdown[r.evaluationMethod]++;
  });
  
  return {
    total,
    usedLLM,
    ruleBasedOnly,
    averageConfidence,
    statusBreakdown,
    methodBreakdown
  };
}
