#!/bin/bash

# Eligibility MVP Data Seeding Script
# Seeds sample schemes and test user profiles into DynamoDB

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
REGION=${AWS_REGION:-ap-south-1}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Eligibility MVP Data Seeding${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  echo "Please run: aws configure"
  exit 1
fi
echo -e "${GREEN}✓ AWS credentials configured${NC}"
echo ""

# Load environment configuration
if [ -f ".env.$ENVIRONMENT" ]; then
  echo -e "${YELLOW}Loading environment configuration...${NC}"
  export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
  echo -e "${GREEN}✓ Environment configuration loaded${NC}"
  echo ""
else
  echo -e "${YELLOW}Warning: .env.$ENVIRONMENT not found. Using defaults.${NC}"
  export DYNAMODB_TABLE_NAME=eligibility-mvp-table
  echo ""
fi

# Check if DynamoDB table exists
echo -e "${YELLOW}Checking DynamoDB table...${NC}"
if ! aws dynamodb describe-table --table-name $DYNAMODB_TABLE_NAME --region $REGION > /dev/null 2>&1; then
  echo -e "${RED}Error: DynamoDB table '$DYNAMODB_TABLE_NAME' not found${NC}"
  echo "Please deploy the infrastructure first:"
  echo "  npm run deploy"
  exit 1
fi
echo -e "${GREEN}✓ DynamoDB table exists${NC}"
echo ""

# Seed eligibility rules
echo -e "${YELLOW}Seeding eligibility rules...${NC}"
cd packages/backend
npm run seed-rules
cd ../..
echo -e "${GREEN}✓ Eligibility rules seeded successfully${NC}"
echo ""

# Display seeded data summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Seeding Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "DynamoDB Table: $DYNAMODB_TABLE_NAME"
echo ""
echo "Seeded Schemes:"
echo "  1. Prime Minister Scholarship Scheme (scheme-pm-scholarship)"
echo "  2. Pradhan Mantri Kaushal Vikas Yojana (scheme-skill-development)"
echo "  3. Karnataka Widow Pension Scheme (scheme-widow-pension-karnataka)"
echo ""
echo "Sample User Profiles Available:"
echo "  - user-test-001: Student (Strongly Eligible for PM Scholarship)"
echo "  - user-test-002: Unemployed Rural Youth (Eligible for Skill Development)"
echo "  - user-test-003: Widow in Karnataka (Eligible for Widow Pension)"
echo "  - user-test-004: Student with High Income (Conditional)"
echo "  - user-test-005: Employed Professional (Not Eligible)"
echo "  - user-test-006: Missing Data Profile (Edge Case)"
echo "  - user-test-007: Older Self-Employed (Conditional)"
echo "  - user-test-008: Widow in Wrong State (Not Eligible)"
echo "  - user-test-009: Senior Citizen (Not Eligible for Youth Schemes)"
echo "  - user-test-010: Limited Consent Profile (Edge Case)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test eligibility evaluation with sample profiles"
echo "2. Access the frontend to test the UI"
echo "3. Monitor CloudWatch dashboard for metrics"
echo ""
echo -e "${GREEN}Seeding completed successfully!${NC}"
