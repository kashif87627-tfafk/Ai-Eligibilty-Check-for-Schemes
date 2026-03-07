import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Enable mock mode for local testing without backend deployment
const MOCK_API_MODE = false; // Set to true for local testing without AWS 
// Log mock mode status
if (MOCK_API_MODE) {
  console.warn('🔧 MOCK API MODE ENABLED - All API calls will use mock data. Set MOCK_API_MODE to false in api.ts when backend is deployed.');
}

interface ApiError {
  error: string;
  details?: any;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with any provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface Location {
  state: string;
  district: string;
  ruralUrban: 'rural' | 'urban';
  pincode?: string;
}

export interface CreateProfileRequest {
  phoneNumber: string;
  ageRange: '18-25' | '26-35' | '36-45' | '46-60' | '60+';
  location: Location;
  language: string;
  consentGiven: boolean;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  education?: 'no_formal' | 'primary' | 'secondary' | 'graduate' | 'postgraduate';
  occupation?: string;
  employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'student' | 'retired';
  incomeRange?: 'below_50k' | '50k_1l' | '1l_2l' | '2l_5l' | 'above_5l';
  category?: 'general' | 'obc' | 'sc' | 'st' | 'ews';
  disabilityStatus?: 'none' | 'physical' | 'visual' | 'hearing' | 'other';
  sensitiveDataConsent?: {
    category: boolean;
    disability: boolean;
    income: boolean;
  };
}

export interface UserProfile extends CreateProfileRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileResponse {
  message: string;
  profile: UserProfile;
}

export interface GetProfileResponse {
  profile: UserProfile;
}

export const profileApi = {
  create: async (data: CreateProfileRequest): Promise<CreateProfileResponse> => {
    if (MOCK_API_MODE) {
      // Mock response
      const mockProfile: UserProfile = {
        ...data,
        id: 'mock-user-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('mockUserProfile', JSON.stringify(mockProfile));
      console.log('✅ Mock profile created:', mockProfile);
      return {
        message: 'Profile created successfully (mock)',
        profile: mockProfile,
      };
    }
    return apiRequest<CreateProfileResponse>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getByPhone: async (phoneNumber: string): Promise<GetProfileResponse> => {
    if (MOCK_API_MODE) {
      const mockProfile = localStorage.getItem('mockUserProfile');
      if (mockProfile) {
        return { profile: JSON.parse(mockProfile) };
      }
      throw new Error('Profile not found');
    }
    const encodedPhone = encodeURIComponent(phoneNumber);
    return apiRequest<GetProfileResponse>(`/profiles/phone/${encodedPhone}`);
  },

  getById: async (userId: string): Promise<GetProfileResponse> => {
    if (MOCK_API_MODE) {
      const mockProfile = localStorage.getItem('mockUserProfile');
      if (mockProfile) {
        return { profile: JSON.parse(mockProfile) };
      }
      throw new Error('Profile not found');
    }
    return apiRequest<GetProfileResponse>(`/profiles/${userId}`);
  },

  update: async (userId: string, data: Partial<CreateProfileRequest>): Promise<CreateProfileResponse> => {
    if (MOCK_API_MODE) {
      const mockProfile = localStorage.getItem('mockUserProfile');
      if (mockProfile) {
        const updated = { ...JSON.parse(mockProfile), ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem('mockUserProfile', JSON.stringify(updated));
        console.log('✅ Mock profile updated:', updated);
        return {
          message: 'Profile updated successfully (mock)',
          profile: updated,
        };
      }
      throw new Error('Profile not found');
    }
    return apiRequest<CreateProfileResponse>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Eligibility Evaluation Types
export interface EligibilityCriterion {
  id: string;
  field: string;
  operator: string;
  value: any;
  weight: number;
  description: string;
  mandatory: boolean;
}

export interface DocumentRequirement {
  type: string;
  name: string;
  mandatory: boolean;
  description: string;
  alternativeDocuments?: string[];
}

export interface CriterionEvaluationResult {
  criterion: EligibilityCriterion;
  matched: boolean;
  userValue: any;
  reason: string;
}

export interface MissingCriterion {
  criterion: EligibilityCriterion;
  explanation: string;
}

export interface MissingDocument {
  document: DocumentRequirement;
  explanation: string;
}

export interface EligibilityEvaluationResponse {
  evaluation_id: string;
  user_id: string;
  scheme_id: string;
  scheme_name: string;
  status: 'strongly_eligible' | 'conditionally_eligible' | 'needs_verification' | 'not_eligible';
  confidence_score: number;
  matched_criteria: CriterionEvaluationResult[];
  unmatched_criteria: CriterionEvaluationResult[];
  missing_criteria: MissingCriterion[];
  missing_documents: MissingDocument[];
  mandatory_criteria_met: boolean;
  reasoning: string;
  suggested_next_steps?: string[];
  evaluated_at: string;
  ai_scenarios?: Array<{
    icon: string;
    text: string;
    impact: string;
  }>;
  ai_suggestions?: string[];
}

export interface EvaluateEligibilityRequest {
  userId: string;
  schemeId: string;
  userDocuments?: string[];
  options?: {
    forceLLM?: boolean;
    skipLLM?: boolean;
    language?: string;
  };
}

export interface EvaluateEligibilityApiResponse {
  success: boolean;
  data: EligibilityEvaluationResponse;
  cached?: boolean;
  cachedAt?: string;
}

export const eligibilityApi = {
  evaluate: async (
    userId: string,
    schemeId: string,
    userDocuments?: string[],
    options?: { forceLLM?: boolean; skipLLM?: boolean; language?: string }
  ): Promise<EligibilityEvaluationResponse> => {
    if (MOCK_API_MODE) {
      // Mock eligibility evaluation
      const mockEvaluation: EligibilityEvaluationResponse = {
        evaluation_id: 'mock-eval-' + Date.now(),
        user_id: userId,
        scheme_id: schemeId,
        scheme_name: 'PM Scholarship Scheme (Mock)',
        status: 'conditionally_eligible',
        confidence_score: 75,
        matched_criteria: [],
        unmatched_criteria: [],
        missing_criteria: [],
        missing_documents: [],
        mandatory_criteria_met: true,
        reasoning: 'Based on your profile, you appear to be conditionally eligible for this scheme. You meet most of the basic criteria. Please upload required documents for verification. (This is mock data - deploy to AWS for real evaluation)',
        suggested_next_steps: [
          'Upload income certificate',
          'Upload education certificates',
          'Complete profile verification'
        ],
        evaluated_at: new Date().toISOString(),
      };
      console.log('✅ Mock eligibility evaluation:', mockEvaluation);
      return mockEvaluation;
    }
    const response = await apiRequest<EvaluateEligibilityApiResponse>('/api/v1/eligibility/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        schemeId,
        userDocuments: userDocuments || [],
        options: options || {},
      }),
    });
    return response.data;
  },

  getUserEvaluations: async (userId: string): Promise<any> => {
    if (MOCK_API_MODE) {
      return { evaluations: [] };
    }
    return apiRequest<any>(`/api/v1/eligibility/user/${userId}`);
  },

  reEvaluate: async (
    userId: string,
    schemeIds?: string[],
    userDocuments?: string[]
  ): Promise<any> => {
    if (MOCK_API_MODE) {
      return { message: 'Re-evaluation queued (mock)' };
    }
    return apiRequest<any>('/api/v1/eligibility/re-evaluate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        schemeIds: schemeIds || [],
        userDocuments: userDocuments || [],
      }),
    });
  },
};

