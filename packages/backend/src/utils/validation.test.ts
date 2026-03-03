/**
 * Unit tests for validation utilities
 */

import { validateCreateUserProfile, validateUpdateUserProfile } from './validation';
import { CreateUserProfileInput, UpdateUserProfileInput } from '../types/user-profile';

describe('validateCreateUserProfile', () => {
  const validInput: CreateUserProfileInput = {
    phoneNumber: '+919876543210',
    ageRange: '26-35',
    location: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      ruralUrban: 'urban',
    },
    language: 'en',
    consentGiven: true,
  };

  it('should validate a valid profile', () => {
    const result = validateCreateUserProfile(validInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require phone number', () => {
    const input = { ...validInput, phoneNumber: '' };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'phoneNumber',
      message: 'Phone number is required',
    });
  });

  it('should validate phone number format', () => {
    const input = { ...validInput, phoneNumber: 'invalid' };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'phoneNumber',
      message: 'Invalid phone number format',
    });
  });

  it('should require age range', () => {
    const input = { ...validInput, ageRange: undefined as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ageRange',
      message: 'Age range is required',
    });
  });

  it('should validate age range values', () => {
    const input = { ...validInput, ageRange: 'invalid' as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ageRange',
      message: 'Invalid age range',
    });
  });

  it('should require location', () => {
    const input = { ...validInput, location: undefined as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location',
      message: 'Location is required',
    });
  });

  it('should require location state', () => {
    const input = {
      ...validInput,
      location: { ...validInput.location, state: '' },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.state',
      message: 'State is required',
    });
  });

  it('should require location district', () => {
    const input = {
      ...validInput,
      location: { ...validInput.location, district: '' },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.district',
      message: 'District is required',
    });
  });

  it('should require location ruralUrban', () => {
    const input = {
      ...validInput,
      location: { ...validInput.location, ruralUrban: undefined as any },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.ruralUrban',
      message: 'Rural/Urban classification is required',
    });
  });

  it('should validate pincode format', () => {
    const input = {
      ...validInput,
      location: { ...validInput.location, pincode: 'invalid' },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.pincode',
      message: 'Invalid pincode format',
    });
  });

  it('should accept valid pincode', () => {
    const input = {
      ...validInput,
      location: { ...validInput.location, pincode: '560001' },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(true);
  });

  it('should require language', () => {
    const input = { ...validInput, language: '' };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'language',
      message: 'Language preference is required',
    });
  });

  it('should require consent', () => {
    const input = { ...validInput, consentGiven: undefined as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'consentGiven',
      message: 'Consent is required',
    });
  });

  it('should enforce consent to be true', () => {
    const input = { ...validInput, consentGiven: false };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'consentGiven',
      message: 'User must provide consent to use the platform',
    });
  });

  it('should validate optional gender field', () => {
    const input = { ...validInput, gender: 'invalid' as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'gender',
      message: 'Invalid gender value',
    });
  });

  it('should validate optional education field', () => {
    const input = { ...validInput, education: 'invalid' as any };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'education',
      message: 'Invalid education value',
    });
  });

  it('should require consent for category data', () => {
    const input = {
      ...validInput,
      category: 'sc' as any,
      sensitiveDataConsent: { category: false, disability: false, income: false },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sensitiveDataConsent.category',
      message: 'Consent required for category information',
    });
  });

  it('should require consent for disability data', () => {
    const input = {
      ...validInput,
      disabilityStatus: 'physical' as any,
      sensitiveDataConsent: { category: false, disability: false, income: false },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sensitiveDataConsent.disability',
      message: 'Consent required for disability information',
    });
  });

  it('should require consent for income data', () => {
    const input = {
      ...validInput,
      incomeRange: '1l_2l' as any,
      sensitiveDataConsent: { category: false, disability: false, income: false },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'sensitiveDataConsent.income',
      message: 'Consent required for income information',
    });
  });

  it('should accept valid profile with all optional fields', () => {
    const input: CreateUserProfileInput = {
      ...validInput,
      gender: 'male',
      education: 'graduate',
      occupation: 'Software Engineer',
      employmentStatus: 'employed',
      incomeRange: '2l_5l',
      category: 'general',
      disabilityStatus: 'none',
      interactionMode: 'text',
      explanationLevel: 'standard',
      sensitiveDataConsent: {
        category: true,
        disability: true,
        income: true,
      },
    };
    const result = validateCreateUserProfile(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateUpdateUserProfile', () => {
  const validInput: UpdateUserProfileInput = {
    id: 'user-123',
    ageRange: '26-35',
  };

  it('should validate a valid update', () => {
    const result = validateUpdateUserProfile(validInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require user ID', () => {
    const input = { ...validInput, id: '' };
    const result = validateUpdateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'id',
      message: 'User ID is required for updates',
    });
  });

  it('should validate age range if provided', () => {
    const input = { ...validInput, ageRange: 'invalid' as any };
    const result = validateUpdateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ageRange',
      message: 'Invalid age range',
    });
  });

  it('should validate location fields if provided', () => {
    const input = {
      ...validInput,
      location: {
        state: '',
        district: 'Bangalore',
        ruralUrban: 'urban' as const,
      },
    };
    const result = validateUpdateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.state',
      message: 'State cannot be empty',
    });
  });

  it('should validate pincode format if provided', () => {
    const input = {
      ...validInput,
      location: {
        state: 'Karnataka',
        district: 'Bangalore',
        ruralUrban: 'urban' as const,
        pincode: 'invalid',
      },
    };
    const result = validateUpdateUserProfile(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'location.pincode',
      message: 'Invalid pincode format',
    });
  });

  it('should accept valid update with multiple fields', () => {
    const input: UpdateUserProfileInput = {
      id: 'user-123',
      ageRange: '36-45',
      gender: 'female',
      education: 'postgraduate',
      employmentStatus: 'employed',
      language: 'hi',
    };
    const result = validateUpdateUserProfile(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
