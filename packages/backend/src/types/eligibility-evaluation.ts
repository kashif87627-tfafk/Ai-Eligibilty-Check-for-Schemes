/**
 * Eligibility Evaluation Result Types
 * 
 * Defines the structure for eligibility evaluation results returned by the engine.
 */

import { EligibilityCriterion, DocumentRequirement } from './eligibility-rules';

/**
 * Eligibility status classification
 */
export type EligibilityStatus = 
  | 'strongly_eligible' 
  | 'conditionally_eligible' 
  | 'needs_verification' 
  | 'not_eligible';

/**
 * Result of evaluating a single criterion
 */
export interface CriterionEvaluationResult {
  /** The criterion that was evaluated */
  criterion: EligibilityCriterion;
  
  /** Whether the criterion was matched */
  matched: boolean;
  
  /** The user's value for this criterion */
  userValue: any;
  
  /** Reason for match/mismatch */
  reason: string;
}

/**
 * Missing criterion information
 */
export interface MissingCriterion {
  /** The criterion that is missing */
  criterion: EligibilityCriterion;
  
  /** Explanation of what is missing */
  explanation: string;
}

/**
 * Missing document information
 */
export interface MissingDocument {
  /** The document requirement */
  document: DocumentRequirement;
  
  /** Explanation of why it's needed */
  explanation: string;
}

/**
 * Complete eligibility evaluation result
 */
export interface EligibilityEvaluationResult {
  /** Unique identifier for this evaluation */
  evaluationId: string;
  
  /** User ID */
  userId: string;
  
  /** Scheme ID that was evaluated */
  schemeId: string;
  
  /** Scheme name */
  schemeName: string;
  
  /** Overall eligibility status */
  status: EligibilityStatus;
  
  /** Confidence score (0-100) */
  confidenceScore: number;
  
  /** Criteria that were matched */
  matchedCriteria: CriterionEvaluationResult[];
  
  /** Criteria that were not matched */
  unmatchedCriteria: CriterionEvaluationResult[];
  
  /** Criteria that are missing from user profile */
  missingCriteria: MissingCriterion[];
  
  /** Documents that are missing */
  missingDocuments: MissingDocument[];
  
  /** Whether all mandatory criteria are met */
  mandatoryCriteriaMet: boolean;
  
  /** Brief reasoning for the evaluation */
  reasoning: string;
  
  /** Timestamp of evaluation */
  evaluatedAt: string;
  
  /** AI-generated scenarios (optional, from Bedrock) */
  scenarios?: Array<{
    icon: string;
    text: string;
    impact: string;
  }>;
  
  /** AI-generated suggestions (optional, from Bedrock) */
  aiSuggestions?: string[];
}

/**
 * Input for eligibility evaluation
 */
export interface EvaluateEligibilityInput {
  /** User ID */
  userId: string;
  
  /** User profile data */
  userProfile: any;
  
  /** Scheme ID to evaluate against */
  schemeId: string;
  
  /** User's uploaded documents (optional) */
  userDocuments?: string[];
}
