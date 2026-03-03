# Sample User Profiles for Testing

This directory contains sample user profiles designed to test various eligibility scenarios in the Eligibility MVP system.

## Overview

The sample profiles cover:
- **Strongly eligible** profiles that match most/all criteria for specific schemes
- **Conditionally eligible** profiles that match some criteria but may have borderline cases
- **Not eligible** profiles that fail mandatory criteria
- **Edge cases** with missing data, ambiguous criteria, or consent limitations

## Profile Categories

### Strongly Eligible Profiles

#### 1. Student Strongly Eligible (`user-test-001`)
- **Target Scheme:** PM Scholarship Scheme
- **Key Attributes:**
  - Age: 18-25
  - Employment: Student
  - Education: Graduate
  - Income: Below ₹50k
  - Category: SC
- **Expected Result:** High confidence eligibility for PM Scholarship

#### 2. Unemployed Rural Youth (`user-test-002`)
- **Target Scheme:** Skill Development (PMKVY)
- **Key Attributes:**
  - Age: 26-35
  - Employment: Unemployed
  - Location: Rural Uttar Pradesh
  - Education: Secondary
  - Income: ₹50k-₹1L
- **Expected Result:** High confidence eligibility for Skill Development

#### 3. Widow Karnataka Eligible (`user-test-003`)
- **Target Scheme:** Karnataka Widow Pension
- **Key Attributes:**
  - Age: 46-60
  - Gender: Female
  - Location: Karnataka (Mysore)
  - Income: Below ₹50k
  - Category: ST
- **Expected Result:** High confidence eligibility for Widow Pension (requires death certificate)

### Conditionally Eligible Profiles

#### 4. Student Conditional Income (`user-test-004`)
- **Target Scheme:** PM Scholarship (borderline)
- **Key Attributes:**
  - Age: 18-25
  - Employment: Student
  - Income: ₹2L-₹5L (above threshold)
  - Disability: Physical
- **Expected Result:** Low confidence for PM Scholarship due to income, but may qualify under disability quota

#### 5. Older Self-Employed (`user-test-007`)
- **Target Scheme:** Skill Development (age boundary)
- **Key Attributes:**
  - Age: 36-45 (upper limit)
  - Employment: Self-employed
  - Education: No formal education
  - Income: Below ₹50k
- **Expected Result:** Conditional eligibility for Skill Development (age boundary case)

### Not Eligible Profiles

#### 6. Employed Professional (`user-test-005`)
- **Target Scheme:** PM Scholarship (not eligible)
- **Key Attributes:**
  - Age: 26-35
  - Employment: Employed (Software Engineer)
  - Income: Above ₹5L
  - Education: Postgraduate
- **Expected Result:** Not eligible for PM Scholarship (employed, high income)

#### 7. Widow Wrong State (`user-test-008`)
- **Target Scheme:** Karnataka Widow Pension (not eligible)
- **Key Attributes:**
  - Gender: Female
  - Location: Gujarat (not Karnataka)
  - Income: Below ₹50k
- **Expected Result:** Not eligible for Karnataka-specific scheme

#### 8. Senior Citizen Retired (`user-test-009`)
- **Target Scheme:** Youth schemes (not eligible)
- **Key Attributes:**
  - Age: 60+
  - Employment: Retired
  - Disability: Visual
- **Expected Result:** Not eligible for youth-focused schemes

### Edge Cases

#### 9. Missing Data Profile (`user-test-006`)
- **Key Attributes:**
  - Missing: Employment status, income range, category
  - Consent: No consent for income and category data
- **Expected Result:** Ambiguous eligibility, system should request missing information

#### 10. Limited Consent Profile (`user-test-010`)
- **Key Attributes:**
  - No consent for category and income data
  - Gender: Prefer not to say
- **Expected Result:** Limited eligibility evaluation, system should explain data limitations

## Usage Examples

### Import Profiles

