/**
 * Document Gap Detection Example
 * 
 * Demonstrates how to use the document gap detection service to identify
 * missing documents for scheme applications.
 * 
 * Requirements: FR-7.2, FR-2.4
 */

import {
  detectDocumentGaps,
  generateDocumentGapSummary,
  getDocumentActionSteps
} from '../services/document-gap-detection';
import { DocumentRequirement } from '../types/eligibility-rules';

/**
 * Example 1: Basic document gap detection
 */
function example1_BasicGapDetection() {
  console.log('\n=== Example 1: Basic Document Gap Detection ===\n');
  
  // Define scheme requirements
  const schemeRequirements: DocumentRequirement[] = [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued identity proof'
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Certificate showing annual income'
    },
    {
      type: 'education_certificate',
      name: 'Education Certificate',
      mandatory: false,
      description: 'Highest education qualification'
    }
  ];
  
  // User has only Aadhaar
  const userDocuments = ['aadhaar'];
  
  // Detect gaps
  const result = detectDocumentGaps(schemeRequirements, userDocuments);
  
  console.log('Total Required:', result.totalRequired);
  console.log('Documents Provided:', result.documentsProvided);
  console.log('Missing Mandatory:', result.missingMandatory);
  console.log('Missing Optional:', result.missingOptional);
  console.log('Completion:', result.completionPercentage + '%');
  console.log('Has All Mandatory:', result.hasAllMandatory);
  
  console.log('\nMissing Documents:');
  result.missingDocuments.forEach(doc => {
    console.log(`  - ${doc.name} (${doc.mandatory ? 'Mandatory' : 'Optional'})`);
    console.log(`    ${doc.description}`);
    if (doc.obtainFrom) {
      console.log(`    Obtain from: ${doc.obtainFrom}`);
    }
  });
  
  // Generate summary
  const summary = generateDocumentGapSummary(result);
  console.log('\nSummary:', summary);
  
  // Get action steps
  const actionSteps = getDocumentActionSteps(result.missingDocuments);
  console.log('\nAction Steps:');
  actionSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
}

/**
 * Example 2: Alternative documents
 */
function example2_AlternativeDocuments() {
  console.log('\n=== Example 2: Alternative Documents ===\n');
  
  // Scheme accepts income certificate OR salary slip OR bank statement
  const schemeRequirements: DocumentRequirement[] = [
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Certificate showing annual income',
      alternativeDocuments: ['salary_slip', 'bank_statement']
    }
  ];
  
  // User has salary slip (alternative document)
  const userDocuments = ['salary_slip'];
  
  const result = detectDocumentGaps(schemeRequirements, userDocuments);
  
  console.log('Has All Mandatory:', result.hasAllMandatory);
  console.log('Missing Documents:', result.missingDocuments.length);
  console.log('Completion:', result.completionPercentage + '%');
  
  if (result.hasAllMandatory) {
    console.log('\n✓ User has provided acceptable alternative document');
  }
}

/**
 * Example 3: Complete application (all documents provided)
 */
function example3_CompleteApplication() {
  console.log('\n=== Example 3: Complete Application ===\n');
  
  const schemeRequirements: DocumentRequirement[] = [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued identity proof'
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Certificate showing annual income'
    },
    {
      type: 'caste_certificate',
      name: 'Caste Certificate',
      mandatory: false,
      description: 'Certificate showing caste category'
    }
  ];
  
  // User has all documents
  const userDocuments = ['aadhaar', 'income_certificate', 'caste_certificate'];
  
  const result = detectDocumentGaps(schemeRequirements, userDocuments);
  
  console.log('Completion:', result.completionPercentage + '%');
  console.log('Has All Mandatory:', result.hasAllMandatory);
  console.log('Missing Documents:', result.missingDocuments.length);
  
  const summary = generateDocumentGapSummary(result);
  console.log('\nSummary:', summary);
}

/**
 * Example 4: Priority-based action steps
 */
function example4_PriorityBasedSteps() {
  console.log('\n=== Example 4: Priority-Based Action Steps ===\n');
  
  const schemeRequirements: DocumentRequirement[] = [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued identity proof'
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Certificate showing annual income'
    },
    {
      type: 'education_certificate',
      name: 'Education Certificate',
      mandatory: false,
      description: 'Highest education qualification'
    },
    {
      type: 'disability_certificate',
      name: 'Disability Certificate',
      mandatory: false,
      description: 'Certificate for disability status',
      alternativeDocuments: ['medical_certificate']
    }
  ];
  
  // User has no documents
  const userDocuments: string[] = [];
  
  const result = detectDocumentGaps(schemeRequirements, userDocuments);
  
  console.log('Missing Documents (by priority):');
  result.missingDocuments.forEach(doc => {
    console.log(`  Priority ${doc.priority}: ${doc.name} (${doc.mandatory ? 'Mandatory' : 'Optional'})`);
  });
  
  // Get limited action steps (focus on most important)
  const actionSteps = getDocumentActionSteps(result.missingDocuments, 3);
  console.log('\nTop 3 Action Steps:');
  actionSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
}

/**
 * Example 5: Integration with eligibility evaluation
 */
function example5_EligibilityIntegration() {
  console.log('\n=== Example 5: Integration with Eligibility Evaluation ===\n');
  
  // Simulated eligibility evaluation response
  const eligibilityResult = {
    status: 'conditionally_eligible',
    confidenceScore: 75,
    reasoning: 'User meets most criteria but missing some documents'
  };
  
  const schemeRequirements: DocumentRequirement[] = [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued identity proof'
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Certificate showing annual income'
    }
  ];
  
  const userDocuments = ['aadhaar'];
  
  const documentGaps = detectDocumentGaps(schemeRequirements, userDocuments);
  
  console.log('Eligibility Status:', eligibilityResult.status);
  console.log('Confidence Score:', eligibilityResult.confidenceScore + '%');
  console.log('Reasoning:', eligibilityResult.reasoning);
  
  console.log('\nDocument Status:');
  console.log('  Completion:', documentGaps.completionPercentage + '%');
  console.log('  Has All Mandatory:', documentGaps.hasAllMandatory);
  
  if (!documentGaps.hasAllMandatory) {
    console.log('\n⚠ Action Required:');
    const actionSteps = getDocumentActionSteps(documentGaps.missingDocuments);
    actionSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
  }
}

/**
 * Run all examples
 */
function runAllExamples() {
  example1_BasicGapDetection();
  example2_AlternativeDocuments();
  example3_CompleteApplication();
  example4_PriorityBasedSteps();
  example5_EligibilityIntegration();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_BasicGapDetection,
  example2_AlternativeDocuments,
  example3_CompleteApplication,
  example4_PriorityBasedSteps,
  example5_EligibilityIntegration,
  runAllExamples
};
