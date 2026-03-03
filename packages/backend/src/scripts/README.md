# Seed Scripts

This directory contains scripts for seeding sample data into DynamoDB.

## Seed Eligibility Rules

The `seed-eligibility-rules.ts` script populates the DynamoDB table with sample scheme configurations.

### Sample Schemes

The script seeds three realistic government schemes:

1. **Prime Minister Scholarship Scheme** (`scheme-pm-scholarship`)
   - Category: Education
   - Target: Students from economically weaker sections (18-35 years)
   - Key Criteria: Education level, income below ₹2 lakhs, student status
   - Required Documents: Aadhaar, income certificate, educational certificates, bank account
   - Application: Online via scholarships.gov.in

2. **Pradhan Mantri Kaushal Vikas Yojana (PMKVY)** (`scheme-skill-development`)
   - Category: Employment
   - Target: Unemployed youth seeking skill training (18-45 years)
   - Key Criteria: Unemployed/self-employed status, priority for rural areas
   - Required Documents: Aadhaar, bank account, educational certificates (optional)
   - Application: Both online and offline

3. **Karnataka Widow Pension Scheme** (`scheme-widow-pension-karnataka`)
   - Category: Welfare
   - Target: Widows from economically weaker sections in Karnataka
   - Key Criteria: Female, Karnataka resident, income below ₹1 lakh
   - Required Documents: Aadhaar, death certificate, income certificate, domicile certificate, bank account
   - Application: Both online and offline

### Prerequisites

1. AWS credentials configured (via environment variables or AWS CLI)
2. DynamoDB table created (via CDK deployment)
3. Environment variable `DYNAMODB_TABLE_NAME` set (defaults to `eligibility-mvp-table`)

### Usage

#### Option 1: Using npm script (recommended)

```bash
cd packages/backend
npm run seed-rules
```

#### Option 2: Using ts-node directly

```bash
cd packages/backend
npx ts-node src/scripts/seed-eligibility-rules.ts
```

#### Option 3: Build and run

```bash
cd packages/backend
npm run build
node dist/scripts/seed-eligibility-rules.js
```

### Environment Variables

- `DYNAMODB_TABLE_NAME` - DynamoDB table name (default: `eligibility-mvp-table`)
- `AWS_REGION` - AWS region (default: from AWS SDK configuration)
- `AWS_ACCESS_KEY_ID` - AWS access key (if not using IAM role)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (if not using IAM role)

### Output

The script will output:
```
Starting eligibility rules seeding...
Seeding 3 sample rules...
✓ Successfully seeded eligibility rules:
  - Prime Minister Scholarship Scheme (rule-pm-scholarship-2024)
  - Pradhan Mantri Kaushal Vikas Yojana (PMKVY) (rule-skill-development-2024)
  - Karnataka Widow Pension Scheme (rule-widow-pension-karnataka-2024)

Seeding completed successfully!
```

### Troubleshooting

**Error: Cannot find table**
- Ensure the DynamoDB table is created via CDK deployment
- Check that `DYNAMODB_TABLE_NAME` environment variable matches the deployed table name

**Error: Access Denied**
- Ensure AWS credentials have DynamoDB write permissions
- Required IAM permissions: `dynamodb:PutItem`

**Error: Module not found**
- Run `npm install` to install dependencies
- Ensure you're in the `packages/backend` directory

### Data Structure

Each scheme is stored in DynamoDB with the following structure:

```typescript
{
  PK: "RULE#{ruleId}",
  SK: "SCHEME#{schemeId}",
  GSI1PK: "SCHEME#{schemeId}",
  GSI1SK: "CATEGORY#{category}",
  GSI2PK: "STATE#{state}", // For state-specific schemes
  GSI2SK: "CATEGORY#{category}",
  entityType: "ELIGIBILITY_RULE",
  rule: {
    // Complete eligibility rule object
  }
}
```

### Modifying Sample Data

To add or modify schemes:

1. Edit `packages/backend/src/data/sample-eligibility-rules.ts`
2. Add new `EligibilityRule` objects to the `sampleEligibilityRules` array
3. Run the seed script to update DynamoDB

### Integration with Frontend

The frontend's `EligibilityEvaluation` component references these scheme IDs:
- `scheme-pm-scholarship`
- `scheme-skill-development`
- `scheme-widow-pension-karnataka`

Ensure any changes to scheme IDs are reflected in both the backend data and frontend component.
