/**
 * Validation utilities for user profile data
 */

import { CreateUserProfileInput, UpdateUserProfileInput, ValidationError, ValidationResult } from '../types/user-profile';

const VALID_AGE_RANGES = ['18-25', '26-35', '36-45', '46-60', '60+'];
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const VALID_RURAL_URBAN = ['rural', 'urban'];
const VALID_EDUCATION = ['no_formal', 'primary', 'secondary', 'graduate', 'postgraduate'];
const VALID_EMPLOYMENT_STATUS = ['employed', 'unemployed', 'self_employed', 'student', 'retired'];
const VALID_INCOME_RANGES = ['below_50k', '50k_1l', '1l_2l', '2l_5l', 'above_5l'];
const VALID_CATEGORIES = ['general', 'obc', 'sc', 'st', 'ews'];
const VALID_DISABILITY_STATUS = ['none', 'physical', 'visual', 'hearing', 'other'];
const VALID_INTERACTION_MODES = ['voice', 'text'];
const VALID_EXPLANATION_LEVELS = ['standard', 'very_simple'];

const PHONE_NUMBER_REGEX = /^\+?[1-9]\d{9,14}$/;
const PINCODE_REGEX = /^\d{6}$/;

export function validateCreateUserProfile(input: CreateUserProfileInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!input.phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!PHONE_NUMBER_REGEX.test(input.phoneNumber)) {
    // Allow UUID format as fallback (for email-based authentication)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(input.phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Invalid phone number format' });
    }
  }

  if (!input.ageRange) {
    errors.push({ field: 'ageRange', message: 'Age range is required' });
  } else if (!VALID_AGE_RANGES.includes(input.ageRange)) {
    errors.push({ field: 'ageRange', message: 'Invalid age range' });
  }

  if (!input.location) {
    errors.push({ field: 'location', message: 'Location is required' });
  } else {
    if (!input.location.state) {
      errors.push({ field: 'location.state', message: 'State is required' });
    }
    if (!input.location.district) {
      errors.push({ field: 'location.district', message: 'District is required' });
    }
    if (!input.location.ruralUrban) {
      errors.push({ field: 'location.ruralUrban', message: 'Rural/Urban classification is required' });
    } else if (!VALID_RURAL_URBAN.includes(input.location.ruralUrban)) {
      errors.push({ field: 'location.ruralUrban', message: 'Invalid rural/urban classification' });
    }
    if (input.location.pincode && !PINCODE_REGEX.test(input.location.pincode)) {
      errors.push({ field: 'location.pincode', message: 'Invalid pincode format' });
    }
  }

  if (!input.language) {
    errors.push({ field: 'language', message: 'Language preference is required' });
  }

  if (input.consentGiven === undefined || input.consentGiven === null) {
    errors.push({ field: 'consentGiven', message: 'Consent is required' });
  } else if (!input.consentGiven) {
    errors.push({ field: 'consentGiven', message: 'User must provide consent to use the platform' });
  }

  // Optional fields validation
  if (input.gender && !VALID_GENDERS.includes(input.gender)) {
    errors.push({ field: 'gender', message: 'Invalid gender value' });
  }

  if (input.education && !VALID_EDUCATION.includes(input.education)) {
    errors.push({ field: 'education', message: 'Invalid education value' });
  }

  if (input.employmentStatus && !VALID_EMPLOYMENT_STATUS.includes(input.employmentStatus)) {
    errors.push({ field: 'employmentStatus', message: 'Invalid employment status' });
  }

  if (input.incomeRange && !VALID_INCOME_RANGES.includes(input.incomeRange)) {
    errors.push({ field: 'incomeRange', message: 'Invalid income range' });
  }

  if (input.category && !VALID_CATEGORIES.includes(input.category)) {
    errors.push({ field: 'category', message: 'Invalid category value' });
  }

  if (input.disabilityStatus && !VALID_DISABILITY_STATUS.includes(input.disabilityStatus)) {
    errors.push({ field: 'disabilityStatus', message: 'Invalid disability status' });
  }

  if (input.interactionMode && !VALID_INTERACTION_MODES.includes(input.interactionMode)) {
    errors.push({ field: 'interactionMode', message: 'Invalid interaction mode' });
  }

  if (input.explanationLevel && !VALID_EXPLANATION_LEVELS.includes(input.explanationLevel)) {
    errors.push({ field: 'explanationLevel', message: 'Invalid explanation level' });
  }

  // Consent validation for sensitive data
  if (input.category && (!input.sensitiveDataConsent || !input.sensitiveDataConsent.category)) {
    errors.push({ field: 'sensitiveDataConsent.category', message: 'Consent required for category information' });
  }

  if (input.disabilityStatus && input.disabilityStatus !== 'none' && 
      (!input.sensitiveDataConsent || !input.sensitiveDataConsent.disability)) {
    errors.push({ field: 'sensitiveDataConsent.disability', message: 'Consent required for disability information' });
  }

  if (input.incomeRange && (!input.sensitiveDataConsent || !input.sensitiveDataConsent.income)) {
    errors.push({ field: 'sensitiveDataConsent.income', message: 'Consent required for income information' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateUserProfile(input: UpdateUserProfileInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.id) {
    errors.push({ field: 'id', message: 'User ID is required for updates' });
  }

  // Validate optional fields if provided
  if (input.ageRange && !VALID_AGE_RANGES.includes(input.ageRange)) {
    errors.push({ field: 'ageRange', message: 'Invalid age range' });
  }

  if (input.gender && !VALID_GENDERS.includes(input.gender)) {
    errors.push({ field: 'gender', message: 'Invalid gender value' });
  }

  if (input.location) {
    if (input.location.state !== undefined && !input.location.state.trim()) {
      errors.push({ field: 'location.state', message: 'State cannot be empty' });
    }
    if (input.location.district !== undefined && !input.location.district.trim()) {
      errors.push({ field: 'location.district', message: 'District cannot be empty' });
    }
    if (input.location.ruralUrban && !VALID_RURAL_URBAN.includes(input.location.ruralUrban)) {
      errors.push({ field: 'location.ruralUrban', message: 'Invalid rural/urban classification' });
    }
    if (input.location.pincode && !PINCODE_REGEX.test(input.location.pincode)) {
      errors.push({ field: 'location.pincode', message: 'Invalid pincode format' });
    }
  }

  if (input.education && !VALID_EDUCATION.includes(input.education)) {
    errors.push({ field: 'education', message: 'Invalid education value' });
  }

  if (input.employmentStatus && !VALID_EMPLOYMENT_STATUS.includes(input.employmentStatus)) {
    errors.push({ field: 'employmentStatus', message: 'Invalid employment status' });
  }

  if (input.incomeRange && !VALID_INCOME_RANGES.includes(input.incomeRange)) {
    errors.push({ field: 'incomeRange', message: 'Invalid income range' });
  }

  if (input.category && !VALID_CATEGORIES.includes(input.category)) {
    errors.push({ field: 'category', message: 'Invalid category value' });
  }

  if (input.disabilityStatus && !VALID_DISABILITY_STATUS.includes(input.disabilityStatus)) {
    errors.push({ field: 'disabilityStatus', message: 'Invalid disability status' });
  }

  if (input.interactionMode && !VALID_INTERACTION_MODES.includes(input.interactionMode)) {
    errors.push({ field: 'interactionMode', message: 'Invalid interaction mode' });
  }

  if (input.explanationLevel && !VALID_EXPLANATION_LEVELS.includes(input.explanationLevel)) {
    errors.push({ field: 'explanationLevel', message: 'Invalid explanation level' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