// Document Types
export type DocumentType = 
  | 'aadhaar'
  | 'income_certificate'
  | 'caste_certificate'
  | 'education_certificate'
  | 'disability_certificate'
  | 'domicile_certificate'
  | 'other';

export interface DocumentMetadata {
  id: string;
  userId: string;
  documentType: DocumentType;
  status: 'pending' | 'uploaded' | 'processing' | 'verified' | 'rejected' | 'expired';
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  documentId: string;
  expiresIn: number;
}

export const documentApi = {
  getUploadUrl: async (
    userId: string,
    documentType: DocumentType,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<UploadUrlResponse> => {
    if (MOCK_API_MODE) {
      // Mock upload URL - simulate S3 pre-signed URL
      const mockDocumentId = 'mock-doc-' + Date.now();
      const mockDocument: DocumentMetadata = {
        id: mockDocumentId,
        userId,
        documentType,
        fileName,
        fileSize,
        mimeType,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Store in localStorage
      const existingDocs = localStorage.getItem('mockUserDocuments');
      const docs = existingDocs ? JSON.parse(existingDocs) : [];
      docs.push(mockDocument);
      localStorage.setItem('mockUserDocuments', JSON.stringify(docs));
      
      console.log('✅ Mock document upload URL generated:', mockDocumentId);
      
      // Return a mock upload URL (won't actually be used in mock mode)
      return {
        uploadUrl: 'mock://upload-url',
        documentId: mockDocumentId,
        expiresIn: 3600,
      };
    }
    return apiRequest<UploadUrlResponse>('/api/v1/documents/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        documentType,
        fileName,
        fileSize,
        mimeType,
      }),
    });
  },

  getUserDocuments: async (userId: string): Promise<{ documents: DocumentMetadata[] }> => {
    if (MOCK_API_MODE) {
      const existingDocs = localStorage.getItem('mockUserDocuments');
      const docs = existingDocs ? JSON.parse(existingDocs) : [];
      console.log('✅ Mock user documents retrieved:', docs.length);
      return { documents: docs };
    }
    return apiRequest<{ documents: DocumentMetadata[] }>(`/api/v1/documents/user/${userId}`);
  },

  getDocument: async (documentId: string): Promise<DocumentMetadata> => {
    if (MOCK_API_MODE) {
      const existingDocs = localStorage.getItem('mockUserDocuments');
      const docs = existingDocs ? JSON.parse(existingDocs) : [];
      const doc = docs.find((d: DocumentMetadata) => d.id === documentId);
      if (!doc) {
        throw new Error('Document not found');
      }
      console.log('✅ Mock document retrieved:', documentId);
      return doc;
    }
    return apiRequest<DocumentMetadata>(`/api/v1/documents/${documentId}`);
  },
};


