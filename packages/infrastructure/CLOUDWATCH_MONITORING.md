# CloudWatch Monitoring and Alarms

This document describes the CloudWatch monitoring setup for the Eligibility MVP platform, including dashboards, alarms, and cost control measures.

## Overview

The monitoring infrastructure provides comprehensive visibility into:
- API Gateway performance and errors
- Lambda function execution metrics
- Bedrock API usage and costs
- Cache performance
- Custom application metrics

## CloudWatch Dashboard

### Dashboard Name
`Eligibility-MVP-Dashboard`

### Dashboard Widgets

The dashboard is organized into 6 rows of widgets:

#### Row 1: API Gateway Overview
- **Request Count**: Total API requests over time
- **Latency**: Average API response time

#### Row 2: API Gateway Errors
- **4xx Errors**: Client errors (bad requests, unauthorized, etc.)
- **5xx Errors**: Server errors (internal errors, timeouts, etc.)
- **Error Rate %**: Calculated percentage of 5xx errors vs total requests

#### Row 3: Lambda Performance
- **Invocations**: Number of Lambda function invocations
- **Duration**: Average execution time
- **Errors & Throttles**: Function errors and throttling events

#### Row 4: Custom Metrics
- **Custom API Latency by Endpoint**: Latency broken down by API endpoint
- **Custom API Errors by Type**: Errors categorized by error type

#### Row 5: Bedrock Usage and Costs
- **Bedrock API Calls**: Number of calls to Amazon Bedrock
- **Bedrock Input Tokens**: Total input tokens consumed
- **Bedrock Output Tokens**: Total output tokens generated

#### Row 6: Cache Performance
- **Cache Hit vs Miss**: Comparison of cache hits and misses
- **Cache Hit Rate %**: Calculated percentage of cache hits

## CloudWatch Alarms

All alarms send notifications to the SNS topic: `eligibility-mvp-alarms`

### 1. High Error Rate Alarm
- **Name**: `Eligibility-MVP-High-Error-Rate`
- **Threshold**: >5% error rate
- **Evaluation**: 2 periods of 5 minutes
- **Purpose**: Detect when API error rate exceeds acceptable threshold
- **Action**: Alert operations team to investigate

### 2. High Latency Alarm
- **Name**: `Eligibility-MVP-High-Latency`
- **Threshold**: >5 seconds
- **Evaluation**: 2 periods of 5 minutes
- **Purpose**: Detect slow API responses
- **Action**: Investigate performance bottlenecks

### 3. Lambda Error Alarm
- **Name**: `Eligibility-MVP-Lambda-Errors`
- **Threshold**: >5 errors
- **Evaluation**: 1 period of 5 minutes
- **Purpose**: Detect Lambda function failures
- **Action**: Review Lambda logs and fix code issues

### 4. Lambda Throttle Alarm
- **Name**: `Eligibility-MVP-Lambda-Throttles`
- **Threshold**: >1 throttle
- **Evaluation**: 1 period of 5 minutes
- **Purpose**: Detect when Lambda hits concurrency limits
- **Action**: Increase reserved concurrency or optimize function

### 5. High Bedrock Calls Alarm (Cost Control)
- **Name**: `Eligibility-MVP-High-Bedrock-Calls`
- **Threshold**: >100 calls per 5 minutes
- **Evaluation**: 1 period of 5 minutes
- **Purpose**: Prevent unexpected Bedrock API costs
- **Action**: Review usage patterns and implement additional caching

### 6. High Bedrock Tokens Alarm (Cost Control)
- **Name**: `Eligibility-MVP-High-Bedrock-Tokens`
- **Threshold**: >50,000 tokens per 5 minutes
- **Evaluation**: 1 period of 5 minutes
- **Purpose**: Prevent excessive token consumption costs
- **Action**: Optimize prompts and implement token limits

