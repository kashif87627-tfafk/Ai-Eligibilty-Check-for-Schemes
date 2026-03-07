/**
 * Amazon Bedrock Integration Module
 * 
 * Provides AI-powered eligibility reasoning using Amazon Bedrock (Claude 3 Sonnet).
 * Implements prompt templates, response parsing, and error handling with fallback.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { EligibilityRule } from '../types/eligibility-rules';
import { EligibilityEvaluationResult, EligibilityStatus } from '../types/eligibility-evaluation';
import { evaluateEligibility } from './rule-evaluation-engine';
import { trackBedrockCall } from './metrics';
import { checkRateLimit, incrementRateLimit } from './rate-limiter';

/**
 * Bedrock model configuration
 */
// Use APAC inference profile for Nova Lite (works with AWS credits, no payment method needed)
const BEDROCK_MODEL_ID = 'apac.amazon.nova-lite-v1:0';
const BEDROCK_REGION = process.env.AWS_REGION || 'ap-south-1';
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.3; // Lower temperature for more deterministic responses

/**
 * Initialize Bedrock client
 */
const bedrockClient = new BedrockRuntimeClient({
  region: BEDROCK_REGION,
});

/**
 * Scenario considered by AI during evaluation
 */
export interface AIScenario {
  icon: '✓' | '✗' | '⚠️' | '💡';
  text: string;
  impact: 'positive' | 'negative' | 'neutral';
}

/**
 * Bedrock LLM response structure
 */
export interface BedrockLLMResponse {
  status: EligibilityStatus;
  confidence: number;
  reasoning: string;
  contextualInsights?: string;
  suggestedNextSteps?: string[];
  scenarios?: AIScenario[];
  aiSuggestions?: string[];
}

/**
 * Options for Bedrock evaluation
 */
export interface BedrockEvaluationOptions {
  /** Whether to use cached results if available */
  useCache?: boolean;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Whether to fallback to rule-based evaluation on error */
  fallbackToRules?: boolean;
}

/**
 * Format user profile and scheme criteria for LLM prompt
 * 
 * @param userProfile - User profile data
 * @param rule - Eligibility rule with criteria
 * @returns Formatted prompt string
 */
export function formatPromptForLLM(
  userProfile: any,
  rule: EligibilityRule
): string {
  // Format user profile
  const profileSection = `
User Profile:
- Age Range: ${userProfile.ageRange || 'Not provided'}
- Gender: ${userProfile.gender || 'Not provided'}
- Location: ${userProfile.location?.state || 'Not provided'}, ${userProfile.location?.district || 'Not provided'} (${userProfile.location?.ruralUrban || 'Not specified'})
- Education: ${userProfile.education || 'Not provided'}
- Occupation: ${userProfile.occupation || 'Not provided'}
- Employment Status: ${userProfile.employmentStatus || 'Not provided'}
- Income Range: ${userProfile.incomeRange || 'Not provided'}
- Category: ${userProfile.category || 'Not provided'}
- Disability Status: ${userProfile.disabilityStatus || 'Not provided'}
`.trim();

  // Format eligibility criteria
  const criteriaSection = rule.criteria.map((criterion, index) => {
    let valueStr = '';
    if (Array.isArray(criterion.value)) {
      valueStr = criterion.value.join(', ');
    } else if (typeof criterion.value === 'object' && 'min' in criterion.value && 'max' in criterion.value) {
      valueStr = `${criterion.value.min} to ${criterion.value.max}`;
    } else {
      valueStr = String(criterion.value);
    }
    
    return `${index + 1}. ${criterion.description} (${criterion.operator}: ${valueStr})${criterion.mandatory ? ' [MANDATORY]' : ''}`;
  }).join('\n');

  // Format required documents
  const documentsSection = rule.requiredDocuments.map((doc, index) => {
    return `${index + 1}. ${doc.name}${doc.mandatory ? ' [REQUIRED]' : ' [OPTIONAL]'}`;
  }).join('\n');

  // Construct the complete prompt
  const prompt = `You are an expert eligibility evaluator for Indian government welfare schemes. Your task is to evaluate whether a user is eligible for a specific scheme based on their profile and the scheme's criteria.

Scheme: ${rule.schemeName}
Description: ${rule.description}
Category: ${rule.category}

${profileSection}

Eligibility Criteria:
${criteriaSection}

Required Documents:
${documentsSection}

Task:
1. Carefully evaluate if the user meets each criterion, considering both exact matches and contextual factors
2. For ambiguous cases (e.g., approximate age ranges, income estimates), provide nuanced reasoning
3. Calculate a confidence score (0-100) based on how well the user matches the criteria
4. Classify eligibility as one of: strongly_eligible, conditionally_eligible, needs_verification, not_eligible
5. Provide clear, simple reasoning in 2-3 sentences explaining why the user is or isn't eligible
6. Generate specific scenarios you considered during evaluation (with icons: ✓ for positive, ✗ for negative, ⚠️ for borderline)
7. Provide 3-5 actionable AI suggestions to improve eligibility or application success

Important Guidelines:
- Be empathetic and supportive in your language
- Acknowledge uncertainty when information is incomplete
- Consider contextual factors (e.g., rural vs urban, regional variations, cost of living)
- Prioritize mandatory criteria in your evaluation
- Use simple language suitable for users with limited literacy
- For borderline cases (within 10% of limits), consider flexibility
- Suggest document alternatives when possible
- Provide specific, actionable advice

Output your response in the following JSON format:
{
  "status": "strongly_eligible" | "conditionally_eligible" | "needs_verification" | "not_eligible",
  "confidence": <number between 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "scenarios": [
    {
      "icon": "✓" | "✗" | "⚠️",
      "text": "<specific scenario description>",
      "impact": "positive" | "negative" | "neutral"
    }
  ],
  "aiSuggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>"
  ],
  "contextualInsights": "<optional: any contextual factors considered>",
  "suggestedNextSteps": ["<step 1>", "<step 2>", "<step 3>"]
}

Example scenarios:
- "✓ Age 24 - Within eligible range (18-35)" (positive)
- "⚠️ Income ₹2.05L - Slightly above ₹2L limit (2.5% over)" (neutral)
- "✗ Missing income certificate - Required document" (negative)
- "✓ Location: Rural Karnataka - Priority area for this scheme" (positive)

Example AI suggestions:
- "Apply with rent receipts to demonstrate high living costs in your urban area"
- "Get income certificate from Tehsildar office (typically takes 2-3 days)"
- "Mention your OBC category prominently in the application for preference"
- "Consider applying to similar scheme XYZ which has higher income limit"

Respond with ONLY the JSON object, no additional text.`;

  return prompt;
}

