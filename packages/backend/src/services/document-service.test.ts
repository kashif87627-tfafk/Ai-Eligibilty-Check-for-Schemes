/**
 * Document Service Unit Tests
 * 
 * Tests document validation logic and error handling
 */

import { DocumentService } from './document-service';
import { CreateDocumentInput } from '../types/document';

// Mock AWS SDK and repository
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-url'),
}));
jest.mock('../repositories/document-repository', () => {
  return {
    DocumentRepository: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn().mockImplementation((input, bucket) => ({
          id: 'mock-doc-id',
          userId: input.userId,
          documentType: input.documentType,
          source: 'user_upload',
          status: 'pending',
          s3Key: `documents/${input.userId}/mock-doc-id/${input.fileName}`,
          s3Bucket: bucket,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          originalFileName: input.fileName,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        getById: jest.fn(),
        listByUser: jest.fn(),
        updateStatus: jest.fn(),
      };
    }),
  };
});

describe('DocumentService - Validation', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    jest.clearAllMocks();
    documentService = new DocumentService();
  });

  describe('File Size Validation', () => {
    it('should reject files larger than 10MB', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'large-file.pdf',
        fileSize: 11 * 1024 * 1024, // 11MB
        mimeType: 'application/pdf',
      };

      await expect(documentService.generateUploadUrl(input)).rejects.toThrow(
        'File size exceeds maximum allowed size of 10MB'
      );
    });

    it('should accept files under 10MB', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'valid-file.pdf',
        fileSize: 5 * 1024 * 1024, // 5MB
        mimeType: 'application/pdf',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('documentId');
      expect(result).toHaveProperty('expiresIn', 900);
    });
  });

  describe('MIME Type Validation', () => {
    it('should reject unsupported file types', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'document.exe',
        fileSize: 1024,
        mimeType: 'application/x-msdownload',
      };

      await expect(documentService.generateUploadUrl(input)).rejects.toThrow(
        'Unsupported file type'
      );
    });

    it('should accept PDF files', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'income_certificate',
        fileName: 'income.pdf',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result).toHaveProperty('uploadUrl');
      expect(result.documentId).toBe('mock-doc-id');
    });

    it('should accept JPEG images', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'caste_certificate',
        fileName: 'certificate.jpg',
        fileSize: 2 * 1024 * 1024,
        mimeType: 'image/jpeg',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result).toHaveProperty('uploadUrl');
      expect(result.documentId).toBe('mock-doc-id');
    });

    it('should accept PNG images', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'education_certificate',
        fileName: 'certificate.png',
        fileSize: 3 * 1024 * 1024,
        mimeType: 'image/png',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result).toHaveProperty('uploadUrl');
      expect(result.documentId).toBe('mock-doc-id');
    });

    it('should accept Word documents', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'other',
        fileName: 'document.docx',
        fileSize: 1024 * 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result).toHaveProperty('uploadUrl');
      expect(result.documentId).toBe('mock-doc-id');
    });
  });

  describe('Document Type Support', () => {
    const validDocumentTypes = [
      'aadhaar',
      'income_certificate',
      'caste_certificate',
      'education_certificate',
      'disability_certificate',
      'domicile_certificate',
      'other',
    ];

    validDocumentTypes.forEach((docType) => {
      it(`should support ${docType} document type`, async () => {
        const input: CreateDocumentInput = {
          userId: 'user-123',
          documentType: docType as any,
          fileName: `${docType}.pdf`,
          fileSize: 1024 * 1024,
          mimeType: 'application/pdf',
        };

        const result = await documentService.generateUploadUrl(input);

        expect(result).toHaveProperty('uploadUrl');
        expect(result).toHaveProperty('documentId');
      });
    });
  });

  describe('Upload URL Generation', () => {
    it('should generate pre-signed URL with correct expiry', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'aadhaar.pdf',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result.uploadUrl).toBe('https://s3.amazonaws.com/presigned-url');
      expect(result.expiresIn).toBe(900); // 15 minutes
    });

    it('should create document metadata in repository', async () => {
      const input: CreateDocumentInput = {
        userId: 'user-456',
        documentType: 'income_certificate',
        fileName: 'income.pdf',
        fileSize: 2 * 1024 * 1024,
        mimeType: 'application/pdf',
      };

      const result = await documentService.generateUploadUrl(input);

      expect(result.documentId).toBe('mock-doc-id');
      expect(result.uploadUrl).toBeDefined();
    });
  });

  describe('Document Metadata Retrieval', () => {
    it('should retrieve document by ID', async () => {
      const mockDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        source: 'user_upload',
        status: 'uploaded',
        s3Key: 'documents/user-123/doc-123/aadhaar.pdf',
        s3Bucket: 'test-bucket',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
        originalFileName: 'aadhaar.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGetById = jest.fn().mockResolvedValue(mockDocument);
      (documentService as any).documentRepository.getById = mockGetById;

      const result = await documentService.getDocument('doc-123');

      expect(mockGetById).toHaveBeenCalledWith('doc-123');
      expect(result).toEqual(mockDocument);
    });

    it('should return null for non-existent document', async () => {
      const mockGetById = jest.fn().mockResolvedValue(null);
      (documentService as any).documentRepository.getById = mockGetById;

      const result = await documentService.getDocument('non-existent');

      expect(mockGetById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should list all documents for a user', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          userId: 'user-123',
          documentType: 'aadhaar',
          status: 'verified',
        },
        {
          id: 'doc-2',
          userId: 'user-123',
          documentType: 'income_certificate',
          status: 'pending',
        },
      ];

      const mockListByUser = jest.fn().mockResolvedValue(mockDocuments);
      (documentService as any).documentRepository.listByUser = mockListByUser;

      const result = await documentService.listUserDocuments('user-123');

      expect(mockListByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for user with no documents', async () => {
      const mockListByUser = jest.fn().mockResolvedValue([]);
      (documentService as any).documentRepository.listByUser = mockListByUser;

      const result = await documentService.listUserDocuments('user-no-docs');

      expect(mockListByUser).toHaveBeenCalledWith('user-no-docs');
      expect(result).toEqual([]);
    });
  });

  describe('Document Status Updates', () => {
    it('should update document status to verified', async () => {
      const mockUpdatedDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 'admin-456',
      };

      const mockUpdateStatus = jest.fn().mockResolvedValue(mockUpdatedDocument);
      (documentService as any).documentRepository.updateStatus = mockUpdateStatus;

      const input = {
        documentId: 'doc-123',
        status: 'verified' as const,
        verifiedBy: 'admin-456',
      };

      const result = await documentService.updateDocumentStatus(input);

      expect(mockUpdateStatus).toHaveBeenCalledWith(input);
      expect(result?.status).toBe('verified');
      expect(result?.verifiedBy).toBe('admin-456');
    });

    it('should update document status to rejected with reason', async () => {
      const mockUpdatedDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'income_certificate',
        status: 'rejected',
        rejectionReason: 'Document is not clear',
      };

      const mockUpdateStatus = jest.fn().mockResolvedValue(mockUpdatedDocument);
      (documentService as any).documentRepository.updateStatus = mockUpdateStatus;

      const input = {
        documentId: 'doc-123',
        status: 'rejected' as const,
        rejectionReason: 'Document is not clear',
      };

      const result = await documentService.updateDocumentStatus(input);

      expect(mockUpdateStatus).toHaveBeenCalledWith(input);
      expect(result?.status).toBe('rejected');
      expect(result?.rejectionReason).toBe('Document is not clear');
    });

    it('should update document status with extracted data', async () => {
      const extractedData = {
        aadhaarNumber: '1234-5678-9012',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
      };

      const mockUpdatedDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        status: 'uploaded',
        extractedData,
      };

      const mockUpdateStatus = jest.fn().mockResolvedValue(mockUpdatedDocument);
      (documentService as any).documentRepository.updateStatus = mockUpdateStatus;

      const input = {
        documentId: 'doc-123',
        status: 'uploaded' as const,
        extractedData,
      };

      const result = await documentService.updateDocumentStatus(input);

      expect(mockUpdateStatus).toHaveBeenCalledWith(input);
      expect(result?.extractedData).toEqual(extractedData);
    });

    it('should return null when updating non-existent document', async () => {
      const mockUpdateStatus = jest.fn().mockResolvedValue(null);
      (documentService as any).documentRepository.updateStatus = mockUpdateStatus;

      const input = {
        documentId: 'non-existent',
        status: 'verified' as const,
      };

      const result = await documentService.updateDocumentStatus(input);

      expect(mockUpdateStatus).toHaveBeenCalledWith(input);
      expect(result).toBeNull();
    });
  });

  describe('Document Processing', () => {
    it('should process uploaded document', async () => {
      const mockDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        status: 'pending',
      };

      const mockGetById = jest.fn().mockResolvedValue(mockDocument);
      const mockUpdateStatus = jest.fn().mockResolvedValue({ ...mockDocument, status: 'uploaded' });
      (documentService as any).documentRepository.getById = mockGetById;
      (documentService as any).documentRepository.updateStatus = mockUpdateStatus;

      await documentService.processDocument('doc-123');

      expect(mockGetById).toHaveBeenCalledWith('doc-123');
      expect(mockUpdateStatus).toHaveBeenCalledWith({
        documentId: 'doc-123',
        status: 'processing',
      });
      expect(mockUpdateStatus).toHaveBeenCalledWith({
        documentId: 'doc-123',
        status: 'uploaded',
      });
    });

    it('should throw error when processing non-existent document', async () => {
      const mockGetById = jest.fn().mockResolvedValue(null);
      (documentService as any).documentRepository.getById = mockGetById;

      await expect(documentService.processDocument('non-existent')).rejects.toThrow(
        'Document not found: non-existent'
      );
    });
  });
});
