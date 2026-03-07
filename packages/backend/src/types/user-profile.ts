/**
 * User Profile Data Model
 * 
 * Defines TypeScript interfaces for user profiles with consent tracking
 * and validation for required fields.
 */

export interface Location {
  state: string;
  district: string;
  ruralUrban: 'rural' | 'urban';
  pincode?: string;
}

export interface UserProfile {
  id: string;
  phoneNumber: string; // Primary identifier
  email?: string; // User email
  name?: string; // User name
  aadhaarHash?: string; // Hashed for privacy
  
  // Demographics
  ageRange: '18-25' | '26-35' | '36-45' | '46-60' | '60+';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location: Location;
  
  // Socioeconomic
  education?: 'no_formal' | 'primary' | 'secondary' | 'graduate' | 'postgraduate';
  occupation?: string;
  employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'student' | 'retired';
  incomeRange?: 'below_50k' | '50k_1l' | '1l_2l' | '2l_5l' | 'above_5l';
  
  // Optional (consent-based)
  category?: 'general' | 'obc' | 'sc' | 'st' | 'ews';
  disabilityStatus?: 'none' | 'physical' | 'visual' | 'hearing' | 'other';
  
  // Preferences
  language: string;
  interactionMode: 'voice' | 'text';
  explanationLevel: 'standard' | 'very_simple';
  
  // Consent tracking
  consentGiven: boolean;
  consentTimestamp?: Date;
  sensitiveDataConsent?: {
    category: boolean;
    disability: boolean;
    income: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileInput {
  phoneNumber: string;
  ageRange: UserProfile['ageRange'];
  location: Location;
  language: string;
  consentGiven: boolean;
  
  // Optional fields
  email?: string;
  name?: string;
  gender?: UserProfile['gender'];
  education?: UserProfile['education'];
  occupation?: string;
  employmentStatus?: UserProfile['employmentStatus'];
  incomeRange?: UserProfile['incomeRange'];
  category?: UserProfile['category'];
  disabilityStatus?: UserProfile['disabilityStatus'];
  interactionMode?: UserProfile['interactionMode'];
  explanationLevel?: UserProfile['explanationLevel'];
  sensitiveDataConsent?: UserProfile['sensitiveDataConsent'];
}

export interface UpdateUserProfileInput {
  id: string;
  
  // All fields optional for updates
  email?: string;
  name?: string;
  ageRange?: UserProfile['ageRange'];
  gender?: UserProfile['gender'];
  location?: Location;
  education?: UserProfile['education'];
  occupation?: string;
  employmentStatus?: UserProfile['employmentStatus'];
  incomeRange?: UserProfile['incomeRange'];
  category?: UserProfile['category'];
  disabilityStatus?: UserProfile['disabilityStatus'];
  language?: string;
  interactionMode?: UserProfile['interactionMode'];
  explanationLevel?: UserProfile['explanationLevel'];
  sensitiveDataConsent?: UserProfile['sensitiveDataConsent'];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
