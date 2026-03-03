/**
 * Document Data Model
 * 
 * Defines TypeScript interfaces for document management including
 * upload, storage, and verification tracking.
 */

export type DocumentType = 
  | 'aadhaar'
  | 'income_certificate'
  | 'caste_certificate'
  | 'education_certificate'
  | 'disability_certificate'
  | 'domicile_certificate'
  | 'other';

export type DocumentSource = 
  | 'user_upload'
  | 'digilocker'
  | 'government_api';

export type DocumentStatus = 
  | 'pending'
  | 'uploaded'
  | 'processing'
  | 'verified'
  | 'rejected'
  | 'expired';

export interface DocumentMetadata {
  id: string;
  userId: string;
  documentType: DocumentType;
  source: DocumentSource;
  status: DocumentStatus;
  
  // S3 storage details
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
  
  // Verification details
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  
  // Extracted metadata (from document processing)
  extractedData?: Record<string, any>;
  
  // Expiry tracking
  expiresAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  userId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  documentId: string;
  expiresIn: number; // seconds
}

export interface UpdateDocumentStatusInput {
  documentId: string;
  status: DocumentStatus;
  verifiedBy?: string;
  rejectionReason?: string;
  extractedData?: Record<string, any>;
}
