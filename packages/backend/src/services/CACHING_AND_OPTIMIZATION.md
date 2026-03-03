# Caching and Optimization Features

This document describes the caching, metrics, and rate limiting features implemented for the Eligibility MVP API.

## Overview

Task 5.2 implements four key optimization features:
1. **Response Formatting** - Structured JSON responses with suggested next steps
2. **DynamoDB Caching** - 15-minute TTL cache for evaluation results
3. **CloudWatch Metrics** - API latency, error rates, and cost tracking
4. **Rate Limiting** - Prevent cost overruns from excessive API usage

## 1. Response Formatting

### Enhanced Response Structure

The API now returns structured JSON responses with the following format:

```json
{
  "success": true,
  "data": {
    "evaluationId": "uuid",
    "userId": "user123",
    "scheme": {
      "id": "scheme456",
      "name": "PM Scholarship Scheme"
    },
    "eligibility": {
      "status": "strongly_eligible",
      "confidence": 85,
      "explanation": "You meet all mandatory criteria..."
    },
    "criteria": {
      "matched": 5,
      "unmatched": 1,
      "missing": 0,
      "details": { ... }
    },
    "documents": {
      "missing": [ ... ]
    },
    "suggested_next_steps": [
      "Proceed with application submission",
      "Upload 2 required document(s)"
    ],
    "metadata": {
      "evaluatedAt": "2024-01-15T10:30:00Z",
      "usedLLM": true,
      "evaluationMethod": "hybrid"
    }
  },
  "cached": false
}
```

### Suggested Next Steps

The system automatically generates contextual next steps based on eligibility status:

- **Strongly Eligible**: Proceed with application, upload missing documents
- **Conditionally Eligible**: Update profile, gather documents, review unmatched criteria
- **Needs Verification**: Provide additional information, upload supporting documents
- **Not Eligible**: Review other schemes, check unmatched criteria

## 2. DynamoDB Caching

### Cache Strategy

**File**: `src/services/evaluation-cache.ts`

- **TTL**: 15 minutes (configurable via `CACHE_TTL_MINUTES`)
- **Cache Key**: `CACHE#{userId}#{schemeId}#{profileHash}`
- **Profile Hash**: MD5 hash of sorted user profile JSON

### How It Works

1. **Cache Check**: Before evaluation, check if cached result exists
2. **Cache Hit**: Return cached result immediately (adds `cached: true` flag)
3. **Cache Miss**: Perform evaluation, cache result, return fresh data
4. **Cache Invalidation**: Automatic via DynamoDB TTL (15 minutes)

### Benefits

- Reduces redundant Bedrock API calls
- Improves response time for repeated queries
- Lowers operational costs
- Detects profile changes via hash comparison

### Usage

```typescript
// Check cache
const cachedResult = await getCachedEvaluationResult(userId, schemeId, userProfile);
if (cachedResult) {
  return formatHybridResponse(cachedResult);
}

// Perform evaluation
const result = await evaluateHybrid(...);

// Cache result
await cacheEvaluationResult(userId, schemeId, userProfile, result);
```

### Cache Bypass

Use `forceLLM: true` option to bypass cache:

```json
{
  "userId": "user123",
  "schemeId": "scheme456",
  "options": {
    "forceLLM": true
  }
}
```

## 3. CloudWatch Metrics

### Metrics Published

**File**: `src/services/metrics.ts`

| Metric Name | Unit | Dimensions | Description |
|-------------|------|------------|-------------|
| `APILatency` | Milliseconds | Endpoint | Request processing time |
| `APIError` | Count | Endpoint, ErrorType | Error occurrences |
| `CacheHit` | Count | Result (Hit/Miss) | Cache effectiveness |
| `BedrockAPICall` | Count | ModelId | Bedrock invocations |
| `BedrockInputTokens` | Count | ModelId | Input token usage |
| `BedrockOutputTokens` | Count | ModelId | Output token usage |

### Namespace

All metrics are published under the `EligibilityMVP` namespace.

### Usage

```typescript
// Track latency
const timer = createTimer();
// ... perform operation ...
await trackLatency('/api/v1/eligibility/evaluate', timer.stop());

// Track errors
await trackError('/api/v1/eligibility/evaluate', 'ValidationError');

// Track cache hits
await trackCacheHit(true); // or false for miss

// Track Bedrock usage
await trackBedrockCall('claude-3-sonnet', inputTokens, outputTokens);
```

### Monitoring Dashboard

Create a CloudWatch dashboard with:
- API latency percentiles (p50, p95, p99)
- Error rate by endpoint
- Cache hit ratio
- Bedrock API call frequency
- Token usage trends

### Alarms

Recommended alarms:
- API latency > 5 seconds (p95)
- Error rate > 5%
- Bedrock calls > 100/hour (cost control)

## 4. Rate Limiting

### Rate Limits

**File**: `src/services/rate-limiter.ts`

| Action | Hourly Limit | Daily Limit |
|--------|--------------|-------------|
| Evaluations | 20 | 100 |
| Bedrock Calls | 10 | 50 |

### How It Works