```typescript
import {
  sampleUserProfiles,
  getProfileById,
  getProfilesByScenario,
  studentStronglyEligible,
} from './sample-user-profiles';
```

### Get All Profiles

```typescript
// Get all 10 sample profiles
const allProfiles = sampleUserProfiles;
```

### Get Profile by ID

```typescript
// Get specific profile
const profile = getProfileById('user-test-001');
```

### Get Profiles by Scenario

```typescript
// Get strongly eligible profiles
const stronglyEligible = getProfilesByScenario('strongly_eligible');

// Get conditionally eligible profiles
const conditionallyEligible = getProfilesByScenario('conditionally_eligible');

// Get not eligible profiles
const notEligible = getProfilesByScenario('not_eligible');

// Get edge case profiles
const edgeCases = getProfilesByScenario('edge_case');
```

### Testing Eligibility Evaluation

```typescript
import { evaluateEligibility } from '../services/rule-evaluation-engine';
import { pmScholarshipRule } from './sample-eligibility-rules';
import { studentStronglyEligible } from './sample-user-profiles';

// Test eligibility evaluation
const result = await evaluateEligibility(
  studentStronglyEligible,
  pmScholarshipRule
);

console.log(result.eligibilityStatus); // Expected: 'strongly_eligible'
console.log(result.confidenceScore); // Expected: > 0.8
```

## Testing Scenarios

### Scenario 1: Strong Match
Test with `studentStronglyEligible` against `pmScholarshipRule`:
- Should return high confidence score (>80%)
- Should match all mandatory criteria
- Should identify required documents

### Scenario 2: Partial Match
Test with `studentConditionalIncome` against `pmScholarshipRule`:
- Should return medium confidence score (40-60%)
- Should identify income as a barrier
- Should suggest alternative schemes or disability quota

### Scenario 3: No Match
Test with `employedProfessional` against `pmScholarshipRule`:
- Should return low confidence score (<30%)
- Should clearly explain why not eligible
- Should suggest more appropriate schemes

### Scenario 4: Missing Data
Test with `missingDataProfile` against any scheme:
- Should identify missing mandatory fields
- Should request specific information
- Should explain impact on eligibility determination

### Scenario 5: Multi-Scheme Evaluation
Test same profile against all three schemes:
```typescript
const schemes = [pmScholarshipRule, skillDevelopmentRule, widowPensionRule];
const results = await Promise.all(
  schemes.map(scheme => evaluateEligibility(unemployedRuralYouth, scheme))
);
// Should show high confidence for Skill Development
// Should show low confidence for PM Scholarship and Widow Pension
```

## Data Coverage

The sample profiles provide comprehensive coverage:

- **Age Ranges:** All 5 ranges (18-25, 26-35, 36-45, 46-60, 60+)
- **States:** 8+ different states across India
- **Rural/Urban:** Both rural and urban locations
- **Employment:** Student, unemployed, employed, self-employed, retired
- **Income:** All 5 income brackets
- **Education:** All levels from no formal to postgraduate
- **Categories:** SC, ST, OBC, EWS, General
- **Disabilities:** None, physical, visual
- **Consent Levels:** Full consent, partial consent, no consent for sensitive data

## Integration with Tests

These profiles are used in:
1. **Unit tests** for rule evaluation engine
2. **Integration tests** for eligibility API endpoints
3. **End-to-end tests** for complete evaluation flow
4. **Manual testing** via frontend interface

## Maintenance

When adding new schemes or criteria:
1. Review if existing profiles cover the new scenarios
2. Add new profiles if needed to test edge cases
3. Update this README with new profile descriptions
4. Ensure tests validate the new profiles

## Related Files

- `sample-user-profiles.ts` - Profile definitions
- `sample-user-profiles.test.ts` - Profile validation tests
- `sample-eligibility-rules.ts` - Scheme rules for testing
- `../services/rule-evaluation-engine.ts` - Evaluation logic
- `../handlers/eligibility-handler.ts` - API handler using these profiles
