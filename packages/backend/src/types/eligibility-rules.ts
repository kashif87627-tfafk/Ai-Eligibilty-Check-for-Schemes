/**
 * Eligibility Rule Configuration Types
 * 
 * This module defines the structure for eligibility rules that can be evaluated
 * against user profiles to determine scheme eligibility.
 */

/**
 * Supported operators for eligibility criteria evaluation
 */
export type RuleOperator = 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'range' | 'contains';

/**
 * A single eligibility criterion that must be evaluated
 */
export interface EligibilityCriterion {
  /** Unique identifier for the criterion */
  id: string;
  
  /** Field name from user profile to evaluate (e.g., 'ageRange', 'location.state') */
  field: string;
  
  /** Operator to use for comparison */
  operator: RuleOperator;
  
  /** Expected value(s) for the criterion */
  value: string | number | string[] | number[] | { min: number; max: number };
  
  /** Weight for confidence score calculation (0-1) */
  weight: number;
  
  /** Human-readable description of the criterion */
  description: string;
  
  /** Whether this criterion is mandatory for eligibility */
  mandatory: boolean;
}

/**
 * Document requirement for a scheme
 */
export interface DocumentRequirement {
  /** Document type identifier */
  type: string;
  
  /** Human-readable name */
  name: string;
  
  /** Whether this document is mandatory */
  mandatory: boolean;
  
  /** Description of the document */
  description: string;
  
  /** Alternative documents that can be used instead */
  alternativeDocuments?: string[];
}

/**
 * Office location for offline application
 */
export interface OfficeLocation {
  /** Office name */
  name: string;
  
  /** Full address */
  address: string;
  
  /** District */
  district: string;
  
  /** Contact number (optional) */
  contactNumber?: string;
}

/**
 * Complete eligibility rule configuration for a scheme
 */
export interface EligibilityRule {
  /** Unique identifier for the rule */
  id: string;
  
  /** Scheme identifier this rule applies to */
  schemeId: string;
  
  /** Scheme name */
  schemeName: string;
  
  /** Scheme name translations (language code -> translated name) */
  schemeNameTranslations?: Record<string, string>;
  
  /** Scheme description */
  description: string;
  
  /** Scheme description translations */
  descriptionTranslations?: Record<string, string>;
  
  /** Scheme category */
  category: 'education' | 'health' | 'employment' | 'housing' | 'agriculture' | 'welfare';
  
  /** Target audience tags */
  targetAudience: string[];
  
  /** List of eligibility criteria */
  criteria: EligibilityCriterion[];
  
  /** Required documents */
  requiredDocuments: DocumentRequirement[];
  
  /** Applicable states (empty array means all states) */
  applicableStates: string[];
  
  /** Applicable districts (optional, empty means all districts in applicable states) */
  applicableDistricts?: string[];
  
  /** Rural/urban filter */
  ruralUrbanFilter?: 'rural' | 'urban' | 'both';
  
  /** Application deadline (ISO 8601 date string, optional) */
  applicationDeadline?: string;
  
  /** Whether the scheme is open-ended (no deadline) */
  isOpenEnded: boolean;
  
  /** Estimated processing time */
  processingTime?: string;
  
  /** Application mode */
  applicationMode: 'online' | 'offline' | 'both';
  
  /** Online application URL (if applicable) */
  applicationUrl?: string;
  
  /** Office locations for offline application */
  officeLocations?: OfficeLocation[];
  
  /** Trust level of the scheme information */
  trustLevel: 'verified' | 'partially_correct' | 'misleading' | 'unverifiable';
  
  /** Source URL for scheme information */
  sourceUrl: string;
  
  /** Last verification date (ISO 8601 date string) */
  lastVerified: string;
  
  /** Creation timestamp (ISO 8601 date string) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601 date string) */
  updatedAt: string;
}

/**
 * DynamoDB table structure for eligibility rules
 * Using single-table design pattern
 */
export interface EligibilityRuleDynamoDBItem {
  /** Partition key: RULE#{ruleId} */
  PK: string;
  
  /** Sort key: SCHEME#{schemeId} */
  SK: string;
  
  /** GSI1 Partition key: SCHEME#{schemeId} for querying by scheme */
  GSI1PK: string;
  
  /** GSI1 Sort key: CATEGORY#{category} for filtering by category */
  GSI1SK: string;
  
  /** GSI2 Partition key: STATE#{state} for location-based queries */
  GSI2PK?: string;
  
  /** GSI2 Sort key: CATEGORY#{category} */
  GSI2SK?: string;
  
  /** Entity type for single-table design */
  entityType: 'ELIGIBILITY_RULE';
  
  /** The actual rule data */
  rule: EligibilityRule;
  
  /** TTL for automatic expiration (optional, Unix timestamp) */
  ttl?: number;
}
