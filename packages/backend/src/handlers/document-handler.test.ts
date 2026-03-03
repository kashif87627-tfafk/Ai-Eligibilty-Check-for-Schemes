/**
 * Document Handler Unit Tests
 * 
 * Tests Lambda handler for document upload and management operations.
 * 
 * Requirements: FR-7.2, FR-7.4
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock DocumentService before importing handler
const mockGenerateUploadUrl = jest.fn();
const mockGetDocument = jest.fn();
const mockListUserDocuments = jest.fn();
const mockUpdateDocumentStatus = jest.fn();

jest.mock('../services/document-service', () => {
  return {
    DocumentService: jest.fn().mockImplementation(() => {
      return {
        generateUploadUrl: mockGenerateUploadUrl,
        getDocument: mockGetDocument,
        listUserDocuments: mockListUserDocuments,
        updateDocumentStatus: mockUpdateDocumentStatus,
      };
    }),
  };
});

// Import handler after mocking
import { handler } from './document-handler';

const createMockEvent = (
  method: string,
  path: string,
  body?: any
): APIGatewayProxyEvent => {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  };
};

describe('Document Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS Handling', () => {
    it('should handle OPTIONS request for CORS', async () => {
      const event = createMockEvent('OPTIONS', '/documents/upload-url');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.body).toBe('');
    });
  });

  describe('POST /documents/upload-url', () => {
    it('should generate upload URL successfully', async () => {
      const mockResponse = {
        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
        documentId: 'doc-123',
        expiresIn: 900,
      };

      mockGenerateUploadUrl.mockResolvedValue(mockResponse);

      const event = createMockEvent('POST', '/documents/upload-url', {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'aadhaar.pdf',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.uploadUrl).toBe(mockResponse.uploadUrl);
      expect(body.documentId).toBe(mockResponse.documentId);
      expect(body.expiresIn).toBe(900);
    });

    it('should return 400 when request body is missing', async () => {
      const event = createMockEvent('POST', '/documents/upload-url');

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Request body is required');
    });

    it('should return 400 when required fields are missing', async () => {
      const event = createMockEvent('POST', '/documents/upload-url', {
        userId: 'user-123',
        // Missing other required fields
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required fields');
    });

    it('should return 500 when service throws error', async () => {
      mockGenerateUploadUrl.mockRejectedValue(
        new Error('File size exceeds maximum')
      );

      const event = createMockEvent('POST', '/documents/upload-url', {
        userId: 'user-123',
        documentType: 'aadhaar',
        fileName: 'large.pdf',
        fileSize: 20 * 1024 * 1024,
        mimeType: 'application/pdf',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('File size exceeds maximum');
    });
  });

  describe('GET /documents/{documentId}', () => {
    it('should retrieve document metadata successfully', async () => {
      const mockDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        status: 'uploaded',
        s3Key: 'documents/user-123/doc-123/aadhaar.pdf',
        s3Bucket: 'test-bucket',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
        originalFileName: 'aadhaar.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetDocument.mockResolvedValue(mockDocument);

      const event = createMockEvent('GET', '/documents/doc-123');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.id).toBe('doc-123');
      expect(body.documentType).toBe('aadhaar');
    });

    it('should return 404 when document not found', async () => {
      mockGetDocument.mockResolvedValue(null);

      const event = createMockEvent('GET', '/documents/non-existent');

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Document not found');
    });
  });

  describe('GET /documents/user/{userId}', () => {
    it('should list user documents successfully', async () => {
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

      mockListUserDocuments.mockResolvedValue(mockDocuments);

      const event = createMockEvent('GET', '/documents/user/user-123');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toHaveLength(2);
      expect(body.documents[0].id).toBe('doc-1');
    });

    it('should return empty array for user with no documents', async () => {
      mockListUserDocuments.mockResolvedValue([]);

      const event = createMockEvent('GET', '/documents/user/user-no-docs');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toEqual([]);
    });
  });

  describe('PUT /documents/{documentId}/status', () => {
    it('should update document status successfully', async () => {
      const mockUpdatedDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'aadhaar',
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 'admin-456',
      };

      mockUpdateDocumentStatus.mockResolvedValue(mockUpdatedDocument);

      const event = createMockEvent('PUT', '/documents/doc-123/status', {
        status: 'verified',
        verifiedBy: 'admin-456',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('verified');
      expect(body.verifiedBy).toBe('admin-456');
    });

    it('should return 400 when request body is missing', async () => {
      const event = createMockEvent('PUT', '/documents/doc-123/status');

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Request body is required');
    });

    it('should return 404 when document not found', async () => {
      mockUpdateDocumentStatus.mockResolvedValue(null);

      const event = createMockEvent('PUT', '/documents/non-existent/status', {
        status: 'verified',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Document not found');
    });

    it('should handle rejection with reason', async () => {
      const mockUpdatedDocument = {
        id: 'doc-123',
        userId: 'user-123',
        documentType: 'income_certificate',
        status: 'rejected',
        rejectionReason: 'Document is not clear',
      };

      mockUpdateDocumentStatus.mockResolvedValue(mockUpdatedDocument);

      const event = createMockEvent('PUT', '/documents/doc-123/status', {
        status: 'rejected',
        rejectionReason: 'Document is not clear',
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('rejected');
      expect(body.rejectionReason).toBe('Document is not clear');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoint', async () => {
      const event = createMockEvent('GET', '/documents/unknown/endpoint');

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Endpoint not found');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockGetDocument.mockRejectedValue(
        new Error('Database connection failed')
      );

      const event = createMockEvent('GET', '/documents/doc-123');

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Database connection failed');
    });
  });

  describe('Response Headers', () => {
    it('should include CORS headers in all responses', async () => {
      const event = createMockEvent('GET', '/documents/unknown');

      const result = await handler(event);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });
});
