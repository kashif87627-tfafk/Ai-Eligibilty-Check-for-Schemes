import { useState, useRef, DragEvent } from 'react';
import { DocumentType, documentApi } from '../services/api';
import './DocumentUpload.css';

const MOCK_API_MODE = false;

interface UploadedDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'uploaded' | 'error';
  errorMessage?: string;
}

interface DocumentUploadProps {
  userId: string;
  missingDocuments?: Array<{
    type: string;
    name: string;
    mandatory: boolean;
    description: string;
  }>;
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  aadhaar: 'Aadhaar Card',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  education_certificate: 'Education Certificate',
  disability_certificate: 'Disability Certificate',
  domicile_certificate: 'Domicile Certificate',
  other: 'Other Document',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const DocumentUpload = ({ userId, missingDocuments = [], onUploadComplete }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType>('aadhaar');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF, JPEG, and PNG files are allowed';
    }
    return null;
  };

  const uploadFile = async (file: File, documentType: DocumentType) => {
    const tempId = `temp-${Date.now()}`;
    
    // Add document to list with uploading status
    const newDoc: UploadedDocument = {
      id: tempId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
    };
    
    setDocuments(prev => [...prev, newDoc]);

    try {
      if (MOCK_API_MODE) {
        // Mock mode - simulate upload
        console.log('📤 Mock upload started:', file.name);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get mock upload URL (which also stores the document)
        const { documentId } = await documentApi.getUploadUrl(
          userId,
          documentType,
          file.name,
          file.size,
          file.type
        );
        
        // Update document status to uploaded
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? { ...doc, id: documentId, status: 'uploaded' }
              : doc
          )
        );
        
        console.log('✅ Mock upload complete:', documentId);
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        // Real mode - use actual S3 upload
        const { uploadUrl, documentId } = await documentApi.getUploadUrl(
          userId,
          documentType,
          file.name,
          file.size,
          file.type
        );

        // Upload file to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        // Update document status to uploaded
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? { ...doc, id: documentId, status: 'uploaded' }
              : doc
          )
        );

        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === tempId
            ? {
                ...doc,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Upload failed',
              }
            : doc
        )
      );
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateFile(file);

    if (error) {
      alert(error);
      return;
    }

    uploadFile(file, selectedType);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isMissingDocument = (type: string): boolean => {
    return missingDocuments.some(doc => doc.type === type);
  };

  return (
    <div className="document-upload">
      <h3>Upload Documents</h3>
      
      {missingDocuments.length > 0 && (
        <div className="missing-documents-alert">
          <h4>Missing Documents</h4>
          <ul>
            {missingDocuments.map((doc, index) => (
              <li key={index} className={doc.mandatory ? 'mandatory' : ''}>
                <strong>{doc.name}</strong>
                {doc.mandatory && <span className="mandatory-badge">Required</span>}
                <p>{doc.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="upload-section">
        <div className="document-type-selector">
          <label htmlFor="document-type">Document Type:</label>
          <select
            id="document-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
            className={isMissingDocument(selectedType) ? 'missing' : ''}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
                {isMissingDocument(value) ? ' ⚠️' : ''}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <svg
              className="upload-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="drop-zone-text">
              Drag and drop your file here, or{' '}
              <button type="button" onClick={handleBrowseClick} className="browse-button">
                browse
              </button>
            </p>
            <p className="drop-zone-hint">PDF, JPEG, or PNG (max 10MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {documents.length > 0 && (
        <div className="documents-list">
          <h4>Uploaded Documents</h4>
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className={`document-item status-${doc.status}`}>
                <div className="document-info">
                  <div className="document-header">
                    <span className="document-type">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </span>
                    <span className={`status-badge status-${doc.status}`}>
                      {doc.status === 'uploading' && '⏳ Uploading...'}
                      {doc.status === 'uploaded' && '✓ Uploaded'}
                      {doc.status === 'error' && '✗ Failed'}
                    </span>
                  </div>
                  <div className="document-details">
                    <span className="file-name">{doc.fileName}</span>
                    <span className="file-size">{formatFileSize(doc.fileSize)}</span>
                  </div>
                  {doc.errorMessage && (
                    <p className="error-message">{doc.errorMessage}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
