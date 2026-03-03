/**
 * Document Gap Detection Service
 * 
 * Compares user documents against scheme requirements to identify missing documents.
 * Returns prioritized list of missing documents with descriptions.
 * 
 * Requirements: FR-7.2, FR-2.4
 */

import { DocumentRequirement } from '../types/eligibility-rules';

/**
 * Represents a missing document with priority and guidance
 */
export interface MissingDocument {
  /** Document type identifier */
  type: string;
  
  /** Human-readable name */
  name: string;
  
  /** Whether this document is mandatory */
  mandatory: boolean;
  
  /** Description of the document */
  description: string;
  
  /** Priority level (1 = highest, 3 = lowest) */
  priority: 1 | 2 | 3;
  
  /** Alternative documents that can be used instead */
  alternativeDocuments?: string[];
  
  /** Suggested location to obtain the document */
  obtainFrom?: string;
}

/**
 * Result of document gap detection
 */
export interface DocumentGapResult {
  /** Total number of required documents */
  totalRequired: number;
  
  /** Number of documents the user has */
  documentsProvided: number;
  
  /** Number of missing mandatory documents */
  missingMandatory: number;
  
  /** Number of missing optional documents */
  missingOptional: number;
  
  /** List of missing documents, prioritized */
  missingDocuments: MissingDocument[];
  
  /** Whether user has all mandatory documents */
  hasAllMandatory: boolean;
  
  /** Completion percentage (0-100) */
  completionPercentage: number;
}

/**
 * Map document types to suggested locations for obtaining them
 */
const DOCUMENT_OBTAIN_LOCATIONS: Record<string, string> = {
  'aadhaar': 'UIDAI Enrollment Center or online at uidai.gov.in',
  'income_certificate': 'Tehsil Office or Revenue Department',
  'caste_certificate': 'Tehsil Office or District Magistrate Office',
  'education_certificate': 'Educational Institution or Board Office',
  'disability_certificate': 'District Medical Board or Civil Surgeon Office',
  'domicile_certificate': 'Tehsil Office or District Magistrate Office',
  'ration_card': 'Food and Civil Supplies Department',
  'voter_id': 'Electoral Registration Office',
  'bank_account': 'Any nationalized or private bank',
  'employment_certificate': 'Current or previous employer',
};

/**
 * Normalize document type for comparison
 * Handles variations in naming (e.g., "aadhaar" vs "aadhar", "caste" vs "caste_certificate")
 */
function normalizeDocumentType(docType: string): string {
  return docType
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, '_')
    .replace(/_certificate$/, '')
    .replace(/_card$/, '')
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Check if user has a specific document or its alternatives
 */
function hasDocumentOrAlternative(
  userDocuments: string[],
  requiredType: string,
  alternatives?: string[]
): boolean {
  const normalizedRequired = normalizeDocumentType(requiredType);
  const normalizedUserDocs = userDocuments.map(normalizeDocumentType);
  
  // Check if user has the required document
  if (normalizedUserDocs.includes(normalizedRequired)) {
    return true;
  }
  
  // Check if user has any alternative document
  if (alternatives && alternatives.length > 0) {
    const normalizedAlternatives = alternatives.map(normalizeDocumentType);
    return normalizedAlternatives.some(alt => normalizedUserDocs.includes(alt));
  }
  
  return false;
}

/**
 * Determine priority for a missing document
 * Priority 1: Mandatory documents
 * Priority 2: Optional documents that significantly improve eligibility
 * Priority 3: Optional documents with low impact
 */
function determinePriority(requirement: DocumentRequirement): 1 | 2 | 3 {
  if (requirement.mandatory) {
    return 1;
  }
  
  // Optional documents with alternatives have lower priority
  if (requirement.alternativeDocuments && requirement.alternativeDocuments.length > 0) {
    return 3;
  }
  
  return 2;
}

/**
 * Detect document gaps by comparing user documents against scheme requirements
 * 
 * @param schemeRequirements - List of document requirements from the scheme
 * @param userDocuments - List of document types the user has uploaded
 * @returns Document gap analysis with prioritized missing documents
 */
