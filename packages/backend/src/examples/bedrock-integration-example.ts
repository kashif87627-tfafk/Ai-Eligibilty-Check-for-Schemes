/**
 * Bedrock Integration Usage Examples
 * 
 * This file demonstrates how to use the Bedrock integration module
 * for AI-powered eligibility evaluation.
 */

import {
  evaluateWithBedrock,
  batchEvaluateWithBedrock,
  generateEnhancedExplanation,
  formatPromptForLLM,
  parseLLMResponse
} from '../services/bedrock-integration';
import { EligibilityRule } from '../types/eligibility-rules';

/**
 * Example 1: Single Scheme Evaluation with Bedrock
 * 
 * This example shows how to evaluate a user's eligibility for a single scheme
 * using Amazon Bedrock for contextual reasoning.
 */
export async function exampleSingleEvaluation() {
  const userId = 'user-123';
  
  const userProfile = {
    ageRange: '18-25',
    gender: 'female',
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban'
    },
    education: 'graduate',
    occupation: 'student',
    employmentStatus: 'student',
    incomeRange: 'below_50k',
    category: 'general',
    disabilityStatus: 'none'
  };

  const scheme: EligibilityRule = {
    id: 'rule-001',
    schemeId: 'pm-scholarship-2024',
    schemeName: 'PM Scholarship Scheme',
    description: 'Merit-based scholarship for undergraduate students from economically weaker sections',
    category: 'education',
    targetAudience: ['students', 'youth'],
    criteria: [
      {
        id: 'crit-001',
        field: 'ageRange',
        operator: 'in',
        value: ['18-25', '26-35'],
        weight: 0.2,
        description: 'Age must be between 18-35 years',
        mandatory: true
      },
      {
        id: 'crit-002',
        field: 'education',
        operator: 'in',
        value: ['secondary', 'graduate'],
        weight: 0.3,
        description: 'Must be pursuing undergraduate or completed secondary education',
        mandatory: true
      },
      {
        id: 'crit-003',
        field: 'incomeRange',
        operator: 'in',
        value: ['below_50k', '50k_1l'],
        weight: 0.3,
        description: 'Annual family income must be below ₹1 lakh',
        mandatory: true
      },
      {
        id: 'crit-004',
        field: 'location.state',
        operator: 'in',
        value: ['Karnataka', 'Tamil Nadu', 'Kerala'],
        weight: 0.2,
        description: 'Must be a resident of Karnataka, Tamil Nadu, or Kerala',
        mandatory: false
      }
    ],
    requiredDocuments: [
      {
        type: 'aadhaar',
        name: 'Aadhaar Card',
        mandatory: true,
        description: 'Government-issued Aadhaar card for identity verification'
      },
      {
        type: 'income_certificate',
        name: 'Income Certificate',
        mandatory: true,
        description: 'Income certificate from Tehsil office (valid for current year)'
      },
      {
        type: 'education',
        name: 'Education Certificate',
        mandatory: true,
        description: 'Latest mark sheet or enrollment certificate'
      }
    ],
    applicableStates: ['Karnataka', 'Tamil Nadu', 'Kerala'],
    ruralUrbanFilter: 'both',
    isOpenEnded: false,
    applicationDeadline: '2024-12-31T23:59:59Z',
    processingTime: '30-45 days',
    applicationMode: 'online',
    applicationUrl: 'https://scholarships.gov.in/pm-scholarship',
    trustLevel: 'verified',
    sourceUrl: 'https://scholarships.gov.in/scheme-details',
    lastVerified: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  };

  const userDocuments = ['aadhaar', 'education']; // User has uploaded these documents

  try {
    // Evaluate with Bedrock (includes automatic fallback to rule-based evaluation)
    const result = await evaluateWithBedrock(
      userId,
      userProfile,
      scheme,
      userDocuments,
      {
        fallbackToRules: true, // Enable fallback to rule-based evaluation
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('Eligibility Evaluation Result:');
    console.log('Status:', result.status);
    console.log('Confidence:', result.confidenceScore + '%');
    console.log('Reasoning:', result.reasoning);
    console.log('Matched Criteria:', result.matchedCriteria.length);
    console.log('Missing Documents:', result.missingDocuments.map(d => d.document.name));

    return result;
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw error;
  }
}

/**
 * Example 2: Batch Evaluation of Multiple Schemes
 * 
 * This example shows how to evaluate a user against multiple schemes
 * and get AI-powered reasoning for each.
 */
export async function exampleBatchEvaluation() {
  const userId = 'user-456';
  
  const userProfile = {
    ageRange: '26-35',
    location: {
      state: 'Maharashtra',
      district: 'Mumbai',
      ruralUrban: 'urban'
    },
    education: 'postgraduate',
    employmentStatus: 'unemployed',
    incomeRange: '50k_1l'
  };

  // Multiple schemes to evaluate
  const schemes: EligibilityRule[] = [
    // Scheme 1: Skill Development Program
    {
      id: 'rule-002',
      schemeId: 'skill-dev-2024',
      schemeName: 'National Skill Development Program',
      description: 'Free skill training for unemployed youth',
      category: 'employment',
      targetAudience: ['unemployed', 'youth'],
      criteria: [
        {
          id: 'crit-age',
          field: 'ageRange',
          operator: 'in',
          value: ['18-25', '26-35'],
          weight: 0.3,
          description: 'Age 18-35 years',
          mandatory: true
        },
        {
          id: 'crit-employment',
          field: 'employmentStatus',
          operator: 'eq',
          value: 'unemployed',
          weight: 0.7,
          description: 'Must be currently unemployed',
          mandatory: true
        }
      ],
      requiredDocuments: [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Identity proof'
        }
      ],
      applicableStates: [],
      isOpenEnded: true,
      applicationMode: 'both',
      trustLevel: 'verified',
      sourceUrl: 'https://nsdcindia.org',
      lastVerified: '2024-01-10T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    },
    // Scheme 2: Employment Guarantee Scheme
    {
      id: 'rule-003',
      schemeId: 'employment-guarantee-2024',
      schemeName: 'Urban Employment Guarantee Scheme',
      description: 'Guaranteed employment for urban unemployed',
      category: 'employment',
      targetAudience: ['unemployed', 'urban residents'],
      criteria: [
        {
          id: 'crit-location',
          field: 'location.ruralUrban',
          operator: 'eq',
          value: 'urban',
          weight: 0.4,
          description: 'Must be urban resident',
          mandatory: true
        },
        {
          id: 'crit-employment',
          field: 'employmentStatus',
          operator: 'eq',
          value: 'unemployed',
          weight: 0.6,
          description: 'Must be unemployed',
          mandatory: true
        }
      ],
      requiredDocuments: [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Identity and address proof'
        },
        {
          type: 'domicile',
          name: 'Domicile Certificate',
          mandatory: true,
          description: 'Proof of residence'
        }
      ],
      applicableStates: ['Maharashtra', 'Karnataka'],
      ruralUrbanFilter: 'urban',
      isOpenEnded: true,
      applicationMode: 'offline',
      trustLevel: 'verified',
      sourceUrl: 'https://maharashtra.gov.in/employment',
      lastVerified: '2024-01-12T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-12T00:00:00Z'
    }
  ];

  try {
    // Batch evaluate all schemes
    const results = await batchEvaluateWithBedrock(
      userId,
      userProfile,
      schemes,
      ['aadhaar'], // User has Aadhaar
      {
        fallbackToRules: true,
        timeout: 30000
      }
    );

    console.log(`\nEvaluated ${results.length} schemes:`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.schemeName}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Confidence: ${result.confidenceScore}%`);
      console.log(`   Missing Documents: ${result.missingDocuments.length}`);
    });

    // Sort by confidence score
    const sortedResults = results.sort((a, b) => b.confidenceScore - a.confidenceScore);
    console.log('\nTop recommendation:', sortedResults[0].schemeName);

    return results;
  } catch (error) {
    console.error('Batch evaluation failed:', error);
    throw error;
  }
}

/**
 * Example 3: Generate Enhanced Explanation
 * 
 * This example shows how to generate a user-friendly explanation
 * for an eligibility result using Bedrock.
 */
export async function exampleEnhancedExplanation() {
  const userId = 'user-789';
  
  const userProfile = {
    ageRange: '36-45',
    location: {
      state: 'Tamil Nadu',
      district: 'Chennai',
      ruralUrban: 'urban'
    },
    education: 'secondary',
    incomeRange: '1l_2l'
  };

  const scheme: EligibilityRule = {
    id: 'rule-004',
    schemeId: 'housing-scheme-2024',
    schemeName: 'Affordable Housing Scheme',
    description: 'Subsidized housing for low-income families',
    category: 'housing',
    targetAudience: ['low-income families'],
    criteria: [
      {
        id: 'crit-income',
        field: 'incomeRange',
        operator: 'in',
        value: ['below_50k', '50k_1l'],
        weight: 0.8,
        description: 'Annual income below ₹1 lakh',
        mandatory: true
      },
      {
        id: 'crit-age',
        field: 'ageRange',
        operator: 'in',
        value: ['18-25', '26-35'],
        weight: 0.2,
        description: 'Age 18-35 years',
        mandatory: false
      }
    ],
    requiredDocuments: [
      {
        type: 'income_certificate',
        name: 'Income Certificate',
        mandatory: true,
        description: 'Proof of income'
      }
    ],
    applicableStates: ['Tamil Nadu'],
    isOpenEnded: false,
    applicationDeadline: '2024-06-30T23:59:59Z',
    applicationMode: 'online',
    trustLevel: 'verified',
    sourceUrl: 'https://tn.gov.in/housing',
    lastVerified: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  try {
    // First, get the evaluation result
    const result = await evaluateWithBedrock(userId, userProfile, scheme, []);

    console.log('Initial Evaluation:');
    console.log('Status:', result.status);
    console.log('Standard Reasoning:', result.reasoning);

    // Generate enhanced explanation in simple language
    const enhancedExplanation = await generateEnhancedExplanation(
      result,
      userProfile,
      scheme,
      'en' // English
    );

    console.log('\nEnhanced Explanation:');
    console.log(enhancedExplanation);

    return enhancedExplanation;
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    throw error;
  }
}

/**
 * Example 4: Handling Ambiguous Cases
 * 
 * This example demonstrates how Bedrock provides contextual reasoning
 * for ambiguous eligibility cases where rule-based logic alone is insufficient.
 */
export async function exampleAmbiguousCase() {
  const userId = 'user-999';
  
  // User with incomplete/ambiguous information
  const userProfile = {
    ageRange: '26-35', // Borderline age
    location: {
      state: 'Bihar',
      district: 'Patna',
      ruralUrban: 'urban' // But recently migrated from rural area
    },
    education: 'primary', // Limited education
    occupation: 'daily wage worker',
    employmentStatus: 'self_employed', // Informal sector
    incomeRange: '50k_1l' // Approximate, irregular income
  };

  const scheme: EligibilityRule = {
    id: 'rule-005',
    schemeId: 'rural-livelihood-2024',
    schemeName: 'Rural Livelihood Enhancement Program',
    description: 'Support for rural and migrant workers',
    category: 'welfare',
    targetAudience: ['rural residents', 'migrant workers', 'informal sector'],
    criteria: [
      {
        id: 'crit-location',
        field: 'location.ruralUrban',
        operator: 'eq',
        value: 'rural',
        weight: 0.4,
        description: 'Must be rural resident or recent migrant',
        mandatory: false // Flexible for migrants
      },
      {
        id: 'crit-income',
        field: 'incomeRange',
        operator: 'in',
        value: ['below_50k', '50k_1l'],
        weight: 0.4,
        description: 'Low income household',
        mandatory: true
      },
      {
        id: 'crit-employment',
        field: 'employmentStatus',
        operator: 'in',
        value: ['unemployed', 'self_employed'],
        weight: 0.2,
        description: 'Unemployed or informal sector worker',
        mandatory: false
      }
    ],
    requiredDocuments: [
      {
        type: 'aadhaar',
        name: 'Aadhaar Card',
        mandatory: true,
        description: 'Identity proof'
      },
      {
        type: 'income_certificate',
        name: 'Income Certificate',
        mandatory: false,
        description: 'Income proof (if available)'
      }
    ],
    applicableStates: ['Bihar', 'Uttar Pradesh', 'Jharkhand'],
    ruralUrbanFilter: 'both',
    isOpenEnded: true,
    applicationMode: 'both',
    trustLevel: 'verified',
    sourceUrl: 'https://rural.nic.in/livelihood',
    lastVerified: '2024-01-05T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  };

  try {
    console.log('Evaluating ambiguous case (recent rural-to-urban migrant)...\n');

    // Bedrock will provide contextual reasoning for this ambiguous case
    const result = await evaluateWithBedrock(
      userId,
      userProfile,
      scheme,
      ['aadhaar'],
      {
        fallbackToRules: true,
        timeout: 30000
      }
    );

    console.log('Bedrock Evaluation Result:');
    console.log('Status:', result.status);
    console.log('Confidence:', result.confidenceScore + '%');
    console.log('\nContextual Reasoning:');
    console.log(result.reasoning);
    console.log('\nMatched Criteria:', result.matchedCriteria.length);
    console.log('Unmatched Criteria:', result.unmatchedCriteria.length);
    console.log('Missing Criteria:', result.missingCriteria.length);

    // Bedrock should recognize that:
    // 1. User is technically "urban" but likely a recent migrant
    // 2. Income is borderline but within acceptable range
    // 3. Self-employment in informal sector aligns with target audience
    // 4. Overall, user should be conditionally eligible with verification

    return result;
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw error;
  }
}

/**
 * Example 5: Prompt Formatting for Custom Use Cases
 * 
 * This example shows how to use the prompt formatting function
 * for custom integrations or testing.
 */
export function examplePromptFormatting() {
  const userProfile = {
    ageRange: '18-25',
    location: { state: 'Kerala', ruralUrban: 'rural' },
    education: 'secondary',
    incomeRange: 'below_50k'
  };

  const scheme: EligibilityRule = {
    id: 'rule-006',
    schemeId: 'test-scheme',
    schemeName: 'Test Scheme',
    description: 'Test description',
    category: 'education',
    targetAudience: ['students'],
    criteria: [
      {
        id: 'crit-001',
        field: 'ageRange',
        operator: 'in',
        value: ['18-25'],
        weight: 1.0,
        description: 'Age 18-25',
        mandatory: true
      }
    ],
    requiredDocuments: [],
    applicableStates: ['Kerala'],
    isOpenEnded: true,
    applicationMode: 'online',
    trustLevel: 'verified',
    sourceUrl: 'https://example.com',
    lastVerified: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  // Format the prompt
  const prompt = formatPromptForLLM(userProfile, scheme);

  console.log('Generated Prompt:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));

  return prompt;
}

/**
 * Example 6: Response Parsing
 * 
 * This example demonstrates parsing LLM responses in different formats.
 */
export function exampleResponseParsing() {
  // Example 1: Clean JSON response
  const cleanResponse = JSON.stringify({
    status: 'strongly_eligible',
    confidence: 92,
    reasoning: 'You meet all mandatory criteria and most optional criteria.',
    contextualInsights: 'Your rural location qualifies you for additional benefits.',
    suggestedNextSteps: [
      'Collect your Aadhaar card',
      'Visit nearest CSC for application assistance',
      'Apply before the deadline'
    ]
  });

  console.log('Parsing clean JSON response:');
  const parsed1 = parseLLMResponse(cleanResponse);
  console.log('Status:', parsed1.status);
  console.log('Confidence:', parsed1.confidence);
  console.log('Steps:', parsed1.suggestedNextSteps?.length);

  // Example 2: Response with markdown code blocks
  const markdownResponse = `\`\`\`json
{
  "status": "conditionally_eligible",
  "confidence": 68,
  "reasoning": "You meet most criteria but need income verification."
}
\`\`\``;

  console.log('\nParsing markdown-wrapped response:');
  const parsed2 = parseLLMResponse(markdownResponse);
  console.log('Status:', parsed2.status);
  console.log('Confidence:', parsed2.confidence);

  return { parsed1, parsed2 };
}

// Export all examples for easy testing
export const examples = {
  singleEvaluation: exampleSingleEvaluation,
  batchEvaluation: exampleBatchEvaluation,
  enhancedExplanation: exampleEnhancedExplanation,
  ambiguousCase: exampleAmbiguousCase,
  promptFormatting: examplePromptFormatting,
  responseParsing: exampleResponseParsing
};
