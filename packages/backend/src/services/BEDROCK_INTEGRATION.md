# Bedrock Integration Module

## Overview

The Bedrock Integration Module provides AI-powered eligibility reasoning using Amazon Bedrock with Claude 3 Sonnet. It enhances the deterministic rule-based evaluation engine with contextual understanding, handling ambiguous cases and providing human-readable explanations.

## Features

- **AI-Powered Reasoning**: Uses Claude 3 Sonnet for contextual eligibility evaluation
- **Structured Prompts**: Carefully crafted prompts for consistent, accurate responses
- **Response Parsing**: Robust parsing of LLM responses with validation
- **Error Handling**: Automatic fallback to rule-based evaluation on errors
- **Batch Processing**: Evaluate multiple schemes efficiently
- **Enhanced Explanations**: Generate user-friendly explanations in simple language
- **Timeout Protection**: Configurable timeouts to prevent hanging requests

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Eligibility Handler                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Bedrock Integration Module                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Format Prompt (User Profile + Scheme Criteria) │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  2. Invoke Bedrock (Claude 3 Sonnet)              │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  3. Parse Response (Extract Structured Data)       │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  4. Merge with Rule-Based Evaluation               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Error Occurred?  │
                    └──────────────────┘
                         │         │
                      Yes│         │No
                         ▼         ▼
              ┌──────────────┐  ┌──────────────┐
              │   Fallback   │  │   Return     │
              │   to Rules   │  │   Enhanced   │
              │              │  │   Result     │
              └──────────────┘  └──────────────┘
```

## Usage

### Basic Evaluation

```typescript
import { evaluateWithBedrock } from './services/bedrock-integration';

const result = await evaluateWithBedrock(
  userId,
  userProfile,
  eligibilityRule,
  userDocuments,
  {
    fallbackToRules: true,  // Enable automatic fallback
    timeout: 30000          // 30 second timeout
  }
);

console.log('Status:', result.status);
console.log('Confidence:', result.confidenceScore);
console.log('Reasoning:', result.reasoning);
```

### Batch Evaluation

```typescript
import { batchEvaluateWithBedrock } from './services/bedrock-integration';

const results = await batchEvaluateWithBedrock(
  userId,
  userProfile,
  [scheme1, scheme2, scheme3],
  userDocuments,
  { fallbackToRules: true }
);

// Sort by confidence
const sorted = results.sort((a, b) => b.confidenceScore - a.confidenceScore);
console.log('Top match:', sorted[0].schemeName);
```

### Enhanced Explanations

```typescript
import { generateEnhancedExplanation } from './services/bedrock-integration';

const explanation = await generateEnhancedExplanation(
  evaluationResult,
  userProfile,
  eligibilityRule,
  'en' // Language code
);

