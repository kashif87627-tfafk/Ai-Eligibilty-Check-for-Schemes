# Eligibility Rule Configuration Format

## Overview

This document describes the JSON-based eligibility rule configuration format used in the Eligibility-First Community Access Platform. Eligibility rules define the criteria that users must meet to be eligible for government schemes and benefits.

## Table of Contents

1. [Rule Structure](#rule-structure)
2. [Rule Operators](#rule-operators)
3. [Criterion Evaluation](#criterion-evaluation)
4. [Confidence Scoring](#confidence-scoring)
5. [Sample Rules](#sample-rules)
6. [DynamoDB Storage](#dynamodb-storage)

## Rule Structure

An eligibility rule consists of the following components:

### Basic Information
- **id**: Unique identifier for the rule (e.g., `rule-pm-scholarship-2024`)
- **schemeId**: Identifier for the scheme (e.g., `scheme-pm-scholarship`)
- **schemeName**: Human-readable name of the scheme
- **description**: Detailed description of the scheme
- **category**: Scheme category (education, health, employment, housing, agriculture, welfare)
- **targetAudience**: Array of tags describing the target audience

### Eligibility Criteria
- **criteria**: Array of criterion objects that define eligibility requirements
  - Each criterion has:
    - **id**: Unique identifier
    - **field**: User profile field to evaluate (supports dot notation for nested fields)
    - **operator**: Comparison operator (see [Rule Operators](#rule-operators))
    - **value**: Expected value(s)
    - **weight**: Weight for confidence calculation (0-1)
    - **description**: Human-readable description
    - **mandatory**: Whether the criterion is mandatory

### Document Requirements
- **requiredDocuments**: Array of document requirements
  - **type**: Document type identifier
  - **name**: Human-readable name
  - **mandatory**: Whether the document is mandatory
  - **description**: Description of the document
  - **alternativeDocuments**: Optional array of alternative document types

### Location and Timing
- **applicableStates**: Array of state names (empty = all states)
- **applicableDistricts**: Optional array of district names
- **ruralUrbanFilter**: Filter for rural/urban areas (rural, urban, both)
- **applicationDeadline**: ISO 8601 date string (optional)
- **isOpenEnded**: Boolean indicating if the scheme has no deadline
- **processingTime**: Estimated processing time (e.g., "30-45 days")

### Application Details
- **applicationMode**: How to apply (online, offline, both)
- **applicationUrl**: URL for online application (optional)
- **officeLocations**: Array of office locations for offline application

### Metadata
- **trustLevel**: Trust level of the information (verified, partially_correct, misleading, unverifiable)
- **sourceUrl**: Source URL for scheme information
- **lastVerified**: ISO 8601 date string of last verification
- **createdAt**: ISO 8601 date string of creation
- **updatedAt**: ISO 8601 date string of last update

## Rule Operators

The following operators are supported for criterion evaluation:

### Equality Operators

#### `eq` (Equals)
Checks if the user value equals the criterion value.

```json
{
  "field": "gender",
  "operator": "eq",
  "value": "female"
}
```

### Comparison Operators

#### `lt` (Less Than)
Checks if the user value is less than the criterion value.

```json
{
  "field": "age",
  "operator": "lt",
  "value": 35
}
```

#### `gt` (Greater Than)
Checks if the user value is greater than the criterion value.

```json
{
  "field": "age",
  "operator": "gt",
  "value": 18
}
```

#### `lte` (Less Than or Equal)
Checks if the user value is less than or equal to the criterion value.

```json
{
  "field": "income",
  "operator": "lte",
  "value": 100000
}
```

#### `gte` (Greater Than or Equal)
Checks if the user value is greater than or equal to the criterion value.

```json
{
  "field": "age",
  "operator": "gte",
  "value": 18
}
```

### Set Operators

#### `in` (In Array)
Checks if the user value is in the array of criterion values.

```json
{
  "field": "ageRange",
  "operator": "in",
  "value": ["18-25", "26-35"]
}
```

#### `contains` (Contains)
Checks if the user value contains the criterion value (for strings or arrays).

```json
{
  "field": "skills",
  "operator": "contains",
  "value": "programming"
}
```

### Range Operator

#### `range` (Range)
Checks if the user value falls within the specified range.

```json
{
  "field": "income",
  "operator": "range",
  "value": { "min": 50000, "max": 200000 }
}
```

## Criterion Evaluation

### Nested Field Access

Criteria can access nested fields using dot notation:

```json
{
  "field": "location.state",
  "operator": "eq",
  "value": "Karnataka"
}
```

### Mandatory vs Optional Criteria

- **Mandatory criteria**: Must be satisfied for eligibility. If any mandatory criterion fails, the user is marked as "not_eligible".
- **Optional criteria**: Contribute to confidence score but don't disqualify the user.

### Weight-Based Scoring

Each criterion has a weight (0-1) that determines its importance in the confidence calculation:
- Higher weight = more important criterion
- Weights should sum to approximately 1.0 for all criteria
- Typical weights:
  - Critical criteria: 0.25-0.30
  - Important criteria: 0.15-0.20
  - Supporting criteria: 0.10-0.15

## Confidence Scoring

The confidence score is calculated as follows:

1. **Calculate total weight**: Sum of all criterion weights
2. **Calculate matched weight**: Sum of weights for satisfied criteria
3. **Calculate percentage**: (matched weight / total weight) × 100
4. **Apply mandatory check**: If any mandatory criterion fails, cap score at 20%

### Eligibility Status Classification

Based on the confidence score:

- **Strongly Eligible** (≥80%): User meets all or most criteria with high confidence
- **Conditionally Eligible** (50-79%): User meets most criteria but may need verification
- **Needs Verification** (20-49%): User meets some criteria but requires additional information
- **Not Eligible** (<20% or mandatory criteria failed): User does not meet eligibility requirements

## Sample Rules

### Example 1: Education Scholarship

```json
{
  "id": "rule-pm-scholarship-2024",
  "schemeId": "scheme-pm-scholarship",
  "schemeName": "Prime Minister Scholarship Scheme",
  "description": "Scholarship for meritorious students from economically weaker sections",
  "category": "education",
  "targetAudience": ["students", "youth"],
  "criteria": [
    {
      "id": "crit-age-range",
      "field": "ageRange",
      "operator": "in",
      "value": ["18-25", "26-35"],
      "weight": 0.2,
      "description": "Must be between 18-35 years old",
      "mandatory": true
    },
    {
      "id": "crit-income",
      "field": "incomeRange",
      "operator": "in",
      "value": ["below_50k", "50k_1l", "1l_2l"],
      "weight": 0.3,
      "description": "Family income below ₹2 lakhs",
      "mandatory": true
    },
    {
      "id": "crit-education",
      "field": "education",
      "operator": "in",
      "value": ["secondary", "graduate"],
      "weight": 0.25,
      "description": "Must have completed secondary education",
      "mandatory": true
    },
    {
      "id": "crit-category",
      "field": "category",
      "operator": "in",
      "value": ["sc", "st", "obc", "ews"],
      "weight": 0.25,
      "description": "Preference for SC/ST/OBC/EWS",
      "mandatory": false
    }
  ],
  "requiredDocuments": [
    {
      "type": "aadhaar",
      "name": "Aadhaar Card",
      "mandatory": true,
      "description": "Valid Aadhaar card"
    },
    {
      "type": "income_certificate",
      "name": "Income Certificate",
      "mandatory": true,
      "description": "Income certificate from competent authority"
    }
  ],
  "applicableStates": [],
  "ruralUrbanFilter": "both",
  "isOpenEnded": false,
  "applicationDeadline": "2024-12-31T23:59:59Z",
  "applicationMode": "online",
  "applicationUrl": "https://scholarships.gov.in",
  "trustLevel": "verified",
  "sourceUrl": "https://scholarships.gov.in",
  "lastVerified": "2024-01-15T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### Example 2: State-Specific Welfare Scheme

```json
{
  "id": "rule-widow-pension-karnataka-2024",
  "schemeId": "scheme-widow-pension-karnataka",
  "schemeName": "Karnataka Widow Pension Scheme",
  "description": "Monthly pension for widows in Karnataka",
  "category": "welfare",
  "targetAudience": ["women", "widows"],
  "criteria": [
    {
      "id": "crit-gender",
      "field": "gender",
      "operator": "eq",
      "value": "female",
      "weight": 0.3,
      "description": "Scheme is for women only",
      "mandatory": true
    },
    {
      "id": "crit-state",
      "field": "location.state",
      "operator": "eq",
      "value": "Karnataka",
      "weight": 0.3,
      "description": "Must be a resident of Karnataka",
      "mandatory": true
    },
    {
      "id": "crit-income",
      "field": "incomeRange",
      "operator": "in",
      "value": ["below_50k", "50k_1l"],
      "weight": 0.4,
      "description": "Family income below ₹1 lakh",
      "mandatory": true
    }
  ],
  "requiredDocuments": [
    {
      "type": "aadhaar",
      "name": "Aadhaar Card",
      "mandatory": true,
      "description": "Valid Aadhaar card"
    },
    {
      "type": "death_certificate",
      "name": "Husband's Death Certificate",
      "mandatory": true,
      "description": "Death certificate of deceased husband"
    }
  ],
  "applicableStates": ["Karnataka"],
  "ruralUrbanFilter": "both",
  "isOpenEnded": true,
  "applicationMode": "both",
  "applicationUrl": "https://sevasindhu.karnataka.gov.in",
  "trustLevel": "verified",
  "sourceUrl": "https://sevasindhu.karnataka.gov.in",
  "lastVerified": "2024-01-18T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-18T00:00:00Z"
}
```

## DynamoDB Storage

Eligibility rules are stored in DynamoDB using a single-table design pattern.

### Primary Key Structure

- **PK (Partition Key)**: `RULE#{ruleId}`
- **SK (Sort Key)**: `SCHEME#{schemeId}`

### Global Secondary Indexes

#### GSI1: Query by Scheme or Category
- **GSI1PK**: `SCHEME#{schemeId}`
- **GSI1SK**: `CATEGORY#{category}`

Use cases:
- Get all rules for a specific scheme
- Get all rules in a category

#### GSI2: Query by State and Category
- **GSI2PK**: `STATE#{state}`
- **GSI2SK**: `CATEGORY#{category}`

Use cases:
- Get all rules applicable to a specific state
- Get all rules in a category for a specific state

### Example DynamoDB Item

```json
{
  "PK": "RULE#rule-pm-scholarship-2024",
  "SK": "SCHEME#scheme-pm-scholarship",
  "GSI1PK": "SCHEME#scheme-pm-scholarship",
  "GSI1SK": "CATEGORY#education",
  "entityType": "ELIGIBILITY_RULE",
  "rule": {
    "id": "rule-pm-scholarship-2024",
    "schemeId": "scheme-pm-scholarship",
    "schemeName": "Prime Minister Scholarship Scheme",
    ...
  }
}
```

## Usage Examples

### Evaluating a User Profile

```typescript
import { evaluateCriterion, getNestedValue } from '../utils/rule-operators';
import { EligibilityRule } from '../types/eligibility-rules';

function evaluateRule(rule: EligibilityRule, userProfile: any) {
  let totalWeight = 0;
  let matchedWeight = 0;
  let mandatoryMet = true;

  for (const criterion of rule.criteria) {
    totalWeight += criterion.weight;
    
    const userValue = getNestedValue(userProfile, criterion.field);
    const matches = evaluateCriterion(
      criterion.operator,
      userValue,
      criterion.value
    );

    if (matches) {
      matchedWeight += criterion.weight;
    } else if (criterion.mandatory) {
      mandatoryMet = false;
    }
  }

  const confidenceScore = (matchedWeight / totalWeight) * 100;
  
  return {
    confidenceScore,
    mandatoryMet,
    status: classifyStatus(confidenceScore, mandatoryMet)
  };
}
```

### Querying Rules by Location

```typescript
import { getEligibilityRulesByStateAndCategory } from '../repositories/eligibility-rule-repository';

// Get all education schemes in Karnataka
const rules = await getEligibilityRulesByStateAndCategory('Karnataka', 'education');
```

## Best Practices

1. **Weight Distribution**: Ensure criterion weights sum to approximately 1.0
2. **Mandatory Criteria**: Use sparingly for truly essential requirements
3. **Nested Fields**: Use dot notation for accessing nested user profile fields
4. **Translations**: Provide translations for scheme names and descriptions
5. **Trust Level**: Always verify scheme information and set appropriate trust level
6. **Regular Updates**: Keep `lastVerified` and `updatedAt` timestamps current
7. **Documentation**: Provide clear descriptions for all criteria and documents

## Validation

All eligibility rules should be validated against the JSON schema located at:
`packages/backend/src/schemas/eligibility-rule-schema.json`

Use a JSON schema validator to ensure rules conform to the expected format before storing in DynamoDB.
