/**
 * Sample User Profiles for Testing
 * 
 * This file contains sample user profiles covering various eligibility scenarios:
 * - Strongly eligible profiles (match most/all criteria)
 * - Conditionally eligible profiles (match some criteria)
 * - Not eligible profiles (fail mandatory criteria)
 * - Edge cases (missing data, ambiguous criteria)
 * 
 * These profiles are useful for testing the eligibility evaluation flow.
 */

import { UserProfile } from '../types/user-profile';

/**
 * Profile 1: Strongly Eligible for PM Scholarship
 * Young student from economically weaker section with all required attributes
 */
export const studentStronglyEligible: UserProfile = {
  id: 'user-test-001',
  phoneNumber: '+919876543210',
  ageRange: '18-25',
  gender: 'female',
  location: {
    state: 'Karnataka',
    district: 'Bangalore Urban',
    ruralUrban: 'urban',
    pincode: '560001',
  },
  education: 'graduate',
  occupation: 'Student',
  employmentStatus: 'student',
  incomeRange: 'below_50k',
  category: 'sc',
  disabilityStatus: 'none',
  language: 'en',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-15T10:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
};

/**
 * Profile 2: Strongly Eligible for Skill Development
 * Unemployed rural youth seeking skill training
 */
export const unemployedRuralYouth: UserProfile = {
  id: 'user-test-002',
  phoneNumber: '+919876543211',
  ageRange: '26-35',
  gender: 'male',
  location: {
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    ruralUrban: 'rural',
    pincode: '221001',
  },
  education: 'secondary',
  occupation: 'None',
  employmentStatus: 'unemployed',
  incomeRange: '50k_1l',
  category: 'obc',
  disabilityStatus: 'none',
  language: 'hi',
  interactionMode: 'voice',
  explanationLevel: 'very_simple',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-16T11:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-16T11:00:00Z'),
  updatedAt: new Date('2024-01-16T11:00:00Z'),
};

/**
 * Profile 3: Strongly Eligible for Widow Pension (Karnataka)
 * Widow from Karnataka with low income
 */
export const widowKarnatakaEligible: UserProfile = {
  id: 'user-test-003',
  phoneNumber: '+919876543212',
  ageRange: '46-60',
  gender: 'female',
  location: {
    state: 'Karnataka',
    district: 'Mysore',
    ruralUrban: 'rural',
    pincode: '570001',
  },
  education: 'primary',
  occupation: 'Daily wage worker',
  employmentStatus: 'self_employed',
  incomeRange: 'below_50k',
  category: 'st',
  disabilityStatus: 'none',
  language: 'kn',
  interactionMode: 'voice',
  explanationLevel: 'very_simple',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-17T09:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-17T09:00:00Z'),
  updatedAt: new Date('2024-01-17T09:00:00Z'),
};

/**
 * Profile 4: Conditionally Eligible for PM Scholarship
 * Student with higher income (borderline case)
 */
export const studentConditionalIncome: UserProfile = {
  id: 'user-test-004',
  phoneNumber: '+919876543213',
  ageRange: '18-25',
  gender: 'male',
  location: {
    state: 'Maharashtra',
    district: 'Mumbai',
    ruralUrban: 'urban',
    pincode: '400001',
  },
  education: 'graduate',
  occupation: 'Student',
  employmentStatus: 'student',
  incomeRange: '2l_5l', // Above threshold for PM Scholarship
  category: 'general',
  disabilityStatus: 'physical',
  language: 'en',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-18T10:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-18T10:00:00Z'),
  updatedAt: new Date('2024-01-18T10:00:00Z'),
};

/**
 * Profile 5: Not Eligible for PM Scholarship (employed, not a student)
 * But potentially eligible for Skill Development
 */