console.log(explanation);
```

## API Reference

### `evaluateWithBedrock()`

Evaluate user eligibility using Amazon Bedrock with contextual reasoning.

**Parameters:**
- `userId` (string): User identifier
- `userProfile` (object): User profile data
- `rule` (EligibilityRule): Eligibility rule to evaluate against
- `userDocuments` (string[]): List of document types user has uploaded
- `options` (BedrockEvaluationOptions): Evaluation options
  - `fallbackToRules` (boolean): Enable fallback to rule-based evaluation (default: true)
  - `timeout` (number): Timeout in milliseconds (default: 30000)
  - `useCache` (boolean): Use cached results if available (default: false)

**Returns:** `Promise<EligibilityEvaluationResult>`

**Example:**
```typescript
const result = await evaluateWithBedrock(
  'user-123',
  { ageRange: '18-25', location: { state: 'Karnataka' } },
  pmScholarshipRule,
  ['aadhaar', 'education'],
  { fallbackToRules: true, timeout: 30000 }
);
```

### `batchEvaluateWithBedrock()`

Evaluate multiple schemes for a user using Bedrock.

**Parameters:**
- `userId` (string): User identifier
- `userProfile` (object): User profile data
- `rules` (EligibilityRule[]): Array of eligibility rules
- `userDocuments` (string[]): List of document types
- `options` (BedrockEvaluationOptions): Evaluation options

**Returns:** `Promise<EligibilityEvaluationResult[]>`

**Example:**
```typescript
const results = await batchEvaluateWithBedrock(
  'user-456',
  userProfile,
  [scheme1, scheme2, scheme3],
  ['aadhaar'],
  { fallbackToRules: true }
);
```

### `generateEnhancedExplanation()`

Generate a user-friendly explanation for an eligibility result.

**Parameters:**
- `evaluationResult` (EligibilityEvaluationResult): Existing evaluation result
- `userProfile` (object): User profile data
- `rule` (EligibilityRule): Eligibility rule
- `language` (string): Target language code (default: 'en')

**Returns:** `Promise<string>`

**Example:**
```typescript
const explanation = await generateEnhancedExplanation(
  result,
  userProfile,
  rule,
  'hi' // Hindi
);
```

### `formatPromptForLLM()`

Format user profile and scheme criteria into a structured prompt for the LLM.

**Parameters:**
- `userProfile` (object): User profile data
- `rule` (EligibilityRule): Eligibility rule with criteria

**Returns:** `string` - Formatted prompt

**Example:**
```typescript
const prompt = formatPromptForLLM(userProfile, eligibilityRule);
console.log(prompt);
```

### `parseLLMResponse()`

Parse LLM response and extract structured eligibility assessment.

**Parameters:**
- `responseText` (string): Raw response text from LLM

**Returns:** `BedrockLLMResponse`

**Throws:** Error if response cannot be parsed or is invalid

**Example:**
```typescript
const parsed = parseLLMResponse(llmResponseText);
console.log('Status:', parsed.status);
console.log('Confidence:', parsed.confidence);
```

## Configuration

### Environment Variables

```bash
# AWS Region for Bedrock (default: ap-south-1)
AWS_REGION=ap-south-1

# AWS Credentials (use IAM role in production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Model Configuration

The module uses Claude 3 Sonnet by default. You can modify the model in `bedrock-integration.ts`:

```typescript
const BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.3; // Lower for more deterministic responses
```

## Prompt Engineering

### Prompt Structure

The prompt includes:
1. **System Context**: Role definition and task description
2. **User Profile**: Formatted user data
3. **Scheme Information**: Scheme name, description, category
4. **Eligibility Criteria**: Detailed criteria with operators and values
5. **Required Documents**: List of mandatory and optional documents
6. **Task Instructions**: Clear evaluation guidelines
7. **Output Format**: JSON schema for structured response

### Prompt Guidelines

- **Be Specific**: Clearly define the evaluation task
- **Provide Context**: Include all relevant user and scheme information
- **Set Expectations**: Specify output format and required fields
- **Handle Ambiguity**: Instruct the model on how to handle uncertain cases
- **Use Examples**: Few-shot examples can improve consistency (future enhancement)

## Error Handling

### Automatic Fallback

When Bedrock is unavailable or returns an error, the module automatically falls back to rule-based evaluation:

```typescript
try {
  // Try Bedrock evaluation
  const llmResult = await invokeBedrockModel(prompt);
  return enhancedResult;
} catch (error) {
  if (fallbackToRules) {
    // Fallback to rule-based evaluation
    return ruleBasedEvaluation;
  }
  throw error;
}
```

### Error Types

- **Timeout**: Request exceeds configured timeout
- **Invalid Response**: LLM returns unparseable or invalid JSON
- **Service Unavailable**: Bedrock service is down or unreachable
- **Rate Limiting**: Too many requests (implement exponential backoff)

### Best Practices

1. **Always Enable Fallback**: Set `fallbackToRules: true` in production
2. **Set Reasonable Timeouts**: 30 seconds is recommended
3. **Log Errors**: Monitor Bedrock failures for debugging
4. **Implement Retry Logic**: Use exponential backoff for transient errors
5. **Cache Results**: Cache identical evaluations to reduce costs

## Cost Optimization

### Strategies

1. **Caching**: Cache LLM responses for identical inputs
   ```typescript
   // Implement caching layer (Redis/ElastiCache)
   const cacheKey = `bedrock:${userId}:${schemeId}:${hash(userProfile)}`;
   const cached = await cache.get(cacheKey);
   if (cached) return cached;
   ```

2. **Selective Usage**: Only use Bedrock for ambiguous cases
   ```typescript
   // Use rule-based evaluation first
   const ruleResult = evaluateEligibility(userId, userProfile, rule);
   
   // Only use Bedrock if confidence is low or criteria are ambiguous
   if (ruleResult.confidenceScore < 70 || hasAmbiguousCriteria(rule)) {
     return await evaluateWithBedrock(userId, userProfile, rule);
   }
   return ruleResult;
   ```

