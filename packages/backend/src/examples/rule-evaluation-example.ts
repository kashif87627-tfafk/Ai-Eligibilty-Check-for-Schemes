/**
 * Example: Using the Rule Evaluation Engine
 * 
 * This file demonstrates how to use the rule evaluation engine
 * to evaluate user eligibility for government schemes.
 */

import { evaluateEligibility, batchEvaluateEligibility, sortByConfidence } from '../services/rule-evaluation-engine';
import { pmScholarshipRule, skillDevelopmentRule } from '../data/sample-eligibility-rules';
import { UserProfile } from '../types/user-profile';

// Example 1: Evaluate a single scheme
function exampleSingleEvaluation() {
  console.log('=== Example 1: Single Scheme Evaluation ===\n');
  
  // Sample user profile
  const userProfile: UserProfile = {
    id: 'user-001',
    phoneNumber: '+919876543210',
    ageRange: '18-25',
    gender: 'male',
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban'
    },
    education: 'graduate',
    employmentStatus: 'student',
    incomeRange: '50k_1l',
    category: 'obc',
    language: 'en',
    interactionMode: 'text',
    explanationLevel: 'standard',
    consentGiven: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // User's uploaded documents
  const userDocuments = ['aadhaar', 'income_certificate'];
  
  // Evaluate eligibility
  const result = evaluateEligibility(
    'user-001',
    userProfile,
    pmScholarshipRule,
    userDocuments
  );
  
  console.log('Scheme:', result.schemeName);
  console.log('Status:', result.status);
  console.log('Confidence Score:', result.confidenceScore + '%');
  console.log('Mandatory Criteria Met:', result.mandatoryCriteriaMet);
  console.log('\nReasoning:', result.reasoning);
  
  console.log('\nMatched Criteria:');
  result.matchedCriteria.forEach(c => {
    console.log(`  ✓ ${c.criterion.description}`);
  });
  
  console.log('\nUnmatched Criteria:');
  result.unmatchedCriteria.forEach(c => {
    console.log(`  ✗ ${c.criterion.description}`);
  });
  
  console.log('\nMissing Criteria:');
  result.missingCriteria.forEach(m => {
    console.log(`  ? ${m.explanation}`);
  });
  
  console.log('\nMissing Documents:');
  result.missingDocuments.forEach(d => {
    console.log(`  📄 ${d.document.name}: ${d.explanation}`);
  });
  
  console.log('\n');
}

// Example 2: Batch evaluate multiple schemes
function exampleBatchEvaluation() {
  console.log('=== Example 2: Batch Evaluation (Multiple Schemes) ===\n');
  
  const userProfile: UserProfile = {
    id: 'user-002',
    phoneNumber: '+919876543211',
    ageRange: '26-35',
    location: {
      state: 'Karnataka',
      district: 'Mysore',
      ruralUrban: 'rural'
    },
    education: 'secondary',
    employmentStatus: 'unemployed',
    incomeRange: 'below_50k',
    category: 'sc',
    language: 'en',
    interactionMode: 'text',
    explanationLevel: 'standard',
    consentGiven: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const userDocuments = ['aadhaar', 'caste_certificate'];
  
  // Evaluate multiple schemes
  const results = batchEvaluateEligibility(
    'user-002',
    userProfile,
    [pmScholarshipRule, skillDevelopmentRule],
    userDocuments
  );
  
  // Sort by confidence score
  const sortedResults = sortByConfidence(results);
  
  console.log('Evaluated', results.length, 'schemes:\n');
  
  sortedResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.schemeName}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   Matched: ${result.matchedCriteria.length} criteria`);
    console.log(`   Missing: ${result.missingDocuments.length} documents`);
    console.log('');
  });
}

// Example 3: Handling incomplete profiles
function exampleIncompleteProfile() {
  console.log('=== Example 3: Incomplete Profile ===\n');
  
  // User with missing information
  const incompleteProfile = {
    id: 'user-003',
    phoneNumber: '+919876543212',
    ageRange: '18-25' as const,
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban' as const
    },
    // Missing: education, employmentStatus, incomeRange
    language: 'en',
    interactionMode: 'text' as const,
    explanationLevel: 'standard' as const,
    consentGiven: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = evaluateEligibility(
    'user-003',
    incompleteProfile,
    pmScholarshipRule,
    []
  );
  
  console.log('Scheme:', result.schemeName);
  console.log('Status:', result.status);
  console.log('Confidence Score:', result.confidenceScore + '%');
  console.log('\nReasoning:', result.reasoning);
  
  console.log('\nMissing Information:');
  result.missingCriteria.forEach(m => {
    console.log(`  • ${m.criterion.description}`);
  });
  
  console.log('\nNext Steps:');
  console.log('  1. Complete your profile with missing information');
  console.log('  2. Upload required documents');
  console.log('  3. Re-evaluate eligibility');
  console.log('\n');
}

// Example 4: Confidence bands
function exampleConfidenceBands() {
  console.log('=== Example 4: Understanding Confidence Bands ===\n');
  
  console.log('Confidence Band Classification:');
  console.log('  • Strongly Eligible (80-100%): All mandatory criteria met, high confidence');
  console.log('  • Conditionally Eligible (50-79%): Most criteria met, some verification needed');
  console.log('  • Needs Verification (20-49%): Important information missing');
  console.log('  • Not Eligible (0-19%): Mandatory criteria not met');
  console.log('\n');
  
  // Example profiles for each band
  const profiles = [
    {
      name: 'Strongly Eligible User',
      profile: {
        id: 'user-004',
        phoneNumber: '+919876543213',
        ageRange: '18-25' as const,
        location: { state: 'Karnataka', district: 'Bangalore', ruralUrban: 'urban' as const },
        education: 'graduate' as const,
        employmentStatus: 'student' as const,
        incomeRange: 'below_50k' as const,
        category: 'sc' as const,
        language: 'en',
        interactionMode: 'text' as const,
        explanationLevel: 'standard' as const,
        consentGiven: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      documents: ['aadhaar', 'income_certificate', 'education', 'caste_certificate']
    },
    {
      name: 'Not Eligible User (Wrong Age)',
      profile: {
        id: 'user-005',
        phoneNumber: '+919876543214',
        ageRange: '60+' as const,
        location: { state: 'Karnataka', district: 'Bangalore', ruralUrban: 'urban' as const },
        education: 'graduate' as const,
        employmentStatus: 'retired' as const,
        incomeRange: 'below_50k' as const,
        language: 'en',
        interactionMode: 'text' as const,
        explanationLevel: 'standard' as const,
        consentGiven: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      documents: []
    }
  ];
  
  profiles.forEach(({ name, profile, documents }) => {
    const result = evaluateEligibility('user', profile, pmScholarshipRule, documents);
    console.log(`${name}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Confidence: ${result.confidenceScore}%`);
    console.log(`  Reasoning: ${result.reasoning}`);
    console.log('');
  });
}

// Run all examples
if (require.main === module) {
  exampleSingleEvaluation();
  exampleBatchEvaluation();
  exampleIncompleteProfile();
  exampleConfidenceBands();
}

export {
  exampleSingleEvaluation,
  exampleBatchEvaluation,
  exampleIncompleteProfile,
  exampleConfidenceBands
};