export const employedProfessional: UserProfile = {
  id: 'user-test-005',
  phoneNumber: '+919876543214',
  ageRange: '26-35',
  gender: 'female',
  location: {
    state: 'Tamil Nadu',
    district: 'Chennai',
    ruralUrban: 'urban',
    pincode: '600001',
  },
  education: 'postgraduate',
  occupation: 'Software Engineer',
  employmentStatus: 'employed',
  incomeRange: 'above_5l',
  category: 'general',
  disabilityStatus: 'none',
  language: 'ta',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-19T10:00:00Z'),
  sensitiveDataConsent: {
    category: false,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-19T10:00:00Z'),
  updatedAt: new Date('2024-01-19T10:00:00Z'),
};

/**
 * Profile 6: Edge Case - Missing Critical Data
 * Missing income and employment status (ambiguous eligibility)
 */
export const missingDataProfile: UserProfile = {
  id: 'user-test-006',
  phoneNumber: '+919876543215',
  ageRange: '18-25',
  gender: 'other',
  location: {
    state: 'West Bengal',
    district: 'Kolkata',
    ruralUrban: 'urban',
    pincode: '700001',
  },
  education: 'secondary',
  // Missing: occupation, employmentStatus, incomeRange, category
  disabilityStatus: 'none',
  language: 'en',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-20T10:00:00Z'),
  sensitiveDataConsent: {
    category: false,
    disability: true,
    income: false,
  },
  createdAt: new Date('2024-01-20T10:00:00Z'),
  updatedAt: new Date('2024-01-20T10:00:00Z'),
};

/**
 * Profile 7: Edge Case - Older Age, Self-Employed
 * Conditionally eligible for Skill Development (age boundary)
 */
export const olderSelfEmployed: UserProfile = {
  id: 'user-test-007',
  phoneNumber: '+919876543216',
  ageRange: '36-45',
  gender: 'male',
  location: {
    state: 'Rajasthan',
    district: 'Jaipur',
    ruralUrban: 'urban',
    pincode: '302001',
  },
  education: 'no_formal',
  occupation: 'Street vendor',
  employmentStatus: 'self_employed',
  incomeRange: 'below_50k',
  category: 'obc',
  disabilityStatus: 'none',
  language: 'hi',
  interactionMode: 'voice',
  explanationLevel: 'very_simple',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-21T10:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-21T10:00:00Z'),
  updatedAt: new Date('2024-01-21T10:00:00Z'),
};

/**
 * Profile 8: Not Eligible for Widow Pension (wrong state)
 * Female from low income but not in Karnataka
 */
export const widowWrongState: UserProfile = {
  id: 'user-test-008',
  phoneNumber: '+919876543217',
  ageRange: '46-60',
  gender: 'female',
  location: {
    state: 'Gujarat',
    district: 'Ahmedabad',
    ruralUrban: 'rural',
    pincode: '380001',
  },
  education: 'primary',
  occupation: 'Homemaker',
  employmentStatus: 'unemployed',
  incomeRange: 'below_50k',
  category: 'general',
  disabilityStatus: 'none',
  language: 'gu',
  interactionMode: 'voice',
  explanationLevel: 'very_simple',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-22T10:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-22T10:00:00Z'),
  updatedAt: new Date('2024-01-22T10:00:00Z'),
};

/**
 * Profile 9: Edge Case - Senior Citizen, Retired
 * Not eligible for most schemes but edge case for testing
 */
export const seniorCitizenRetired: UserProfile = {
  id: 'user-test-009',
  phoneNumber: '+919876543218',
  ageRange: '60+',
  gender: 'male',
  location: {
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    ruralUrban: 'urban',
    pincode: '695001',
  },
  education: 'graduate',
  occupation: 'Retired government employee',
  employmentStatus: 'retired',
  incomeRange: '1l_2l',
  category: 'general',
  disabilityStatus: 'visual',
  language: 'ml',
  interactionMode: 'voice',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-23T10:00:00Z'),
  sensitiveDataConsent: {
    category: true,
    disability: true,
    income: true,
  },
  createdAt: new Date('2024-01-23T10:00:00Z'),
  updatedAt: new Date('2024-01-23T10:00:00Z'),
};

/**
 * Profile 10: Edge Case - No Consent for Sensitive Data
 * Limited eligibility evaluation due to missing consent
 */
export const limitedConsentProfile: UserProfile = {
  id: 'user-test-010',
  phoneNumber: '+919876543219',
  ageRange: '26-35',
  gender: 'prefer_not_to_say',
  location: {
    state: 'Delhi',
    district: 'Central Delhi',
    ruralUrban: 'urban',
    pincode: '110001',
  },
  education: 'graduate',
  occupation: 'Freelancer',
  employmentStatus: 'self_employed',
  // User did not provide income, category due to no consent
  disabilityStatus: 'none',
  language: 'en',
  interactionMode: 'text',
  explanationLevel: 'standard',
  consentGiven: true,
  consentTimestamp: new Date('2024-01-24T10:00:00Z'),
  sensitiveDataConsent: {
    category: false,
    disability: true,
    income: false,
  },
  createdAt: new Date('2024-01-24T10:00:00Z'),
  updatedAt: new Date('2024-01-24T10:00:00Z'),
};

/**
 * All sample user profiles
 */
export const sampleUserProfiles: UserProfile[] = [
  studentStronglyEligible,
  unemployedRuralYouth,
  widowKarnatakaEligible,
  studentConditionalIncome,
  employedProfessional,
  missingDataProfile,
  olderSelfEmployed,
  widowWrongState,
  seniorCitizenRetired,
  limitedConsentProfile,
];

/**
 * Helper function to get profile by ID
 */
export function getProfileById(id: string): UserProfile | undefined {
  return sampleUserProfiles.find(profile => profile.id === id);
}

/**
 * Helper function to get profiles by eligibility scenario
 */
export function getProfilesByScenario(scenario: 'strongly_eligible' | 'conditionally_eligible' | 'not_eligible' | 'edge_case'): UserProfile[] {
  switch (scenario) {
    case 'strongly_eligible':
      return [studentStronglyEligible, unemployedRuralYouth, widowKarnatakaEligible];
    case 'conditionally_eligible':
      return [studentConditionalIncome, olderSelfEmployed];
    case 'not_eligible':
      return [employedProfessional, widowWrongState, seniorCitizenRetired];
    case 'edge_case':
      return [missingDataProfile, limitedConsentProfile];
    default:
      return [];
  }
}
