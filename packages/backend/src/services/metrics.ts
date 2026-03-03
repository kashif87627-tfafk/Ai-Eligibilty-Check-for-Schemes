/**
 * CloudWatch Metrics Service
 * 
 * Publishes custom metrics for API latency, error rates, and cost tracking.
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const client = new CloudWatchClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const NAMESPACE = 'EligibilityMVP';

export interface MetricData {
  metricName: string;
  value: number;
  unit: 'Milliseconds' | 'Count' | 'None';
  dimensions?: Record<string, string>;
}

/**
 * Publish a metric to CloudWatch
 */
export async function publishMetric(data: MetricData): Promise<void> {
  const dimensions = data.dimensions 
    ? Object.entries(data.dimensions).map(([Name, Value]) => ({ Name, Value }))
    : [];

  try {
    await client.send(new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [{
        MetricName: data.metricName,
        Value: data.value,
        Unit: data.unit,
        Timestamp: new Date(),
        Dimensions: dimensions
      }]
    }));
  } catch (error) {
    // Don't fail the request if metrics fail
    console.error('Failed to publish metric:', error);
  }
}

/**
 * Track API latency
 */
export async function trackLatency(
  endpoint: string,
  durationMs: number
): Promise<void> {
  await publishMetric({
    metricName: 'APILatency',
    value: durationMs,
    unit: 'Milliseconds',
    dimensions: {
      Endpoint: endpoint
    }
  });
}

/**
 * Track API errors
 */
export async function trackError(
  endpoint: string,
  errorType: string
): Promise<void> {
  await publishMetric({
    metricName: 'APIError',
    value: 1,
    unit: 'Count',
    dimensions: {
      Endpoint: endpoint,
      ErrorType: errorType
    }
  });
}

/**
 * Track cache hits/misses
 */
export async function trackCacheHit(hit: boolean): Promise<void> {
  await publishMetric({
    metricName: 'CacheHit',
    value: 1,
    unit: 'Count',
    dimensions: {
      Result: hit ? 'Hit' : 'Miss'
    }
  });
}

/**
 * Track Bedrock API calls (for cost monitoring)
 */
export async function trackBedrockCall(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await Promise.all([
    publishMetric({
      metricName: 'BedrockInputTokens',
      value: inputTokens,
      unit: 'Count',
      dimensions: { ModelId: modelId }
    }),
    publishMetric({
      metricName: 'BedrockOutputTokens',
      value: outputTokens,
      unit: 'Count',
      dimensions: { ModelId: modelId }
    }),
    publishMetric({
      metricName: 'BedrockAPICall',
      value: 1,
      unit: 'Count',
      dimensions: { ModelId: modelId }
    })
  ]);
}

/**
 * Utility to measure execution time
 */
export function createTimer() {
  const start = Date.now();
  return {
    stop: () => Date.now() - start
  };
}
