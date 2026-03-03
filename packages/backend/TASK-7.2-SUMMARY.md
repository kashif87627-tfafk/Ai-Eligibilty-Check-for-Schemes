# Task 7.2: Document Gap Detection - Implementation Summary

## Overview
Implemented document gap detection functionality that compares user documents against scheme requirements, identifies missing documents, and provides prioritized guidance for obtaining them.

## Requirements Addressed
- **FR-7.2**: The system must detect document gaps contextually based on scheme requirements
- **FR-2.4**: The system must identify missing criteria or documents that prevent eligibility

## Implementation Details

### 1. Core Service: `document-gap-detection.ts`

Created a comprehensive document gap detection service with the following features:

#### Key Functions

**`detectDocumentGaps(schemeRequirements, userDocuments)`**
- Compares user documents against scheme requirements
- Identifies missing mandatory and optional documents
- Handles alternative documents (e.g., salary slip instead of income certificate)
- Normalizes document types for flexible matching
- Calculates completion percentage
- Returns prioritized list of missing documents

**`generateDocumentGapSummary(gapResult)`**
- Creates human-readable summary of document gaps
- Highlights mandatory vs optional missing documents
- Shows completion percentage

**`getDocumentActionSteps(missingDocuments, maxSteps)`**
- Generates actionable steps for obtaining missing documents
- Prioritizes mandatory documents over optional
- Includes location information for obtaining documents
- Limits output to most important steps

#### Features

1. **Document Type Normalization**
   - Handles variations in naming (e.g., "caste" vs "caste_certificate")
   - Case-insensitive matching
   - Removes common suffixes (_certificate, _card)

2. **Alternative Document Support**
   - Accepts alternative documents as specified in requirements
   - Example: Income certificate OR salary slip OR bank statement

3. **Priority System**
   - Priority 1: Mandatory documents
   - Priority 2: Optional documents without alternatives
   - Priority 3: Optional documents with alternatives

4. **Location Guidance**
   - Provides suggested locations for obtaining common documents
   - Examples: "UIDAI Enrollment Center" for Aadhaar, "Tehsil Office" for income certificate

### 2. Integration with Eligibility Handler

Updated `eligibility-handler.ts` to include document gap information in all eligibility evaluation responses:

#### Changes Made

1. **Added Import**
   ```typescript
   import {
     detectDocumentGaps,
     generateDocumentGapSummary,
     getDocumentActionSteps,
     DocumentGapResult
   } from '../services/document-gap-detection';
   ```

2. **New Helper Function**
   ```typescript
   function analyzeDocumentGaps(rule, userDocuments): DocumentGapResult
   ```

3. **Enhanced Response Structure**
   - All evaluation responses now include `document_gaps` object with:
     - `summary`: Human-readable summary
     - `total_required`: Total number of required documents
     - `documents_provided`: Number of documents user has
     - `missing_mandatory`: Count of missing mandatory documents
     - `missing_optional`: Count of missing optional documents
     - `completion_percentage`: 0-100% completion
     - `has_all_mandatory`: Boolean flag
     - `missing_documents`: Detailed list with priorities
     - `action_steps`: Actionable guidance for obtaining documents

4. **Cache Support**
   - Document gap analysis works with both fresh and cached evaluations
   - Ensures consistent response structure

### 3. Test Coverage

Created comprehensive unit tests in `document-gap-detection.test.ts`:

#### Test Suites

1. **detectDocumentGaps**
   - ✓ Detects all missing documents when user has none
   - ✓ Detects no gaps when user has all documents
   - ✓ Handles alternative documents correctly
   - ✓ Rejects when user has neither required nor alternative
   - ✓ Prioritizes mandatory documents over optional
   - ✓ Handles document type variations (normalization)
   - ✓ Calculates completion percentage correctly
   - ✓ Includes obtainFrom information for known document types

2. **generateDocumentGapSummary**
   - ✓ Generates summary for no missing documents
   - ✓ Generates summary for missing mandatory documents
   - ✓ Generates summary for missing optional documents

3. **getDocumentActionSteps**
   - ✓ Generates action steps for mandatory documents
   - ✓ Prioritizes mandatory over optional documents
   - ✓ Respects maxSteps limit
   - ✓ Handles documents without obtainFrom information

**Test Results**: All 15 tests passing ✓

### 4. Example Usage

Created `document-gap-detection-example.ts` with 5 comprehensive examples:

1. **Basic Gap Detection**: Shows how to detect missing documents
2. **Alternative Documents**: Demonstrates alternative document handling
3. **Complete Application**: Shows 100% completion scenario
4. **Priority-Based Steps**: Demonstrates priority system
5. **Eligibility Integration**: Shows integration with eligibility evaluation

## API Response Example

```json
{
  "success": true,
  "data": {
    "evaluation_id": "eval-123",
    "status": "conditionally_eligible",
    "confidence_score": 75,
    "reasoning": "User meets most criteria but missing some documents",
    "suggested_next_steps": [
      "Update your profile with missing information",
      "Gather and upload required documents"
    ],
    "document_gaps": {
      "summary": "You are missing 1 mandatory document. Document completion: 67%",
      "total_required": 3,
      "documents_provided": 2,
      "missing_mandatory": 1,
      "missing_optional": 0,
      "completion_percentage": 67,
      "has_all_mandatory": false,
      "missing_documents": [
        {
          "type": "income_certificate",
          "name": "Income Certificate",
          "mandatory": true,
          "description": "Certificate showing annual income",
          "priority": 1,
          "obtainFrom": "Tehsil Office or Revenue Department"
        }
      ],
      "action_steps": [
        "Obtain Income Certificate from Tehsil Office or Revenue Department"
      ]
    }
  }
}
```

## Technical Decisions

1. **Normalization Strategy**: Implemented flexible document type matching to handle variations in naming conventions across different systems and user inputs.

2. **Priority System**: Three-tier priority system ensures users focus on most important documents first (mandatory > optional without alternatives > optional with alternatives).

3. **Alternative Documents**: Full support for alternative documents allows flexibility in document requirements while maintaining validation.

4. **Location Guidance**: Pre-configured mapping of common document types to obtaining locations provides immediate actionable guidance.

5. **Integration Approach**: Non-invasive integration with existing eligibility handler ensures backward compatibility while enhancing all responses.

## Files Created/Modified

### Created
- `packages/backend/src/services/document-gap-detection.ts` - Core service
- `packages/backend/src/services/document-gap-detection.test.ts` - Unit tests
- `packages/backend/src/examples/document-gap-detection-example.ts` - Usage examples
- `packages/backend/TASK-7.2-SUMMARY.md` - This summary

### Modified
- `packages/backend/src/handlers/eligibility-handler.ts` - Integrated document gap detection

## Testing

All tests pass successfully:
```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## Next Steps

1. **Task 7.3**: Write tests for document management (including document gap detection logic)
2. Consider adding more document types to the `DOCUMENT_OBTAIN_LOCATIONS` mapping
3. Consider adding multilingual support for document names and descriptions
4. Consider adding document expiry tracking integration

## Notes

- The implementation is production-ready and fully tested
- Document gap detection works seamlessly with both fresh and cached evaluations
- The priority system ensures users always know what to do next
- Alternative document support provides flexibility for users
- The normalization logic handles common variations in document naming
