# User Profile Service

This module implements the user profile data model and DynamoDB access patterns for the Eligibility MVP.

## Features

- **TypeScript Interfaces**: Strongly-typed user profile data model
- **DynamoDB Single-Table Design**: Efficient data access with PK/SK patterns
- **CRUD Operations**: Complete Lambda handler for profile management
- **Data Validation**: Comprehensive validation with consent tracking
- **Privacy-First**: Consent enforcement for sensitive data (category, disability, income)

## Architecture

### Data Model

The user profile includes:
- **Required Fields**: Phone number, age range, location, language, consent
- **Optional Fields**: Gender, education, occupation, employment status, income range
- **Sensitive Fields**: Category, disability status (require explicit consent)
- **Preferences**: Language, interaction mode, explanation level

### DynamoDB Access Patterns

1. **Get by User ID**: `PK=USER#{userId}, SK=PROFILE`
2. **Get by Phone Number**: `GSI1PK=PHONE#{phoneNumber}, GSI1SK=PROFILE`

### API Endpoints

- `POST /profiles` - Create new user profile
- `GET /profiles/{userId}` - Get user profile by ID
- `PUT /profiles/{userId}` - Update user profile
- `DELETE /profiles/{userId}` - Delete user profile
- `GET /profiles/phone/{phoneNumber}` - Get user profile by phone number

All endpoints require Cognito authentication.

## File Structure

```
src/
├── types/
│   └── user-profile.ts          # TypeScript interfaces
├── utils/
│   ├── validation.ts            # Validation logic
│   └── validation.test.ts       # Validation tests
├── repositories/
│   └── user-profile-repository.ts  # DynamoDB access layer
└── handlers/
    └── profile-handler.ts       # Lambda handler
```

## Usage

### Creating a Profile

```typescript
POST /profiles
{
  "phoneNumber": "+919876543210",
  "ageRange": "26-35",
  "location": {
    "state": "Karnataka",
    "district": "Bangalore Urban",
    "ruralUrban": "urban"
  },
  "language": "en",
  "consentGiven": true
}
```

### Updating a Profile

```typescript
PUT /profiles/{userId}
{
  "education": "graduate",
  "employmentStatus": "employed",
  "incomeRange": "2l_5l",
  "sensitiveDataConsent": {
    "income": true
  }
}
```

## Validation Rules

### Required Fields
- Phone number (valid format)
- Age range (one of: 18-25, 26-35, 36-45, 46-60, 60+)
- Location (state, district, rural/urban)
- Language preference
- Consent (must be true)

### Consent Requirements
- **Category**: Requires `sensitiveDataConsent.category = true`
- **Disability**: Requires `sensitiveDataConsent.disability = true`
- **Income**: Requires `sensitiveDataConsent.income = true`

## Testing

Run unit tests:
```bash
npm test
```

Run specific test file:
```bash
npm test validation.test.ts
```

## Environment Variables

- `TABLE_NAME`: DynamoDB table name (default: eligibility-mvp-table)

## Requirements Mapping

This implementation satisfies:
- **FR-1.1**: User profile data collection
- **FR-1.2**: Structured profile input
- **FR-1.3**: Consent tracking
- **4.1**: User Profile Inputs (age, location, education, income, category, disability)
- **NFR-4**: Privacy and consent enforcement