3. **Batch Processing**: Evaluate multiple schemes in parallel (with rate limiting)

4. **Prompt Optimization**: Keep prompts concise to reduce token usage

5. **Model Selection**: Use smaller models for simple evaluations

### Cost Estimates

**Claude 3 Sonnet Pricing (as of 2024):**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical Evaluation:**
- Input tokens: ~800 tokens (prompt)
- Output tokens: ~200 tokens (response)
- Cost per evaluation: ~$0.004

**Monthly Cost (10,000 evaluations):**
- Total: ~$40/month

**With 50% caching:**
- Total: ~$20/month

## Testing

### Unit Tests

Run unit tests for prompt formatting and response parsing:

```bash
npm test -- bedrock-integration.test.ts
```

### Integration Tests

Test actual Bedrock invocations (requires AWS credentials):

```bash
# Set AWS credentials
export AWS_REGION=ap-south-1
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Run integration tests
npm test -- bedrock-integration.integration.test.ts
```

### Manual Testing

Use the example file for manual testing:

```typescript
import { examples } from './examples/bedrock-integration-example';

// Test single evaluation
await examples.singleEvaluation();

// Test batch evaluation
await examples.batchEvaluation();

// Test ambiguous case handling
await examples.ambiguousCase();
```

## Monitoring

### Key Metrics

1. **Invocation Count**: Number of Bedrock API calls
2. **Success Rate**: Percentage of successful evaluations
3. **Fallback Rate**: Percentage of evaluations that fell back to rules
4. **Latency**: Average response time (p50, p95, p99)
5. **Cost**: Total Bedrock API costs

### CloudWatch Metrics

```typescript
// Log custom metrics to CloudWatch
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'ap-south-1' });

await cloudwatch.putMetricData({
  Namespace: 'EligibilityMVP/Bedrock',
  MetricData: [
    {
      MetricName: 'InvocationCount',
      Value: 1,
      Unit: 'Count'
    },
    {
      MetricName: 'Latency',
      Value: responseTime,
      Unit: 'Milliseconds'
    }
  ]
});
```

## Troubleshooting

### Common Issues

**Issue: "Bedrock invocation timeout"**
- **Cause**: Request took longer than configured timeout
- **Solution**: Increase timeout or check network connectivity

**Issue: "Failed to parse LLM response"**
- **Cause**: LLM returned invalid JSON or unexpected format
- **Solution**: Check prompt formatting, validate response structure

**Issue: "Invalid status value"**
- **Cause**: LLM returned a status not in the allowed list
- **Solution**: Update prompt to be more explicit about allowed values

**Issue: "Confidence score out of range"**
- **Cause**: LLM returned confidence < 0 or > 100
- **Solution**: Add validation instructions to prompt

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.DEBUG = 'bedrock:*';

// Or add console.log statements
console.log('Prompt:', prompt);
console.log('Response:', responseText);
console.log('Parsed:', parsed);
```

## Security Considerations

1. **IAM Permissions**: Use least-privilege IAM roles
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel"
         ],
         "Resource": "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-*"
       }
     ]
   }
   ```

2. **Data Privacy**: Never log sensitive user data
3. **Input Validation**: Validate user profile data before sending to Bedrock
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Encryption**: Use TLS for all Bedrock communications (handled by SDK)

## Future Enhancements

1. **Caching Layer**: Implement Redis/ElastiCache for response caching
2. **Prompt Versioning**: Track and version prompts for A/B testing
3. **Few-Shot Learning**: Add examples to prompts for better consistency
4. **Multi-Model Support**: Support multiple LLM models (GPT-4, Llama, etc.)
5. **Streaming Responses**: Use streaming for real-time feedback
6. **Fine-Tuning**: Fine-tune models on domain-specific data
7. **Multilingual Prompts**: Generate prompts in user's preferred language
8. **Confidence Calibration**: Calibrate confidence scores based on historical accuracy

## References

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3 Model Card](https://www.anthropic.com/claude)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

## Support

For issues or questions:
- Check the [examples](./examples/bedrock-integration-example.ts)
- Review the [tests](./bedrock-integration.test.ts)
- Contact the development team

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Eligibility MVP Team
