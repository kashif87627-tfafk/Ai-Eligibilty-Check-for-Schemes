/**
 * Unit Tests for Sample User Profiles
 * 
 * Validates that sample profiles are correctly structured and cover
 * various eligibility scenarios for testing purposes.
 */

import { describe, it, expect } from '@jest/globals';
import {
  sampleUserProfiles,
  getProfileById,
  getProfilesByScenario,
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
} from './sample-user-profiles';

describe('Sample User Profiles', () => {
  describe('Profile Structure Validation', () => {
    it('should have 10 sample profiles', () => {
      expect(sampleUserProfiles).toHaveLength(10);
    });

    it('should have all required fields for each profile', () => {
      sampleUserProfiles.forEach(profile => {
        expect(profile.id).toBeDefined();
        expect(profile.phoneNumber).toBeDefined();
        expect(profile.ageRange).toBeDefined();
        expect(profile.location).toBeDefined();
        expect(profile.location.state).toBeDefined();
        expect(profile.location.district).toBeDefined();
        expect(profile.location.ruralUrban).toBeDefined();
        expect(profile.language).toBeDefined();
        expect(profile.consentGiven).toBe(true);
        expect(profile.createdAt).toBeInstanceOf(Date);
        expect(profile.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should have unique IDs for all profiles', () => {
      const ids = sampleUserProfiles.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(sampleUserProfiles.length);
    });

    it('should have unique phone numbers for all profiles', () => {
      const phones = sampleUserProfiles.map(p => p.phoneNumber);
      const uniquePhones = new Set(phones);
      expect(uniquePhones.size).toBe(sampleUserProfiles.length);
    });
  });

  describe('Strongly Eligible Profiles', () => {
    it('should have student profile eligible for PM Scholarship', () => {
      expect(studentStronglyEligible.ageRange).toBe('18-25');
      expect(studentStronglyEligible.employmentStatus).toBe('student');
      expect(studentStronglyEligible.education).toBe('graduate');
      expect(studentStronglyEligible.incomeRange).toBe('below_50k');
      expect(studentStronglyEligible.category).toBe('sc');
    });

    it('should have unemployed rural youth eligible for Skill Development', () => {
      expect(unemployedRuralYouth.employmentStatus).toBe('unemployed');
      expect(unemployedRuralYouth.location.ruralUrban).toBe('rural');
      expect(['18-25', '26-35', '36-45']).toContain(unemployedRuralYouth.ageRange);
    });

    it('should have widow profile eligible for Karnataka Widow Pension', () => {
      expect(widowKarnatakaEligible.gender).toBe('female');
      expect(widowKarnatakaEligible.location.state).toBe('Karnataka');
      expect(widowKarnatakaEligible.incomeRange).toBe('below_50k');
    });
  });

  describe('Conditionally Eligible Profiles', () => {
    it('should have student with higher income (borderline case)', () => {
      expect(studentConditionalIncome.employmentStatus).toBe('student');
      expect(studentConditionalIncome.incomeRange).toBe('2l_5l'); // Above PM Scholarship threshold
      expect(studentConditionalIncome.disabilityStatus).toBe('physical'); // May qualify for disability quota
    });

    it('should have older self-employed person (age boundary)', () => {
      expect(olderSelfEmployed.ageRange).toBe('36-45'); // Upper age limit for Skill Development
      expect(olderSelfEmployed.employmentStatus).toBe('self_employed');
      expect(olderSelfEmployed.education).toBe('no_formal');
    });
  });

  describe('Not Eligible Profiles', () => {
    it('should have employed professional not eligible for PM Scholarship', () => {
      expect(employedProfessional.employmentStatus).toBe('employed');
      expect(employedProfessional.incomeRange).toBe('above_5l');
      expect(employedProfessional.education).toBe('postgraduate');
    });

    it('should have widow from wrong state for Karnataka scheme', () => {
      expect(widowWrongState.gender).toBe('female');
      expect(widowWrongState.location.state).not.toBe('Karnataka');
      expect(widowWrongState.incomeRange).toBe('below_50k');
    });

    it('should have senior citizen not eligible for youth schemes', () => {
      expect(seniorCitizenRetired.ageRange).toBe('60+');
      expect(seniorCitizenRetired.employmentStatus).toBe('retired');
    });
  });

  describe('Edge Cases', () => {
    it('should have profile with missing critical data', () => {
      expect(missingDataProfile.employmentStatus).toBeUndefined();
      expect(missingDataProfile.incomeRange).toBeUndefined();
      expect(missingDataProfile.category).toBeUndefined();
      expect(missingDataProfile.sensitiveDataConsent?.income).toBe(false);
    });

    it('should have profile with limited consent', () => {
      expect(limitedConsentProfile.sensitiveDataConsent?.category).toBe(false);
      expect(limitedConsentProfile.sensitiveDataConsent?.income).toBe(false);
      expect(limitedConsentProfile.incomeRange).toBeUndefined();
      expect(limitedConsentProfile.category).toBeUndefined();
    });
  });

  describe('Helper Functions', () => {
    it('should retrieve profile by ID', () => {
      const profile = getProfileById('user-test-001');
      expect(profile).toBeDefined();
      expect(profile?.id).toBe('user-test-001');
      expect(profile?.phoneNumber).toBe('+919876543210');
    });

    it('should return undefined for non-existent ID', () => {
      const profile = getProfileById('non-existent-id');
      expect(profile).toBeUndefined();
    });

    it('should retrieve strongly eligible profiles', () => {
      const profiles = getProfilesByScenario('strongly_eligible');
      expect(profiles).toHaveLength(3);
      expect(profiles).toContain(studentStronglyEligible);
      expect(profiles).toContain(unemployedRuralYouth);
      expect(profiles).toContain(widowKarnatakaEligible);
    });

    it('should retrieve conditionally eligible profiles', () => {
      const profiles = getProfilesByScenario('conditionally_eligible');
      expect(profiles).toHaveLength(2);
      expect(profiles).toContain(studentConditionalIncome);
      expect(profiles).toContain(olderSelfEmployed);
    });

    it('should retrieve not eligible profiles', () => {
      const profiles = getProfilesByScenario('not_eligible');
      expect(profiles).toHaveLength(3);
      expect(profiles).toContain(employedProfessional);
      expect(profiles).toContain(widowWrongState);
      expect(profiles).toContain(seniorCitizenRetired);
    });

    it('should retrieve edge case profiles', () => {
      const profiles = getProfilesByScenario('edge_case');
      expect(profiles).toHaveLength(2);
      expect(profiles).toContain(missingDataProfile);
      expect(profiles).toContain(limitedConsentProfile);
    });
  });

  describe('Data Diversity', () => {
    it('should cover multiple age ranges', () => {
      const ageRanges = new Set(sampleUserProfiles.map(p => p.ageRange));
      expect(ageRanges.size).toBeGreaterThanOrEqual(4);
      expect(ageRanges.has('18-25')).toBe(true);
      expect(ageRanges.has('26-35')).toBe(true);
      expect(ageRanges.has('60+')).toBe(true);
    });

    it('should cover multiple states', () => {
      const states = new Set(sampleUserProfiles.map(p => p.location.state));
      expect(states.size).toBeGreaterThanOrEqual(7);
    });

    it('should cover both rural and urban locations', () => {
      const ruralProfiles = sampleUserProfiles.filter(p => p.location.ruralUrban === 'rural');
      const urbanProfiles = sampleUserProfiles.filter(p => p.location.ruralUrban === 'urban');
      expect(ruralProfiles.length).toBeGreaterThan(0);
      expect(urbanProfiles.length).toBeGreaterThan(0);
    });

    it('should cover multiple employment statuses', () => {
      const employmentStatuses = new Set(
        sampleUserProfiles
          .filter(p => p.employmentStatus)
          .map(p => p.employmentStatus)
      );
      expect(employmentStatuses.size).toBeGreaterThanOrEqual(4);
    });

    it('should cover multiple income ranges', () => {
      const incomeRanges = new Set(
        sampleUserProfiles
          .filter(p => p.incomeRange)
          .map(p => p.incomeRange)
      );
      expect(incomeRanges.size).toBeGreaterThanOrEqual(4);
    });

    it('should include profiles with and without category', () => {
      const withCategory = sampleUserProfiles.filter(p => p.category);
      const withoutCategory = sampleUserProfiles.filter(p => !p.category);
      expect(withCategory.length).toBeGreaterThan(0);
      expect(withoutCategory.length).toBeGreaterThan(0);
    });

    it('should include profiles with different disability statuses', () => {
      const withDisability = sampleUserProfiles.filter(
        p => p.disabilityStatus && p.disabilityStatus !== 'none'
      );
      const withoutDisability = sampleUserProfiles.filter(
        p => p.disabilityStatus === 'none'
      );
      expect(withDisability.length).toBeGreaterThan(0);
      expect(withoutDisability.length).toBeGreaterThan(0);
    });
  });

  describe('Consent Tracking', () => {
    it('should have all profiles with consent given', () => {
      sampleUserProfiles.forEach(profile => {
        expect(profile.consentGiven).toBe(true);
        expect(profile.consentTimestamp).toBeInstanceOf(Date);
      });
    });

    it('should have profiles with varying sensitive data consent', () => {
      const fullConsent = sampleUserProfiles.filter(
        p => p.sensitiveDataConsent?.category &&
             p.sensitiveDataConsent?.income &&
             p.sensitiveDataConsent?.disability
      );
      const partialConsent = sampleUserProfiles.filter(
        p => p.sensitiveDataConsent &&
             (!p.sensitiveDataConsent.category ||
              !p.sensitiveDataConsent.income ||
              !p.sensitiveDataConsent.disability)
      );
      expect(fullConsent.length).toBeGreaterThan(0);
      expect(partialConsent.length).toBeGreaterThan(0);
    });
  });
});