// Scheme Discovery Types
export interface DiscoveredScheme {
  name: string;
  description: string;
  category: string;
  targetAudience: string[];
  eligibility: {
    ageRange?: string[];
    incomeLimit?: string;
    states?: string[];
    otherCriteria?: string[];
  };
  documents: string[];
  applicationMode: string;
  sourceUrl: string;
  confidence: number;
}

export interface SchemeListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  targetAudience: string[];
}

export const schemeApi = {
  discover: async (query: string, category?: string, state?: string): Promise<DiscoveredScheme[]> => {
    if (MOCK_API_MODE) {
      console.log('✅ Mock scheme discovery');
      return [];
    }
    const response = await apiRequest<{ success: boolean; data: { schemes: DiscoveredScheme[] } }>(
      '/api/v1/schemes/discover',
      {
        method: 'POST',
        body: JSON.stringify({ query, category, state }),
      }
    );
    return response.data.schemes;
  },

  add: async (scheme: DiscoveredScheme): Promise<{ schemeId: string; schemeName: string }> => {
    if (MOCK_API_MODE) {
      console.log('✅ Mock scheme added');
      return { schemeId: 'mock-scheme', schemeName: scheme.name };
    }
    const response = await apiRequest<{ success: boolean; data: { schemeId: string; schemeName: string } }>(
      '/api/v1/schemes/add',
      {
        method: 'POST',
        body: JSON.stringify({ scheme }),
      }
    );
    return response.data;
  },

  list: async (): Promise<SchemeListItem[]> => {
    if (MOCK_API_MODE) {
      console.log('✅ Mock scheme list');
      return [
        { id: 'scheme-pm-scholarship', name: 'Prime Minister Scholarship Scheme', description: '', category: 'education', targetAudience: [] },
        { id: 'scheme-skill-development', name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)', description: '', category: 'employment', targetAudience: [] },
        { id: 'scheme-widow-pension-karnataka', name: 'Karnataka Widow Pension Scheme', description: '', category: 'welfare', targetAudience: [] },
      ];
    }
    const response = await apiRequest<{ success: boolean; data: { schemes: SchemeListItem[]}}>(
      '/api/v1/schemes/list'
    );
    return response.data.schemes;
  },
};
