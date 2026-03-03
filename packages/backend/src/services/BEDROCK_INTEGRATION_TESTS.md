# Bedrock Integration Tests

This document explains how to run and configure the Bedrock integration tests.

## Overview

The Bedrock integration tests verify:

1. **Prompt Formatting**: Tests that user profiles are correctly formatted into LLM prompts
2. **LLM Response Parsing**: Tests that Bedrock responses are correctly parsed and validated
3. **Fallback Behavior**: Tests that the system gracefully falls back to rule-based evaluation when Bedrock is unavailable
4. **Cost Optimization**: Tests batch processing, minimal API calls, and timeout controls

## Test Files

- `bedrock-integration.test.ts` - Unit tests for prompt formatting and response parsing (no API calls)
- `bedrock-integration.integration.test.ts` - Integration tests that make actual Bedrock API calls

## Prerequisites

### AWS Credentials

Integration tests require valid AWS credentials with permissions to invoke Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  ]
}
```

### Environment Setup

Set up AWS credentials using one of these methods:

1. **AWS CLI Configuration** (Recommended for local development):
   ```bash
   aws configure
   ```

2. **Environment Variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=ap-south-1
   ```

3. **IAM Role** (For EC2/Lambda):
   Attach an IAM role with Bedrock permissions

## Running Tests

### Run All Tests (Unit + Integration)

```bash
cd packages/backend
npm test
```

### Run Only Unit Tests (No API Calls)

```bash
npm test -- bedrock-integration.test.ts
```

### Run Only Integration Tests

```bash
npm test -- bedrock-integration.integration.test.ts
```

### Skip Integration Tests

Set the `SKIP_INTEGRATION_TESTS` environment variable to skip integration tests:

```bash
SKIP_INTEGRATION_TESTS=true npm test
```

This is useful for:
- CI/CD pipelines without AWS credentials
- Local development when you want faster test runs
- Environments where Bedrock is not available

## Cost Considerations

### API Call Costs

Integration tests make real API calls to Amazon Bedrock. Estimated costs:

- **Claude 3 Sonnet**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Average test**: ~500 input tokens + 200 output tokens = ~$0.005 per test
- **Full integration test suite**: ~20 tests = ~$0.10 per run

### Cost Optimization Features Tested

1. **Sequential Processing**: Batch tests verify that multiple evaluations are processed sequentially to avoid rate limiting
2. **Timeout Controls**: Tests verify that timeout settings prevent runaway costs
3. **Fallback Mechanism**: Tests verify that rule-based fallback reduces API calls when Bedrock is unavailable
4. **Minimal API Calls**: Tests verify that each evaluation makes only one API call

### Reducing Test Costs

1. **Skip Integration Tests Locally**: Use `SKIP_INTEGRATION_TESTS=true` for rapid development
2. **Run Integration Tests in CI Only**: Configure CI/CD to run integration tests only on main branch
3. **Use Mocks for Development**: Unit tests use mocks and don't make API calls
4. **Batch Test Runs**: Run integration tests less frequently (e.g., before releases)

## Test Scenarios

### 1. Prompt Formatting Tests

Tests that verify user profiles are correctly formatted:

- Strongly eligible user (all criteria met)
- Partially eligible user (some criteria missing)
- Incomplete profile (missing information)
- Rural vs urban user profiles

### 2. Fallback Behavior Tests

Tests that verify graceful degradation:

- Fallback to rule-based evaluation when Bedrock fails
- Error throwing when fallback is disabled
- Timeout handling with fallback

### 3. Cost Optimization Tests

Tests that verify cost-efficient operation:

- Batch processing of multiple schemes
- Handling partial failures in batch evaluation
- Single API call per evaluation
- Timeout enforcement

### 4. Enhanced Explanation Tests

Tests that verify explanation generation:

- Enhanced explanation generation
- Fallback to original reasoning on failure

### 5. Response Parsing Tests

Tests that verify robust parsing:

- Markdown-formatted responses
- Responses with optional fields missing

## Troubleshooting

### Test Timeouts

If tests timeout, increase the timeout values:

```typescript
it('should evaluate eligibility', async () => {
  // ...
}, 60000); // 60 second timeout
```

### AWS Credentials Not Found

Error: `CredentialsProviderError: Could not load credentials`

**Solution**: Configure AWS credentials using `aws configure` or environment variables

### Region Not Supported

Error: `Bedrock is not available in region`

**Solution**: Set `AWS_REGION=ap-south-1` (Mumbai) or another supported region

### Rate Limiting

Error: `ThrottlingException: Rate exceeded`

**Solution**: 
- Reduce concurrent tests
- Add delays between batch evaluations
- Use exponential backoff

### Model Not Found

Error: `ResourceNotFoundException: Model not found`

**Solution**: 
- Verify model ID: `anthropic.claude-3-sonnet-20240229-v1:0`
- Check if Bedrock model access is enabled in AWS Console

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd packages/backend
          npm install
      
      - name: Run unit tests
        run: |
          cd packages/backend
          npm test -- bedrock-integration.test.ts
      
      - name: Run integration tests
        if: github.ref == 'refs/heads/main'
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-south-1
        run: |
          cd packages/backend
          npm test -- bedrock-integration.integration.test.ts
```

### Skip Integration Tests in CI

```yaml
- name: Run tests (skip integration)
  env:
    SKIP_INTEGRATION_TESTS: true
  run: |
    cd packages/backend
    npm test
```

## Best Practices

1. **Run Unit Tests Frequently**: Unit tests are fast and free
2. **Run Integration Tests Before Commits**: Verify Bedrock integration works
3. **Skip Integration Tests in CI for PRs**: Save costs by running only on main branch
4. **Monitor API Costs**: Use AWS Cost Explorer to track Bedrock usage
5. **Use Timeouts**: Always set reasonable timeouts to prevent runaway costs
6. **Enable Fallback**: Always enable fallback to rule-based evaluation in production

## Additional Resources

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3 Model Documentation](https://docs.anthropic.com/claude/docs)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Jest Testing Framework](https://jestjs.io/)
