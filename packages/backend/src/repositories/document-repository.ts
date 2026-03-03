/**
 * Document Repository
 * 
 * Implements DynamoDB single-table design with PK/SK patterns for document metadata.
 * 
 * Access Patterns:
 * 1. Get document by ID: PK=DOC#{documentId}, SK=METADATA
 * 2. List documents by user: PK=USER#{userId}, SK=DOC#{documentId}
 * 3. Query documents by type: GSI1PK=DOCTYPE#{documentType}, GSI1SK=DOC#{documentId}
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  DocumentMetadata,
  CreateDocumentInput,
  UpdateDocumentStatusInput,
} from '../types/document';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'eligibility-mvp-table';

interface DynamoDBDocument {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  EntityType: string;
  id: string;
  userId: string;
  documentType: string;
  source: string;
  status: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  extractedData?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

function toDynamoDBItem(doc: DocumentMetadata): DynamoDBDocument {
  return {
    PK: `DOC#${doc.id}`,
    SK: 'METADATA',
    GSI1PK: `USER#${doc.userId}`,
    GSI1SK: `DOC#${doc.id}`,
    EntityType: 'Document',
    id: doc.id,
    userId: doc.userId,
    documentType: doc.documentType,
    source: doc.source,
    status: doc.status,
    s3Key: doc.s3Key,
    s3Bucket: doc.s3Bucket,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    originalFileName: doc.originalFileName,
    verifiedAt: doc.verifiedAt?.toISOString(),
    verifiedBy: doc.verifiedBy,
    rejectionReason: doc.rejectionReason,
    extractedData: doc.extractedData,
    expiresAt: doc.expiresAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function fromDynamoDBItem(item: DynamoDBDocument): DocumentMetadata {
  return {
    id: item.id,
    userId: item.userId,
    documentType: item.documentType as DocumentMetadata['documentType'],
    source: item.source as DocumentMetadata['source'],
    status: item.status as DocumentMetadata['status'],
    s3Key: item.s3Key,
    s3Bucket: item.s3Bucket,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    originalFileName: item.originalFileName,
    verifiedAt: item.verifiedAt ? new Date(item.verifiedAt) : undefined,
    verifiedBy: item.verifiedBy,
    rejectionReason: item.rejectionReason,
    extractedData: item.extractedData,
    expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

export class DocumentRepository {
  async create(input: CreateDocumentInput, s3Bucket: string): Promise<DocumentMetadata> {
    const now = new Date();
    const documentId = uuidv4();
    const s3Key = `documents/${input.userId}/${documentId}/${input.fileName}`;

    const document: DocumentMetadata = {
      id: documentId,
      userId: input.userId,
      documentType: input.documentType,
      source: 'user_upload',
      status: 'pending',
      s3Key,
      s3Bucket,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      originalFileName: input.fileName,
      createdAt: now,
      updatedAt: now,
    };

    const item = toDynamoDBItem(document);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return document;
  }

  async getById(documentId: string): Promise<DocumentMetadata | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `DOC#${documentId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return fromDynamoDBItem(result.Item as DynamoDBDocument);
  }

  async listByUser(userId: string): Promise<DocumentMetadata[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${userId}`,
          ':gsi1sk': 'DOC#',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => fromDynamoDBItem(item as DynamoDBDocument));
  }

  async updateStatus(input: UpdateDocumentStatusInput): Promise<DocumentMetadata | null> {
    const existing = await this.getById(input.documentId);
    if (!existing) {
      return null;
    }

    const now = new Date();
    const updateExpression: string[] = ['#status = :status', '#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':status': input.status,
      ':updatedAt': now.toISOString(),
    };

    if (input.status === 'verified' && input.verifiedBy) {
      updateExpression.push('#verifiedAt = :verifiedAt', '#verifiedBy = :verifiedBy');
      expressionAttributeNames['#verifiedAt'] = 'verifiedAt';
      expressionAttributeNames['#verifiedBy'] = 'verifiedBy';
      expressionAttributeValues[':verifiedAt'] = now.toISOString();
      expressionAttributeValues[':verifiedBy'] = input.verifiedBy;
    }

    if (input.status === 'rejected' && input.rejectionReason) {
      updateExpression.push('#rejectionReason = :rejectionReason');
      expressionAttributeNames['#rejectionReason'] = 'rejectionReason';
      expressionAttributeValues[':rejectionReason'] = input.rejectionReason;
    }

    if (input.extractedData) {
      updateExpression.push('#extractedData = :extractedData');
      expressionAttributeNames['#extractedData'] = 'extractedData';
      expressionAttributeValues[':extractedData'] = input.extractedData;
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `DOC#${input.documentId}`,
          SK: 'METADATA',
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return this.getById(input.documentId);
  }
}