1. **Pre-Request Check**: Verify user hasn't exceeded limits
2. **Rate Limit Exceeded**: Return 429 status with reset time
3. **Post-Request Increment**: Update counters after successful request
4. **Automatic Reset**: Counters expire via DynamoDB TTL

### Response Format (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the evaluation_hour limit",
  "remaining": 0,
  "resetAt": "2024-01-15T11:00:00Z"
}
```

### DynamoDB Storage

Rate limit counters are stored with:
- **PK**: `USER#{userId}`
- **SK**: `RATELIMIT#{action}#{period}#{periodKey}`
- **TTL**: 2 hours (hourly) or 48 hours (daily)

### Usage

```typescript
// Check rate limit
const rateLimit = await checkRateLimit(userId, 'evaluation');
if (!rateLimit.allowed) {
  return createResponse(429, {
    error: 'Rate limit exceeded',
    remaining: rateLimit.remaining,
    resetAt: rateLimit.resetAt
  });
}

// Increment counter after successful request
await incrementRateLimit(userId, 'evaluation');
```

### Get Rate Limit Status

```typescript
const status = await getRateLimitStatus(userId);
console.log(status.evaluations.hourly.remaining); // 15
console.log(status.bedrock.daily.remaining); // 45
```

## Integration Points

### Eligibility Handler

The eligibility handler (`src/handlers/eligibility-handler.ts`) integrates all features:

1. **Rate Limiting**: Check before processing request
2. **Caching**: Check cache before evaluation
3. **Metrics**: Track latency and errors
4. **Response Formatting**: Add suggested next steps

### Bedrock Integration

The Bedrock integration (`src/services/bedrock-integration.ts`) includes:

1. **Rate Limiting**: Check Bedrock-specific limits
2. **Metrics**: Track token usage and API calls
3. **Cost Control**: Prevent excessive LLM usage

## Configuration

### Environment Variables

```bash
# DynamoDB table name
DYNAMODB_TABLE_NAME=eligibility-mvp-table

# AWS region
AWS_REGION=ap-south-1

# Cache TTL (minutes) - configured in code
CACHE_TTL_MINUTES=15
```

### Adjusting Rate Limits

Edit `src/services/rate-limiter.ts`:

```typescript
const RATE_LIMITS = {
  evaluationsPerHour: 20,    // Adjust as needed
  evaluationsPerDay: 100,
  bedrockCallsPerHour: 10,
  bedrockCallsPerDay: 50
};
```

### Adjusting Cache TTL

Edit `src/services/evaluation-cache.ts`:

```typescript
const CACHE_TTL_MINUTES = 15; // Adjust as needed
```

## Performance Impact

### Expected Improvements

- **Cache Hit Rate**: 40-60% for typical usage patterns
- **Latency Reduction**: 80-90% for cached responses (5s → 500ms)
- **Cost Reduction**: 40-60% reduction in Bedrock API calls
- **Rate Limiting**: Prevents runaway costs from abuse

### Monitoring

Track these metrics to measure effectiveness:
1. Cache hit ratio (target: >50%)
2. Average API latency (target: <2s)
3. Bedrock API calls per user (target: <10/day)
4. Rate limit rejections (target: <1%)

## Testing

### Unit Tests

- `evaluation-cache.test.ts` - Cache key generation and hashing
- `metrics.test.ts` - Timer functionality
- `rate-limiter.test.ts` - Rate limit structure

### Integration Tests

Integration tests require DynamoDB and CloudWatch access:
- Cache storage and retrieval
- Rate limit enforcement
- Metrics publishing

### Manual Testing

```bash
# Test caching
curl -X POST http://localhost:3000/api/v1/eligibility/evaluate \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","schemeId":"scheme456"}'

# Second request should return cached result
curl -X POST http://localhost:3000/api/v1/eligibility/evaluate \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","schemeId":"scheme456"}'

# Test rate limiting (make 21 requests in an hour)
for i in {1..21}; do
  curl -X POST http://localhost:3000/api/v1/eligibility/evaluate \
    -H "Content-Type: application/json" \
    -d '{"userId":"user123","schemeId":"scheme456"}'
done
```

## Troubleshooting

### Cache Not Working

1. Check DynamoDB table has TTL enabled on `ttl` attribute
2. Verify profile hash is consistent (check property ordering)
3. Check CloudWatch logs for cache errors

### Metrics Not Appearing

1. Verify IAM role has `cloudwatch:PutMetricData` permission
2. Check CloudWatch namespace is `EligibilityMVP`
3. Wait 1-2 minutes for metrics to appear

### Rate Limiting Too Strict

1. Adjust limits in `rate-limiter.ts`
2. Check DynamoDB for stuck counters
3. Verify TTL is working correctly

## Future Enhancements

1. **Distributed Caching**: Use ElastiCache for multi-region deployments
2. **Adaptive Rate Limiting**: Adjust limits based on user tier
3. **Predictive Caching**: Pre-cache popular schemes
4. **Cost Budgets**: Per-user spending limits
5. **Cache Warming**: Pre-populate cache during off-peak hours

## Requirements Satisfied

- **FR-2.3**: Structured JSON response format
- **FR-3.1**: LLM integration with cost controls
- **NFR-5**: Performance optimization via caching
- **Cost Control**: Rate limiting and metrics tracking
