/**
 * Rate Limiter Service
 * 
 * Implements rate limiting using DynamoDB to prevent cost overruns.
 * Tracks API calls per user and enforces limits.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'eligibility-mvp-table';

// Rate limit configuration
const RATE_LIMITS = {
  evaluationsPerHour: 20,
  evaluationsPerDay: 100,
  bedrockCallsPerHour: 10,
  bedrockCallsPerDay: 50
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limitType?: string;
}

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(
  userId: string,
  action: 'evaluation' | 'bedrock'
): Promise<RateLimitResult> {
  const now = new Date();
  const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const dayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

  // Check hourly limit
  const hourlyResult = await checkLimit(userId, action, 'hour', hourKey);
  if (!hourlyResult.allowed) {
    return hourlyResult;
  }

  // Check daily limit
  const dailyResult = await checkLimit(userId, action, 'day', dayKey);
  return dailyResult;
}

/**
 * Check a specific rate limit
 */
async function checkLimit(
  userId: string,
  action: 'evaluation' | 'bedrock',
  period: 'hour' | 'day',
  periodKey: string
): Promise<RateLimitResult> {
  const sk = `RATELIMIT#${action}#${period}#${periodKey}`;
  
  const response = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: sk
    }
  }));

  const limit = period === 'hour' 
    ? (action === 'evaluation' ? RATE_LIMITS.evaluationsPerHour : RATE_LIMITS.bedrockCallsPerHour)
    : (action === 'evaluation' ? RATE_LIMITS.evaluationsPerDay : RATE_LIMITS.bedrockCallsPerDay);

  const currentCount = response.Item?.count || 0;
  const allowed = currentCount < limit;

  // Calculate reset time
  const resetAt = period === 'hour'
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    allowed,
    remaining: Math.max(0, limit - currentCount),
    resetAt,
    limitType: `${action}_${period}`
  };
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(
  userId: string,
  action: 'evaluation' | 'bedrock'
): Promise<void> {
  const now = new Date();
  const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const dayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

  // Increment both hourly and daily counters
  await Promise.all([
    incrementCounter(userId, action, 'hour', hourKey),
    incrementCounter(userId, action, 'day', dayKey)
  ]);
}

/**
 * Increment a specific counter
 */
async function incrementCounter(
  userId: string,
  action: 'evaluation' | 'bedrock',
  period: 'hour' | 'day',
  periodKey: string
): Promise<void> {
  const sk = `RATELIMIT#${action}#${period}#${periodKey}`;
  const ttl = period === 'hour'
    ? Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
    : Math.floor(Date.now() / 1000) + (48 * 60 * 60); // 48 hours

  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: sk
      },
      UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :inc, #ttl = :ttl, #type = :type',
      ExpressionAttributeNames: {
        '#count': 'count',
        '#ttl': 'ttl',
        '#type': 'Type'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':ttl': ttl,
        ':type': 'RATE_LIMIT'
      }
    }));
  } catch (error) {
    console.error('Failed to increment rate limit:', error);
    // Don't fail the request if rate limit tracking fails
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(userId: string): Promise<{
  evaluations: { hourly: RateLimitResult; daily: RateLimitResult };
  bedrock: { hourly: RateLimitResult; daily: RateLimitResult };
}> {
  const now = new Date();
  const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const dayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;

  const [evalHourly, evalDaily, bedrockHourly, bedrockDaily] = await Promise.all([
    checkLimit(userId, 'evaluation', 'hour', hourKey),
    checkLimit(userId, 'evaluation', 'day', dayKey),
    checkLimit(userId, 'bedrock', 'hour', hourKey),
    checkLimit(userId, 'bedrock', 'day', dayKey)
  ]);

  return {
    evaluations: {
      hourly: evalHourly,
      daily: evalDaily
    },
    bedrock: {
      hourly: bedrockHourly,
      daily: bedrockDaily
    }
  };
}
