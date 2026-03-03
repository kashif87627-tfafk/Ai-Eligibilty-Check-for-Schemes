# API Integration Tests

This document describes the API integration tests for the eligibility evaluation endpoints.

## Overview

The integration tests in `eligibility-handler.integration.test.ts` verify the complete API flow including:

- **Request Validation**: Ensures proper validation of request parameters
- **Evaluation Logic**: Tests the hybrid evaluation flow (rule-based + LLM)
- **Caching Behavior**: Verifies cache hits/misses and TTL behavior
- **Error Responses**: Tests error handling for invalid input and missing data
- **Authorization**: Validates Cognito authorization enforcement
- **Rate Limiting**: Ensures rate limits are properly tracked
- **Metrics**: Verifies CloudWatch metrics are published

## Requirements: FR-2.1, FR-2.3

These tests validate:
- **FR-2.1**: Eligibility evaluation API endpoints
- **FR-2.3**: Structured JSON responses with confidence scores

## Test Coverage

### Complete Evaluation Flow
- ✅ Successful evaluation with valid input
- ✅ Structured response with all required fields
- ✅ Handling missing documents
- ✅ LLM usage for ambiguous cases

### Caching Behavior
- ✅ Cache hit on subsequent identical requests
- ✅ Cache bypass with forceLLM option
- ✅ Cache invalidation after profile updates

### Error Responses - Invalid Input
- ✅ Missing userId (400)
- ✅ Missing schemeId (400)
- ✅ Invalid userDocuments type (400)
- ✅ Invalid options type (400)
- ✅ Malformed JSON (500)

### Error Responses - Missing Data
- ✅ Non-existent user profile (404)
- ✅ Non-existent scheme (404)

### Authorization Enforcement
- ✅ Valid Cognito user context
- ✅ User ID mismatch warning
- ✅ Forbidden access to other user's data (403)

### Rate Limiting
- ✅ Rate limit tracking
- ✅ Rate limit exceeded response (429)

### Additional Endpoints
- ✅ GET /api/v1/eligibility/user/:userId - Retrieve evaluation history
- ✅ POST /api/v1/eligibility/re-evaluate - Re-evaluation flow
- ✅ POST /api/v1/eligibility/evaluate-all - Batch evaluation

### Edge Cases
- ✅ Empty request body
- ✅ Null body
- ✅ Very long document lists
- ✅ CORS headers
- ✅ Metrics tracking

## Running the Tests

### Prerequisites

1. **AWS Credentials**: Configure AWS credentials with access to:
   - DynamoDB (for test data)
   - Bedrock (for LLM tests)
   - CloudWatch (for metrics)

2. **Environment Variables**:
   ```bash
   export AWS_REGION=ap-south-1
   export TABLE_NAME=eligibility-mvp-table
   ```

3. **DynamoDB Table**: Ensure the DynamoDB table exists with the correct schema

### Run All Integration Tests

```bash
cd packages/backend
npm test -- eligibility-handler.integration.test.ts
```

### Run Specific Test Suite

```bash
npm test -- eligibility-handler.integration.test.ts -t "Complete Evaluation Flow"
```

### Skip Integration Tests (CI/CD)

Set the environment variable to skip tests that require AWS resources:

```bash
export SKIP_INTEGRATION_TESTS=true
npm test
```

### Run with Verbose Output

```bash
npm test -- eligibility-handler.integration.test.ts --verbose
```

## Test Data

The tests create and clean up the following test data:

- **Test User**: `test-user-integration-001`
  - Profile with complete demographic information
  - Located in Karnataka, Bangalore Urban
  - Student with graduate education
  - Income below 50k

- **Test Scheme**: `scheme-001` (PM Scholarship Scheme)
  - Education category
  - Age and education criteria
  - Requires Aadhaar document

Test data is created in `beforeAll()` and cleaned up in `afterAll()`.

## Performance Considerations

- Tests with `skipLLM: true` complete in ~5-10 seconds
- Tests with LLM calls may take 30-45 seconds
- Batch evaluation tests may take up to 90 seconds
- Total test suite runtime: ~5-10 minutes (with LLM calls)

## Cost Considerations

Running these integration tests will incur AWS costs:

- **DynamoDB**: Minimal (read/write operations)
- **Bedrock**: ~$0.01-0.05 per test run (depending on LLM usage)
- **CloudWatch**: Minimal (metrics and logs)

**Estimated cost per test run**: $0.05-0.10

To minimize costs:
- Use `skipLLM: true` option in tests when possible
- Run integration tests selectively (not on every commit)
- Set `SKIP_INTEGRATION_TESTS=true` in CI/CD pipelines

## Troubleshooting

### Tests Fail with "User profile not found"

Ensure the test user profile is created in `beforeAll()`. Check DynamoDB table permissions.

### Tests Fail with "Scheme not found"

Ensure the test eligibility rule is created in `beforeAll()`. Verify the table schema.

### Tests Timeout

Increase the test timeout:
```bash
npm test -- eligibility-handler.integration.test.ts --testTimeout=180000
```

### Bedrock API Errors

- Verify AWS credentials have Bedrock permissions
- Check the region supports Bedrock (ap-south-1)
- Ensure Claude 3 Sonnet model is available

### Rate Limit Errors

If tests fail due to rate limiting, wait for the rate limit window to reset (1 hour) or increase rate limits in the configuration.

## Continuous Integration

For CI/CD pipelines, consider:

1. **Skip by Default**: Set `SKIP_INTEGRATION_TESTS=true` for regular builds
2. **Scheduled Runs**: Run integration tests on a schedule (e.g., nightly)
3. **Manual Triggers**: Allow manual triggering for pre-release validation
4. **Separate Environment**: Use a dedicated test environment with isolated resources

## Future Enhancements

- [ ] Add load testing for rate limit validation
- [ ] Test concurrent request handling
- [ ] Add performance benchmarks
- [ ] Test cache invalidation edge cases
- [ ] Add tests for metrics accuracy
- [ ] Test error recovery scenarios
- [ ] Add tests for partial DynamoDB failures