/**
 * Parse LLM response and extract structured eligibility assessment
 * 
 * @param responseText - Raw response text from LLM
 * @returns Parsed Bedrock response
 * @throws Error if response cannot be parsed
 */
export function parseLLMResponse(responseText: string): BedrockLLMResponse {
  try {
    // Remove any markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleanedText);
    
    // Validate required fields
    if (!parsed.status || typeof parsed.confidence !== 'number' || !parsed.reasoning) {
      throw new Error('Missing required fields in LLM response');
    }
    
    // Validate status value
    const validStatuses: EligibilityStatus[] = [
      'strongly_eligible',
      'conditionally_eligible',
      'needs_verification',
      'not_eligible'
    ];
    
    if (!validStatuses.includes(parsed.status)) {
      throw new Error(`Invalid status value: ${parsed.status}`);
    }
    
    // Validate confidence range
    if (parsed.confidence < 0 || parsed.confidence > 100) {
      throw new Error(`Confidence score out of range: ${parsed.confidence}`);
    }
    
    return {
      status: parsed.status,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      contextualInsights: parsed.contextualInsights,
      suggestedNextSteps: parsed.suggestedNextSteps || [],
      scenarios: parsed.scenarios || [],
      aiSuggestions: parsed.aiSuggestions || []
    };
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Invoke Amazon Bedrock to get eligibility reasoning
 * 
 * @param prompt - Formatted prompt for the LLM
 * @param options - Invocation options
 * @returns LLM response
 * @throws Error if invocation fails
 */
async function invokeBedrockModel(
  prompt: string,
  options: { timeout?: number; userId?: string } = {}
): Promise<string> {
  const timeout = options.timeout || 30000; // 30 second default timeout
  
  // Check rate limit for Bedrock calls if userId provided
  if (options.userId) {
    const rateLimit = await checkRateLimit(options.userId, 'bedrock');
    if (!rateLimit.allowed) {
      throw new Error(`Bedrock rate limit exceeded. Resets at ${rateLimit.resetAt}`);
    }
  }
  
  // Prepare the request payload for Amazon Nova
  const requestBody = {
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      max_new_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      top_p: 0.9
    }
  };
  
  const input: InvokeModelCommandInput = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody)
  };
  
  // Create command with timeout
  const command = new InvokeModelCommand(input);
  
  try {
    // Invoke with timeout
    const response = await Promise.race([
      bedrockClient.send(command),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Bedrock invocation timeout')), timeout)
      )
    ]);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Track metrics (Nova format)
    const inputTokens = responseBody.usage?.inputTokens || 0;
    const outputTokens = responseBody.usage?.outputTokens || 0;
    await trackBedrockCall(BEDROCK_MODEL_ID, inputTokens, outputTokens);
    
    // Increment rate limit counter if userId provided
    if (options.userId) {
      await incrementRateLimit(options.userId, 'bedrock');
    }
    
    // Extract text from Nova response format
    if (responseBody.output?.message?.content && Array.isArray(responseBody.output.message.content)) {
      const textContent = responseBody.output.message.content.find((c: any) => c.text);
      if (textContent) {
        return textContent.text;
      }
    }
    
    throw new Error('Invalid response format from Bedrock');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Bedrock invocation failed: ${error.message}`);
    }
    throw new Error('Bedrock invocation failed: Unknown error');
  }
}

/**
 * Evaluate eligibility using Amazon Bedrock with contextual reasoning
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rule - Eligibility rule to evaluate against
 * @param userDocuments - List of document types the user has uploaded
 * @param options - Evaluation options
 * @returns Enhanced eligibility evaluation result with LLM reasoning
 */
export async function evaluateWithBedrock(
  userId: string,
  userProfile: any,
  rule: EligibilityRule,
  userDocuments: string[] = [],
  options: BedrockEvaluationOptions = {}
): Promise<EligibilityEvaluationResult> {
  const { fallbackToRules = true, timeout } = options;
  
  try {
    // Format prompt for LLM
    const prompt = formatPromptForLLM(userProfile, rule);
    
    // Invoke Bedrock with userId for rate limiting
    const responseText = await invokeBedrockModel(prompt, { timeout, userId });
    
    // Parse response
    const llmResponse = parseLLMResponse(responseText);
    
    // Get rule-based evaluation for comparison and additional data
    const ruleBasedResult = evaluateEligibility(userId, userProfile, rule, userDocuments);
    
    // Merge LLM insights with rule-based evaluation
    const enhancedResult: EligibilityEvaluationResult = {
      ...ruleBasedResult,
      status: llmResponse.status,
      confidenceScore: llmResponse.confidence,
      reasoning: llmResponse.reasoning + 
        (llmResponse.contextualInsights ? `\n\nContextual Insights: ${llmResponse.contextualInsights}` : '') +
        (llmResponse.suggestedNextSteps && llmResponse.suggestedNextSteps.length > 0 
          ? `\n\nSuggested Next Steps:\n${llmResponse.suggestedNextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
          : '')
    };
    
    return enhancedResult;
  } catch (error) {
    console.error('Bedrock evaluation error:', error);
    
    // Fallback to rule-based evaluation if enabled
    if (fallbackToRules) {
      console.log('Falling back to rule-based evaluation');
      const ruleBasedResult = evaluateEligibility(userId, userProfile, rule, userDocuments);
      
      // Add note about fallback
      return {
        ...ruleBasedResult,
        reasoning: `${ruleBasedResult.reasoning}\n\n[Note: This evaluation used rule-based logic due to AI service unavailability]`
      };
    }
    
    // Re-throw error if fallback is disabled
    throw error;
  }
}

