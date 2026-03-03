/**
 * Evaluation Cache Service
 * 
 * Implements DynamoDB caching for eligibility evaluation results with TTL.
 * Reduces redundant evaluations and Bedrock API calls.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { HybridEvaluationResult } from './hybrid-eligibility-service';
import crypto from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'eligibility-mvp-table';
const CACHE_TTL_MINUTES = 15;

/**
 * Generate a cache key based on evaluation inputs
 */
export function generateCacheKey(
  userId: string,
  schemeId: string,
  userProfileHash: string
): string {
  return `CACHE#${userId}#${schemeId}#${userProfileHash}`;
}

/**
 * Generate a hash of the user profile for cache key
 */
export function hashUserProfile(userProfile: any): string {
  const profileString = JSON.stringify(userProfile, Object.keys(userProfile).sort());
  return crypto.createHash('md5').update(profileString).digest('hex');
}

/**
 * Store evaluation result in cache
 */
export async function cacheEvaluationResult(
  userId: string,
  schemeId: string,
  userProfile: any,
  result: HybridEvaluationResult
): Promise<void> {
  const profileHash = hashUserProfile(userProfile);
  const cacheKey = generateCacheKey(userId, schemeId, profileHash);
  const ttl = Math.floor(Date.now() / 1000) + (CACHE_TTL_MINUTES * 60);

  const item = {
    PK: `USER#${userId}`,
    SK: cacheKey,
    Type: 'EVALUATION_CACHE',
    userId,
    schemeId,
    profileHash,
    result,
    cachedAt: new Date().toISOString(),
    ttl
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));
}

/**
 * Retrieve cached evaluation result
 */
export async function getCachedEvaluationResult(
  userId: string,
  schemeId: string,
  userProfile: any
): Promise<HybridEvaluationResult | null> {
  const profileHash = hashUserProfile(userProfile);
  const cacheKey = generateCacheKey(userId, schemeId, profileHash);

  const response = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: cacheKey
    }
  }));

  if (!response.Item) {
    return null;
  }

  // Check if cache is still valid (TTL not expired)
  const now = Math.floor(Date.now() / 1000);
  if (response.Item.ttl && response.Item.ttl < now) {
    return null;
  }

  return response.Item.result as HybridEvaluationResult;
}

/**
 * Invalidate cache for a user (e.g., when profile is updated)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  // Query all cache entries for the user
  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'CACHE#'
    }
  }));

  // Delete all cache entries (in production, consider batch delete)
  if (response.Items && response.Items.length > 0) {
    // For simplicity, we'll let TTL handle cleanup
    // In production, implement batch delete
    console.log(`Found ${response.Items.length} cache entries for user ${userId} - will expire via TTL`);
  }
}
