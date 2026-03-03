/**
 * Document Processor Handler
 * 
 * Lambda handler triggered by S3 events when documents are uploaded.
 * Handles document validation and metadata extraction.
 */

import { S3Event } from 'aws-lambda';
import { DocumentService } from '../services/document-service';

const documentService = new DocumentService();

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Document processor invoked:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      // Only process ObjectCreated events
      if (!record.eventName.startsWith('ObjectCreated')) {
        continue;
      }

      const s3Object = record.s3.object;
      const key = decodeURIComponent(s3Object.key.replace(/\+/g, ' '));

      console.log(`Processing document: ${key}`);

      // Extract document ID from S3 key
      // Expected format: documents/{userId}/{documentId}/{fileName}
      const keyParts = key.split('/');
      if (keyParts.length < 3 || keyParts[0] !== 'documents') {
        console.warn(`Invalid S3 key format: ${key}`);
        continue;
      }

      const documentId = keyParts[2];

      // Process the document
      await documentService.processDocument(documentId);

      console.log(`Successfully processed document: ${documentId}`);
    }
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};