/**
 * Batch evaluate multiple schemes using Bedrock
 * 
 * @param userId - User identifier
 * @param userProfile - User profile data
 * @param rules - Array of eligibility rules to evaluate
 * @param userDocuments - List of document types the user has uploaded
 * @param options - Evaluation options
 * @returns Array of enhanced evaluation results
 */
export async function batchEvaluateWithBedrock(
  userId: string,
  userProfile: any,
  rules: EligibilityRule[],
  userDocuments: string[] = [],
  options: BedrockEvaluationOptions = {}
): Promise<EligibilityEvaluationResult[]> {
  // Evaluate schemes sequentially to avoid rate limiting
  // In production, consider implementing parallel execution with rate limiting
  const results: EligibilityEvaluationResult[] = [];
  
  for (const rule of rules) {
    try {
      const result = await evaluateWithBedrock(userId, userProfile, rule, userDocuments, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to evaluate scheme ${rule.schemeId}:`, error);
      
      // If fallback is enabled, the error is already handled in evaluateWithBedrock
      // If not, we skip this scheme and continue with others
      if (!options.fallbackToRules) {
        continue;
      }
    }
  }
  
  return results;
}

/**
 * Generate enhanced explanation using Bedrock
 * 
 * @param evaluationResult - Existing evaluation result
 * @param userProfile - User profile data
 * @param rule - Eligibility rule
 * @param language - Target language for explanation (default: 'en')
 * @returns Enhanced explanation text
 */
export async function generateEnhancedExplanation(
  evaluationResult: EligibilityEvaluationResult,
  userProfile: any,
  rule: EligibilityRule,
  language: string = 'en'
): Promise<string> {
  const prompt = `You are an expert at explaining government scheme eligibility in simple, empathetic language.

User Profile Summary:
- Age: ${userProfile.ageRange || 'Not provided'}
- Location: ${userProfile.location?.state || 'Not provided'}
- Education: ${userProfile.education || 'Not provided'}
- Income: ${userProfile.incomeRange || 'Not provided'}

Scheme: ${rule.schemeName}
Eligibility Status: ${evaluationResult.status}
Confidence Score: ${evaluationResult.confidenceScore}%

Matched Criteria: ${evaluationResult.matchedCriteria.length}
Unmatched Criteria: ${evaluationResult.unmatchedCriteria.length}
Missing Information: ${evaluationResult.missingCriteria.length}
Missing Documents: ${evaluationResult.missingDocuments.length}

Task:
Generate a clear, empathetic explanation (3-4 sentences) in ${language === 'en' ? 'English' : language} that:
1. Explains why the user received this eligibility status
2. Highlights the most important matched or missing criteria
3. Provides encouragement and actionable guidance
4. Uses simple language (6th grade reading level)

Respond with ONLY the explanation text, no JSON or additional formatting.`;

  try {
    const responseText = await invokeBedrockModel(prompt, { timeout: 15000 });
    return responseText.trim();
  } catch (error) {
    console.error('Failed to generate enhanced explanation:', error);
    // Return the original reasoning as fallback
    return evaluationResult.reasoning;
  }
}
