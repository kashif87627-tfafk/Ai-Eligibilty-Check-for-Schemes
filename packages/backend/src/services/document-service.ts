/**
 * Document Service
 * 
 * Handles document upload URL generation, S3 operations, and document processing.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocumentRepository } from '../repositories/document-repository';
import {
  CreateDocumentInput,
  UploadUrlResponse,
  DocumentMetadata,
  UpdateDocumentStatusInput,
} from '../types/document';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.DOCUMENT_BUCKET_NAME || '';
const UPLOAD_URL_EXPIRY = 900; // 15 minutes in seconds

export class DocumentService {
  private documentRepository: DocumentRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
  }

  /**
   * Generate a pre-signed S3 upload URL for document upload
   */
  async generateUploadUrl(input: CreateDocumentInput): Promise<UploadUrlResponse> {
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed size of 10MB');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(input.mimeType)) {
      throw new Error(`Unsupported file type: ${input.mimeType}`);
    }

    // Create document metadata in DynamoDB
    const document = await this.documentRepository.create(input, BUCKET_NAME);

    // Generate pre-signed URL for S3 upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: document.s3Key,
      ContentType: input.mimeType,
      Metadata: {
        userId: input.userId,
        documentId: document.id,
        documentType: input.documentType,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: UPLOAD_URL_EXPIRY,
    });

    return {
      uploadUrl,
      documentId: document.id,
      expiresIn: UPLOAD_URL_EXPIRY,
    };
  }

  /**
   * Get document metadata by ID
   */
  async getDocument(documentId: string): Promise<DocumentMetadata | null> {
    return this.documentRepository.getById(documentId);
  }

  /**
   * List all documents for a user
   */
  async listUserDocuments(userId: string): Promise<DocumentMetadata[]> {
    return this.documentRepository.listByUser(userId);
  }

  /**
   * Update document status (called by S3 event trigger or manual verification)
   */
  async updateDocumentStatus(input: UpdateDocumentStatusInput): Promise<DocumentMetadata | null> {
    return this.documentRepository.updateStatus(input);
  }

  /**
   * Process uploaded document (called by S3 event trigger)
   * This is a placeholder for future document processing logic
   */
  async processDocument(documentId: string): Promise<void> {
    const document = await this.documentRepository.getById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Update status to processing
    await this.documentRepository.updateStatus({
      documentId,
      status: 'processing',
    });

    // TODO: Implement document validation and metadata extraction
    // - Validate document format
    // - Extract text using OCR (Amazon Textract)
    // - Extract structured data (Aadhaar number, certificate details, etc.)
    // - Validate document authenticity

    // For now, just mark as uploaded
    await this.documentRepository.updateStatus({
      documentId,
      status: 'uploaded',
    });
  }
}