### 7. Low Cache Hit Rate Alarm
- **Name**: `Eligibility-MVP-Low-Cache-Hit-Rate`
- **Threshold**: <50% hit rate
- **Evaluation**: 2 periods of 15 minutes
- **Purpose**: Detect ineffective caching
- **Action**: Review cache TTL settings and cache key strategy

## Custom Metrics

The application publishes custom metrics to the `EligibilityMVP` namespace:

### API Metrics
- **APILatency**: Response time by endpoint (Milliseconds)
- **APIError**: Error count by endpoint and error type (Count)

### Bedrock Metrics
- **BedrockAPICall**: Number of Bedrock API calls (Count)
- **BedrockInputTokens**: Input tokens consumed (Count)
- **BedrockOutputTokens**: Output tokens generated (Count)

### Cache Metrics
- **CacheHit**: Cache hits and misses (Count)
  - Dimension: `Result` (Hit/Miss)

## SNS Topic Configuration

### Topic Details
- **Name**: `eligibility-mvp-alarms`
- **Display Name**: Eligibility MVP Alarms
- **ARN**: Exported as `EligibilityMvpAlarmTopicArn`

### Subscribing to Alarms

To receive alarm notifications, subscribe to the SNS topic:

```bash
# Get the topic ARN from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name EligibilityMvpStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AlarmTopicArn`].OutputValue' \
  --output text

# Subscribe an email address
aws sns subscribe \
  --topic-arn <TOPIC_ARN> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cost Optimization

### Bedrock Cost Monitoring

The monitoring setup includes specific alarms for Bedrock usage to prevent cost overruns:

1. **API Call Frequency**: Alerts when calls exceed 100 per 5 minutes
2. **Token Usage**: Alerts when total tokens exceed 50,000 per 5 minutes

### Estimated Costs

Based on Claude 3 Sonnet pricing (as of 2024):
- Input tokens: $0.003 per 1K tokens
- Output tokens: $0.015 per 1K tokens

Example cost calculation:
- 100 calls/5min = 1,200 calls/hour = 28,800 calls/day
- Average 1,000 input + 500 output tokens per call
- Daily cost: 28,800 × (1.0 × $0.003 + 0.5 × $0.015) = $302.40/day

**Recommendation**: Adjust alarm thresholds based on your budget and expected usage.

## Viewing Metrics

### AWS Console
1. Navigate to CloudWatch in the AWS Console
2. Select "Dashboards" from the left menu
3. Open "Eligibility-MVP-Dashboard"

### AWS CLI

```bash
# Get dashboard definition
aws cloudwatch get-dashboard \
  --dashboard-name Eligibility-MVP-Dashboard

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace EligibilityMVP \
  --metric-name BedrockAPICall \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Alarm Actions

When an alarm triggers:

1. **Immediate**: SNS notification sent to subscribers
2. **Investigation**: Check CloudWatch Logs for detailed error messages
3. **Resolution**: Apply fixes based on alarm type
4. **Monitoring**: Verify alarm returns to OK state

## Best Practices

1. **Regular Review**: Check dashboard daily during initial deployment
2. **Threshold Tuning**: Adjust alarm thresholds based on actual usage patterns
3. **Cost Monitoring**: Review Bedrock usage weekly to optimize costs
4. **Cache Optimization**: Maintain >70% cache hit rate for cost efficiency
5. **Alert Fatigue**: Fine-tune thresholds to avoid false positives

## Troubleshooting

### High Error Rate
- Check Lambda logs for error details
- Review recent code deployments
- Verify DynamoDB and S3 permissions

### High Latency
- Check Lambda memory allocation
- Review Bedrock API response times
- Optimize database queries

### High Bedrock Costs
- Implement more aggressive caching
- Reduce prompt sizes
- Use rule-based evaluation for simple cases

### Low Cache Hit Rate
- Increase cache TTL (currently 15 minutes)
- Review cache key generation logic
- Analyze request patterns for optimization opportunities

## Related Documentation

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Metrics Service Implementation](../backend/src/services/metrics.ts)
- [Infrastructure Stack](./lib/eligibility-mvp-stack.ts)
