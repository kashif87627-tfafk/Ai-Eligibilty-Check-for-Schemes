/**
 * User Profile Repository
 * 
 * Implements DynamoDB single-table design with PK/SK patterns for user profiles.
 * 
 * Access Patterns:
 * 1. Get user profile by ID: PK=USER#{userId}, SK=PROFILE
 * 2. Get user profile by phone number: GSI1PK=PHONE#{phoneNumber}, GSI1SK=PROFILE
 * 3. List all user profiles: Query by entity type (for admin purposes)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../types/user-profile';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'eligibility-mvp-table';

interface DynamoDBUserProfile {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  EntityType: string;
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  aadhaarHash?: string;
  ageRange: string;
  gender?: string;
  location: {
    state: string;
    district: string;
    ruralUrban: string;
    pincode?: string;
  };
  education?: string;
  occupation?: string;
  employmentStatus?: string;
  incomeRange?: string;
  category?: string;
  disabilityStatus?: string;
  language: string;
  interactionMode: string;
  explanationLevel: string;
  consentGiven: boolean;
  consentTimestamp?: string;
  sensitiveDataConsent?: {
    category: boolean;
    disability: boolean;
    income: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

function toDynamoDBItem(profile: UserProfile): DynamoDBUserProfile {
  return {
    PK: `USER#${profile.id}`,
    SK: 'PROFILE',
    GSI1PK: `PHONE#${profile.phoneNumber}`,
    GSI1SK: 'PROFILE',
    EntityType: 'UserProfile',
    id: profile.id,
    phoneNumber: profile.phoneNumber,
    email: profile.email,
    name: profile.name,
    aadhaarHash: profile.aadhaarHash,
    ageRange: profile.ageRange,
    gender: profile.gender,
    location: profile.location,
    education: profile.education,
    occupation: profile.occupation,
    employmentStatus: profile.employmentStatus,
    incomeRange: profile.incomeRange,
    category: profile.category,
    disabilityStatus: profile.disabilityStatus,
    language: profile.language,
    interactionMode: profile.interactionMode || 'text',
    explanationLevel: profile.explanationLevel || 'standard',
    consentGiven: profile.consentGiven,
    consentTimestamp: profile.consentTimestamp?.toISOString(),
    sensitiveDataConsent: profile.sensitiveDataConsent,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function fromDynamoDBItem(item: DynamoDBUserProfile): UserProfile {
  return {
    id: item.id,
    phoneNumber: item.phoneNumber,
    email: item.email,
    name: item.name,
    aadhaarHash: item.aadhaarHash,
    ageRange: item.ageRange as UserProfile['ageRange'],
    gender: item.gender as UserProfile['gender'],
    location: {
      state: item.location.state,
      district: item.location.district,
      ruralUrban: item.location.ruralUrban as 'rural' | 'urban',
      pincode: item.location.pincode,
    },
    education: item.education as UserProfile['education'],
    occupation: item.occupation,
    employmentStatus: item.employmentStatus as UserProfile['employmentStatus'],
    incomeRange: item.incomeRange as UserProfile['incomeRange'],
    category: item.category as UserProfile['category'],
    disabilityStatus: item.disabilityStatus as UserProfile['disabilityStatus'],
    language: item.language,
    interactionMode: item.interactionMode as UserProfile['interactionMode'],
    explanationLevel: item.explanationLevel as UserProfile['explanationLevel'],
    consentGiven: item.consentGiven,
    consentTimestamp: item.consentTimestamp ? new Date(item.consentTimestamp) : undefined,
    sensitiveDataConsent: item.sensitiveDataConsent,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

export class UserProfileRepository {
  async create(input: CreateUserProfileInput): Promise<UserProfile> {
    const now = new Date();
    const profile: UserProfile = {
      id: uuidv4(),
      phoneNumber: input.phoneNumber,
      email: input.email,
      name: input.name,
      ageRange: input.ageRange,
      location: input.location,
      language: input.language,
      consentGiven: input.consentGiven,
      consentTimestamp: now,
      gender: input.gender,
      education: input.education,
      occupation: input.occupation,
      employmentStatus: input.employmentStatus,
      incomeRange: input.incomeRange,
      category: input.category,
      disabilityStatus: input.disabilityStatus,
      interactionMode: input.interactionMode || 'text',
      explanationLevel: input.explanationLevel || 'standard',
      sensitiveDataConsent: input.sensitiveDataConsent,
      createdAt: now,
      updatedAt: now,
    };

    const item = toDynamoDBItem(profile);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return profile;
  }

  async getById(userId: string): Promise<UserProfile | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return fromDynamoDBItem(result.Item as DynamoDBUserProfile);
  }

  async getByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
        ExpressionAttributeValues: {
          ':gsi1pk': `PHONE#${phoneNumber}`,
          ':gsi1sk': 'PROFILE',
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return fromDynamoDBItem(result.Items[0] as DynamoDBUserProfile);
  }

  async update(input: UpdateUserProfileInput): Promise<UserProfile | null> {
    const existing = await this.getById(input.id);
    if (!existing) {
      return null;
    }

    const now = new Date();
    const updated: UserProfile = {
      ...existing,
      ...input,
      location: input.location ? { ...existing.location, ...input.location } : existing.location,
      sensitiveDataConsent: input.sensitiveDataConsent 
        ? { ...existing.sensitiveDataConsent, ...input.sensitiveDataConsent }
        : existing.sensitiveDataConsent,
      updatedAt: now,
    };

    const item = toDynamoDBItem(updated);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return updated;
  }

  async delete(userId: string): Promise<boolean> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: 'PROFILE',
          },
        })
      );
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }
  }

  async exists(userId: string): Promise<boolean> {
    const profile = await this.getById(userId);
    return profile !== null;
  }

  async phoneNumberExists(phoneNumber: string): Promise<boolean> {
    const profile = await this.getByPhoneNumber(phoneNumber);
    return profile !== null;
  }
}
