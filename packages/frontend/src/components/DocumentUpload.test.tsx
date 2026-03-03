import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentUpload from './DocumentUpload';

// Mock fetch
global.fetch = vi.fn();

describe('DocumentUpload', () => {
  const mockUserId = 'user-123';
  const mockMissingDocuments = [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Government-issued identity document',
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: false,
      description: 'Certificate showing annual income',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders document upload component', () => {
    render(<DocumentUpload userId={mockUserId} />);
    
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Type:')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your file here/i)).toBeInTheDocument();
  });

  it('displays missing documents alert when provided', () => {
    render(
      <DocumentUpload 
        userId={mockUserId} 
        missingDocuments={mockMissingDocuments}
      />
    );
    
    expect(screen.getByText('Missing Documents')).toBeInTheDocument();
    expect(screen.getByText('Aadhaar Card')).toBeInTheDocument();
    expect(screen.getByText('Income Certificate')).toBeInTheDocument();
    expect(screen.getByText('Government-issued identity document')).toBeInTheDocument();
  });

  it('highlights mandatory documents', () => {
    render(
      <DocumentUpload 
        userId={mockUserId} 
        missingDocuments={mockMissingDocuments}
      />
    );
    
    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges).toHaveLength(1); // Only Aadhaar is mandatory
  });

  it('allows selecting document type', () => {
    render(<DocumentUpload userId={mockUserId} />);
    
    const select = screen.getByLabelText('Document Type:') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'income_certificate' } });
    
    expect(select.value).toBe('income_certificate');
  });

  it('validates file size', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<DocumentUpload userId={mockUserId} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('File size must be less than 10MB');
    });
    
    alertSpy.mockRestore();
  });

  it('validates file type', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<DocumentUpload userId={mockUserId} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create an invalid file type
    const invalidFile = new File(['content'], 'document.txt', {
      type: 'text/plain',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Only PDF, JPEG, and PNG files are allowed');
    });
    
    alertSpy.mockRestore();
  });

  it('uploads file successfully', async () => {
    const mockUploadUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
    const mockDocumentId = 'doc-123';
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/upload-url')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: mockUploadUrl,
            documentId: mockDocumentId,
          }),
        });
      }
      if (url === mockUploadUrl) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    
    const onUploadComplete = vi.fn();
    
    render(
      <DocumentUpload 
        userId={mockUserId} 
        onUploadComplete={onUploadComplete}
      />
    );
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const validFile = new File(['content'], 'aadhaar.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('✓ Uploaded')).toBeInTheDocument();
    });
    
    expect(onUploadComplete).toHaveBeenCalled();
  });

  it('handles upload error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    render(<DocumentUpload userId={mockUserId} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const validFile = new File(['content'], 'aadhaar.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('✗ Failed')).toBeInTheDocument();
    });
  });

  it('displays uploaded documents list', async () => {
    const mockUploadUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
    const mockDocumentId = 'doc-123';
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/upload-url')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: mockUploadUrl,
            documentId: mockDocumentId,
          }),
        });
      }
      if (url === mockUploadUrl) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    
    render(<DocumentUpload userId={mockUserId} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const validFile = new File(['content'], 'aadhaar.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('Uploaded Documents')).toBeInTheDocument();
      expect(screen.getAllByText('Aadhaar Card').length).toBeGreaterThan(0);
      expect(screen.getByText('aadhaar.pdf')).toBeInTheDocument();
    });
  });

  it('formats file size correctly', async () => {
    const mockUploadUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz';
    const mockDocumentId = 'doc-123';
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/upload-url')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: mockUploadUrl,
            documentId: mockDocumentId,
          }),
        });
      }
      if (url === mockUploadUrl) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    
    render(<DocumentUpload userId={mockUserId} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a 2MB file
    const validFile = new File(['x'.repeat(2 * 1024 * 1024)], 'document.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    });
  });
});
