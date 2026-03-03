#!/bin/bash

# Eligibility MVP Deployment Script
# This script deploys the complete AWS CDK stack for the Eligibility-First Community Access Platform

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
echo -e "${GREEN}Eligibility MVP Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Invalid environment. Must be dev, staging, or prod${NC}"
  exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  echo "Please configure AWS credentials using:"
  echo "  aws configure"
  echo "Or set environment variables:"
  echo "  export AWS_ACCESS_KEY_ID=your_access_key"
  echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials configured (Account: $ACCOUNT_ID)${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build backend
echo -e "${YELLOW}Building backend Lambda functions...${NC}"
cd packages/backend
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ Backend built successfully${NC}"
echo ""

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd packages/frontend
npm install
npm run build
cd ../..
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Bootstrap CDK (if needed)
echo -e "${YELLOW}Bootstrapping CDK (if needed)...${NC}"
cd packages/infrastructure
npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
echo -e "${GREEN}✓ CDK bootstrapped${NC}"
echo ""

# Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure stack...${NC}"
npx cdk deploy --all --require-approval never
echo -e "${GREEN}✓ Infrastructure deployed successfully${NC}"
echo ""

# Get stack outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text --region $REGION)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text --region $REGION)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text --region $REGION)
TABLE_NAME=$(aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" --output text --region $REGION)
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs[?OutputKey=='DocumentBucketName'].OutputValue" --output text --region $REGION)

echo -e "${GREEN}✓ Stack outputs retrieved${NC}"
echo ""

# Create environment configuration file
echo -e "${YELLOW}Creating environment configuration...${NC}"
cat > .env.$ENVIRONMENT << EOF
# Eligibility MVP Environment Configuration
# Environment: $ENVIRONMENT
# Generated: $(date)

# AWS Configuration
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID

# API Gateway
VITE_API_URL=$API_URL

# Cognito
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_AWS_REGION=$REGION

# DynamoDB
DYNAMODB_TABLE_NAME=$TABLE_NAME

# S3
DOCUMENT_BUCKET_NAME=$BUCKET_NAME
EOF

echo -e "${GREEN}✓ Environment configuration saved to .env.$ENVIRONMENT${NC}"
echo ""

# Display deployment summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Account ID: $ACCOUNT_ID"
echo ""
echo "API URL: $API_URL"
echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "DynamoDB Table: $TABLE_NAME"
echo "S3 Bucket: $BUCKET_NAME"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run seed script to populate sample data:"
echo "   npm run seed"
echo ""
echo "2. Update frontend environment variables:"
echo "   cp .env.$ENVIRONMENT packages/frontend/.env"
echo ""
echo "3. Test the API endpoints:"
echo "   curl $API_URL/api/v1/eligibility/evaluate"
echo ""
echo "4. Access CloudWatch dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=Eligibility-MVP-Dashboard"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