export function detectDocumentGaps(
  schemeRequirements: DocumentRequirement[],
  userDocuments: string[]
): DocumentGapResult {
  const missingDocuments: MissingDocument[] = [];
  let missingMandatory = 0;
  let missingOptional = 0;
  
  // Check each required document
  for (const requirement of schemeRequirements) {
    const hasDocument = hasDocumentOrAlternative(
      userDocuments,
      requirement.type,
      requirement.alternativeDocuments
    );
    
    if (!hasDocument) {
      // Document is missing
      const priority = determinePriority(requirement);
      
      missingDocuments.push({
        type: requirement.type,
        name: requirement.name,
        mandatory: requirement.mandatory,
        description: requirement.description,
        priority,
        alternativeDocuments: requirement.alternativeDocuments,
        obtainFrom: DOCUMENT_OBTAIN_LOCATIONS[requirement.type],
      });
      
      if (requirement.mandatory) {
        missingMandatory++;
      } else {
        missingOptional++;
      }
    }
  }
  
  // Sort by priority (1 first, then 2, then 3)
  missingDocuments.sort((a, b) => a.priority - b.priority);
  
  // Calculate completion percentage
  const totalRequired = schemeRequirements.length;
  const documentsProvided = totalRequired - missingDocuments.length;
  const completionPercentage = totalRequired > 0 
    ? Math.round((documentsProvided / totalRequired) * 100)
    : 100;
  
  return {
    totalRequired,
    documentsProvided,
    missingMandatory,
    missingOptional,
    missingDocuments,
    hasAllMandatory: missingMandatory === 0,
    completionPercentage,
  };
}

/**
 * Generate user-friendly summary of document gaps
 * 
 * @param gapResult - Result from detectDocumentGaps
 * @returns Human-readable summary
 */
export function generateDocumentGapSummary(gapResult: DocumentGapResult): string {
  if (gapResult.missingDocuments.length === 0) {
    return 'You have provided all required documents.';
  }
  
  const parts: string[] = [];
  
  if (gapResult.missingMandatory > 0) {
    parts.push(
      `You are missing ${gapResult.missingMandatory} mandatory document${gapResult.missingMandatory > 1 ? 's' : ''}.`
    );
  }
  
  if (gapResult.missingOptional > 0) {
    parts.push(
      `You are also missing ${gapResult.missingOptional} optional document${gapResult.missingOptional > 1 ? 's' : ''} that could strengthen your application.`
    );
  }
  
  parts.push(
    `Document completion: ${gapResult.completionPercentage}%`
  );
  
  return parts.join(' ');
}

/**
 * Get actionable steps for obtaining missing documents
 * 
 * @param missingDocuments - List of missing documents
 * @param maxSteps - Maximum number of steps to return (default: 5)
 * @returns List of actionable steps
 */
export function getDocumentActionSteps(
  missingDocuments: MissingDocument[],
  maxSteps: number = 5
): string[] {
  const steps: string[] = [];
  
  // Focus on mandatory documents first
  const mandatoryDocs = missingDocuments.filter(d => d.mandatory);
  const optionalDocs = missingDocuments.filter(d => !d.mandatory);
  
  // Add steps for mandatory documents
  for (const doc of mandatoryDocs.slice(0, maxSteps)) {
    if (doc.obtainFrom) {
      steps.push(`Obtain ${doc.name} from ${doc.obtainFrom}`);
    } else {
      steps.push(`Obtain ${doc.name}`);
    }
  }
  
  // Add steps for optional documents if we have room
  const remainingSlots = maxSteps - steps.length;
  if (remainingSlots > 0) {
    for (const doc of optionalDocs.slice(0, remainingSlots)) {
      if (doc.obtainFrom) {
        steps.push(`Consider obtaining ${doc.name} from ${doc.obtainFrom} (optional)`);
      } else {
        steps.push(`Consider obtaining ${doc.name} (optional)`);
      }
    }
  }
  
  return steps;
}
