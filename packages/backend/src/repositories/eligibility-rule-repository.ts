/**
 * Eligibility Rule Repository
 * 
 * This module provides data access methods for eligibility rules in DynamoDB.
 * Uses single-table design pattern with GSIs for efficient querying.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { EligibilityRule, EligibilityRuleDynamoDBItem } from '../types/eligibility-rules';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'eligibility-mvp-table';

/**
 * Convert an EligibilityRule to a DynamoDB item
 */
function toDynamoDBItem(rule: EligibilityRule): EligibilityRuleDynamoDBItem {
  const item: EligibilityRuleDynamoDBItem = {
    PK: `RULE#${rule.id}`,
    SK: `SCHEME#${rule.schemeId}`,
    GSI1PK: `SCHEME#${rule.schemeId}`,
    GSI1SK: `CATEGORY#${rule.category}`,
    entityType: 'ELIGIBILITY_RULE',
    rule,
  };

  // Add GSI2 for location-based queries if applicable
  if (rule.applicableStates.length > 0) {
    // For simplicity, use the first state for GSI2PK
    // In production, you might want to create multiple items or use a different strategy
    item.GSI2PK = `STATE#${rule.applicableStates[0]}`;
    item.GSI2SK = `CATEGORY#${rule.category}`;
  }

  return item;
}

/**
 * Convert a DynamoDB item to an EligibilityRule
 */
function fromDynamoDBItem(item: EligibilityRuleDynamoDBItem): EligibilityRule {
  return item.rule;
}

/**
 * Save an eligibility rule to DynamoDB
 */
export async function saveEligibilityRule(rule: EligibilityRule): Promise<void> {
  const item = toDynamoDBItem(rule);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

/**
 * Get an eligibility rule by ID
 */
export async function getEligibilityRuleById(ruleId: string): Promise<EligibilityRule | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `RULE#${ruleId}`,
        SK: `SCHEME#${ruleId.replace('rule-', 'scheme-')}`, // Assuming rule ID pattern
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return fromDynamoDBItem(result.Item as EligibilityRuleDynamoDBItem);
}

/**
 * Get eligibility rules by scheme ID
 */
export async function getEligibilityRulesBySchemeId(schemeId: string): Promise<EligibilityRule[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :schemeId',
      ExpressionAttributeValues: {
        ':schemeId': `SCHEME#${schemeId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map((item) => fromDynamoDBItem(item as EligibilityRuleDynamoDBItem));
}

/**
 * Get eligibility rules by category
 */
export async function getEligibilityRulesByCategory(
  category: string
): Promise<EligibilityRule[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1SK = :category',
      ExpressionAttributeValues: {
        ':category': `CATEGORY#${category}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map((item) => fromDynamoDBItem(item as EligibilityRuleDynamoDBItem));
}

/**
 * Get eligibility rules by state and category
 */
export async function getEligibilityRulesByStateAndCategory(
  state: string,
  category?: string
): Promise<EligibilityRule[]> {
  const params: any = {
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :state',
    ExpressionAttributeValues: {
      ':state': `STATE#${state}`,
    },
  };

  if (category) {
    params.KeyConditionExpression += ' AND GSI2SK = :category';
    params.ExpressionAttributeValues[':category'] = `CATEGORY#${category}`;
  }

  const result = await docClient.send(new QueryCommand(params));

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map((item) => fromDynamoDBItem(item as EligibilityRuleDynamoDBItem));
}

/**
 * Get all eligibility rules
 * Note: This is for testing/admin purposes only. In production, use pagination.
 */
export async function getAllEligibilityRules(): Promise<EligibilityRule[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'begins_with(GSI1SK, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': 'CATEGORY#',
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map((item) => fromDynamoDBItem(item as EligibilityRuleDynamoDBItem));
}

/**
 * Update an eligibility rule
 */
export async function updateEligibilityRule(rule: EligibilityRule): Promise<void> {
  const updatedRule = {
    ...rule,
    updatedAt: new Date().toISOString(),
  };

  await saveEligibilityRule(updatedRule);
}

/**
 * Delete an eligibility rule
 */
export async function deleteEligibilityRule(ruleId: string, schemeId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `RULE#${ruleId}`,
        SK: `SCHEME#${schemeId}`,
      },
    })
  );
}

/**
 * Seed sample eligibility rules into DynamoDB
 * This is useful for testing and initial setup
 */
export async function seedSampleRules(rules: EligibilityRule[]): Promise<void> {
  const promises = rules.map((rule) => saveEligibilityRule(rule));
  await Promise.all(promises);
}
