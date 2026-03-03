/**
 * Document Handler
 * 
 * Lambda handler for document upload and management operations.
 * 
 * Endpoints:
 * - POST /documents/upload-url - Generate pre-signed upload URL
 * - GET /documents/{documentId} - Get document metadata
 * - GET /documents/user/{userId} - List user documents
 * - PUT /documents/{documentId}/status - Update document status
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DocumentService } from '../services/document-service';
import { CreateDocumentInput, UpdateDocumentStatusInput } from '../types/document';

const documentService = new DocumentService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Document handler invoked:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // POST /documents/upload-url - Generate pre-signed upload URL
    if (method === 'POST' && path.endsWith('/upload-url')) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const input: CreateDocumentInput = JSON.parse(event.body);

      // Validate required fields
      if (!input.userId || !input.documentType || !input.fileName || !input.fileSize || !input.mimeType) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing required fields: userId, documentType, fileName, fileSize, mimeType',
          }),
        };
      }

      const result = await documentService.generateUploadUrl(input);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // GET /documents/{documentId} - Get document metadata
    if (method === 'GET' && path.match(/\/documents\/[^/]+$/) && !path.includes('/user/')) {
      const documentId = path.split('/').pop()!;
      const document = await documentService.getDocument(documentId);

      if (!document) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Document not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(document),
      };
    }

    // GET /documents/user/{userId} - List user documents
    if (method === 'GET' && path.includes('/user/')) {
      const userId = path.split('/').pop()!;
      const documents = await documentService.listUserDocuments(userId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ documents }),
      };
    }

    // PUT /documents/{documentId}/status - Update document status
    if (method === 'PUT' && path.includes('/status')) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const pathParts = path.split('/');
      const documentId = pathParts[pathParts.length - 2];
      const input: UpdateDocumentStatusInput = {
        documentId,
        ...JSON.parse(event.body),
      };

      const document = await documentService.updateDocumentStatus(input);

      if (!document) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Document not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(document),
      };
    }

    // Unknown endpoint
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in document handler:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
