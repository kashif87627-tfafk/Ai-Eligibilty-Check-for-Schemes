# Eligibility MVP Setup Guide

Complete setup guide for deploying and running the Eligibility-First Community Access Platform MVP.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [AWS Setup](#aws-setup)
5. [Deployment](#deployment)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** 20.x or later ([Download](https://nodejs.org/))
- **npm:** 10.x or later (comes with Node.js)
- **AWS CLI:** 2.x or later ([Installation Guide](https://aws.amazon.com/cli/))
- **Git:** For version control

### AWS Account Requirements

- Active AWS account with billing enabled
- IAM user with appropriate permissions (see [AWS Setup Guide](./AWS_SETUP.md))
- Amazon Bedrock model access enabled for Claude 3 Sonnet in ap-south-1 region

### Estimated Costs

- **Development:** ₹500-1,000/month
- **Staging:** ₹1,500-2,500/month
- **Production:** ₹3,000-5,000/month

Costs depend on usage. AWS Free Tier covers many services for the first 12 months.

---

## Project Structure

```
eligibility-mvp/
├── packages/
│   ├── frontend/          # React frontend application
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── services/      # API services
│   │   │   └── contexts/      # React contexts
│   │   └── package.json
│   │
│   ├── backend/           # Lambda functions and services
│   │   ├── src/
│   │   │   ├── handlers/      # Lambda handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── repositories/  # Data access layer
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── data/          # Sample data
│   │   │   └── scripts/       # Utility scripts
│   │   └── package.json
│   │
│   └── infrastructure/    # AWS CDK infrastructure
│       ├── lib/
│       │   └── eligibility-mvp-stack.ts
│       ├── bin/
│       │   └── app.ts
│       └── package.json
│
├── scripts/               # Deployment and utility scripts
│   ├── deploy.sh         # Main deployment script
│   └── seed.sh           # Data seeding script
│
├── config/               # Environment configurations
│   └── environments/
│       ├── dev.env
│       ├── staging.env
│       └── prod.env
│
├── docs/                 # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── AWS_SETUP.md
│   ├── SETUP_GUIDE.md
│   └── ARCHITECTURE.md
│
└── package.json          # Root package.json
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/eligibility-mvp.git
cd eligibility-mvp
```

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
npm install
```

This will install dependencies for all packages (frontend, backend, infrastructure).

### 3. Verify Installation

```bash
# Check Node.js version
node --version  # Should be 20.x or later

# Check npm version
npm --version   # Should be 10.x or later

# Check AWS CLI
aws --version   # Should be 2.x or later
```

---

## AWS Setup

### 1. Configure AWS Credentials

Follow the detailed [AWS Setup Guide](./AWS_SETUP.md) to:
- Create IAM user with required permissions
- Enable Bedrock model access
- Configure AWS CLI credentials

Quick setup:

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ap-south-1`
- Default output format: `json`

### 2. Verify AWS Access

```bash
# Check AWS identity
aws sts get-caller-identity

# Check Bedrock access
aws bedrock list-foundation-models --region ap-south-1 --by-provider anthropic
```

### 3. Bootstrap CDK

Bootstrap AWS CDK in your account (one-time setup):

```bash
cd packages/infrastructure
npx cdk bootstrap
cd ../..
```

---

## Deployment

### Development Environment

Deploy to development environment:

```bash
npm run deploy:dev
```

This script will:
1. Install all dependencies
2. Build backend Lambda functions
3. Build frontend application
4. Deploy AWS infrastructure using CDK
5. Create environment configuration file

### Staging Environment

Deploy to staging environment:

```bash
npm run deploy:staging
```

### Production Environment

Deploy to production environment:

```bash
npm run deploy:prod
```

### Deployment Output

After successful deployment, you'll see:

```
========================================
Deployment Summary
========================================

Environment: dev
Region: ap-south-1
Account ID: 123456789012

API URL: https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1/
User Pool ID: ap-south-1_ABC123XYZ
User Pool Client ID: 1a2b3c4d5e6f7g8h9i0j
DynamoDB Table: eligibility-mvp-table
S3 Bucket: eligibility-mvp-documents-123456789012

Next Steps:
1. Run seed script to populate sample data
2. Update frontend environment variables
3. Test the API endpoints
4. Access CloudWatch dashboard

Deployment completed successfully!
```

### Seed Sample Data

After deployment, seed the database with sample schemes:

```bash
npm run seed:dev
```

This will populate:
- 3 sample government schemes
- 10 test user profiles for various scenarios

---

## Environment Variables

### Backend Environment Variables

Backend Lambda functions use environment variables set by CDK:

- `TABLE_NAME` - DynamoDB table name
- `DOCUMENT_BUCKET_NAME` - S3 bucket for documents
- `AWS_REGION` - AWS region (ap-south-1)

Additional configuration from `config/environments/*.env`:

- `BEDROCK_MODEL_ID` - Bedrock model identifier
- `BEDROCK_MAX_TOKENS` - Max tokens for LLM responses
- `CACHE_TTL_SECONDS` - Cache time-to-live
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit threshold

### Frontend Environment Variables

Create `.env` file in `packages/frontend/`:

```bash
# Copy from deployment output
cp .env.dev packages/frontend/.env
```

Or manually create `packages/frontend/.env`:

```env
# API Configuration
VITE_API_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1

# Cognito Configuration
VITE_USER_POOL_ID=ap-south-1_ABC123XYZ
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_AWS_REGION=ap-south-1
```

### Environment-Specific Configuration

Configuration files are in `config/environments/`:

- `dev.env` - Development settings (verbose logging, lower rate limits)
- `staging.env` - Staging settings (moderate logging, medium rate limits)
- `prod.env` - Production settings (minimal logging, high rate limits)

---

## Testing

### Run All Tests

```bash
npm test
```

### Test Backend

```bash
cd packages/backend
npm test
```

### Test Frontend

```bash
cd packages/frontend
npm test
```

### Test Infrastructure

```bash
cd packages/infrastructure
npm test
```

### Integration Testing

Test API endpoints using cURL:

```bash
# Get API URL from deployment output
API_URL="https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1"

# Test health check (if implemented)
curl $API_URL/health

# Test eligibility evaluation (requires authentication)
# See API_DOCUMENTATION.md for complete examples
```

### Manual Testing via Frontend

1. Start frontend development server:
```bash
cd packages/frontend
npm run dev
```

2. Open browser: http://localhost:5173
3. Sign up with phone number
4. Complete user profile
5. Check eligibility for schemes
6. Upload documents

---

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard:

```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=Eligibility-MVP-Dashboard
```

Dashboard includes:
- API request count and latency
- Lambda invocations and errors
- Bedrock API calls and token usage
- Cache hit rate
- Error rates

### CloudWatch Logs

View Lambda function logs:

```bash
# Tail logs in real-time
npm run logs

# Or use AWS CLI
aws logs tail /aws/lambda/eligibility-mvp-eligibility --follow
```

### CloudWatch Alarms

Alarms are automatically configured for:
- High API error rate (>5%)
- High API latency (>5 seconds)
- Lambda errors
- Lambda throttles
- High Bedrock API call frequency
- High Bedrock token usage
- Low cache hit rate

Alarm notifications are sent to SNS topic. Subscribe to receive alerts:

```bash
# Get SNS topic ARN from deployment output
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:123456789012:eligibility-mvp-alarms \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Budget Alerts

Budget alerts are configured at:
- ₹1,000 (80% and 100% thresholds)
- ₹3,000 (80% and 100% thresholds)
- ₹5,000 (80% and 100% thresholds)

---

## Troubleshooting

### Deployment Issues

#### Error: "Unable to locate credentials"

**Solution:** Configure AWS credentials:
```bash
aws configure
```

#### Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solution:** Enable Bedrock model access in AWS Console (see [AWS Setup Guide](./AWS_SETUP.md))

#### Error: "Stack already exists"

**Solution:** Update existing stack:
```bash
cd packages/infrastructure
npx cdk deploy --all
```

Or destroy and redeploy:
```bash
npm run destroy
npm run deploy:dev
```

### Runtime Issues

#### Error: "Rate limit exceeded"

**Solution:** Wait for rate limit window to reset or increase limits in API Gateway usage plan.

#### Error: "Cache miss rate high"

**Solution:** Review cache configuration in `config/environments/*.env`. Increase `CACHE_TTL_SECONDS` if appropriate.

#### Error: "Bedrock throttling"

**Solution:** Reduce Bedrock API call frequency or request quota increase from AWS Support.

### Frontend Issues

#### Error: "Network Error" when calling API

**Solution:** 
1. Verify API URL in `.env` file
2. Check CORS configuration in API Gateway
3. Verify authentication token is valid

#### Error: "Cognito authentication failed"

**Solution:**
1. Verify User Pool ID and Client ID in `.env`
2. Check phone number format (+91XXXXXXXXXX)
3. Verify OTP code is correct

### Data Issues

#### No schemes available in frontend

**Solution:** Run seed script:
```bash
npm run seed:dev
```

#### Documents not uploading

**Solution:**
1. Check S3 bucket permissions
2. Verify pre-signed URL is not expired
3. Check file size limits (max 10MB)

---

## Cleanup

### Destroy Infrastructure

To remove all AWS resources:

```bash
npm run destroy
```

**Warning:** This will delete:
- DynamoDB table and all data
- S3 bucket and all documents
- Lambda functions
- API Gateway
- Cognito User Pool
- CloudWatch logs and dashboards

### Partial Cleanup

To keep data but stop incurring costs:
1. Delete Lambda functions (keep infrastructure)
2. Set DynamoDB to on-demand mode (already configured)
3. Enable S3 lifecycle policies for old documents

---

## Next Steps

After successful setup:

1. **Customize Schemes:** Edit `packages/backend/src/data/sample-eligibility-rules.ts`
2. **Add More Rules:** Extend eligibility rules for additional schemes
3. **Customize Frontend:** Modify React components in `packages/frontend/src/`
4. **Add Features:** Implement additional features from the roadmap
5. **Production Hardening:** Review security, performance, and cost optimization

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [AWS Setup Guide](./AWS_SETUP.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [React Documentation](https://react.dev/)

---

## Support

For issues or questions:
- Check documentation in `docs/` directory
- Review CloudWatch logs for error details
- Check GitHub issues (if applicable)
- Contact project maintainers
