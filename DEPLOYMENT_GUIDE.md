# Complete AWS Deployment Guide

This guide will walk you through deploying the Eligibility MVP to AWS from scratch.

## Prerequisites Installation

### 1. Install AWS CLI

**For Windows:**

Download and install from: https://awscli.amazonaws.com/AWSCLIV2.msi

Or using Chocolatey:
```powershell
choco install awscli
```

Or using winget:
```powershell
winget install Amazon.AWSCLI
```

After installation, restart your terminal and verify:
```bash
aws --version
```

**For macOS:**
```bash
brew install awscli
```

**For Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2. Verify Node.js and npm

You already have these installed:
- Node.js: v24.13.0 ✅
- npm: 11.8.0 ✅

## AWS Account Setup

### Step 1: Create AWS Account

If you don't have an AWS account:
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add payment method (required, but free tier available)

### Step 2: Create IAM User for Deployment

1. **Login to AWS Console**: https://console.aws.amazon.com

2. **Navigate to IAM**:
   - Search for "IAM" in the top search bar
   - Click "Identity and Access Management"

3. **Create User**:
   - Click "Users" in the left sidebar
   - Click "Create user"
   - Username: `eligibility-mvp-deployer`
   - Click "Next"

4. **Set Permissions**:
   - Select "Attach policies directly"
   - Search and select these policies:
     - ✅ `AdministratorAccess` (easiest for MVP - use more restrictive policies for production)
   - Click "Next"
   - Click "Create user"

5. **Create Access Keys**:
   - Click on the newly created user
   - Go to "Security credentials" tab
   - Scroll to "Access keys"
   - Click "Create access key"
   - Select "Command Line Interface (CLI)"
   - Check the confirmation box
   - Click "Next"
   - Add description: "Eligibility MVP Deployment"
   - Click "Create access key"
   - **IMPORTANT**: Copy both:
     - Access key ID
     - Secret access key
   - Download the CSV file as backup
   - Click "Done"

### Step 3: Configure AWS CLI

Run this command and enter your credentials:

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID: [paste your access key ID]
AWS Secret Access Key: [paste your secret access key]
Default region name: ap-south-1
Default output format: json
```

**Verify configuration:**
```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN.

### Step 4: Enable Amazon Bedrock Access

1. **Go to Bedrock Console**: https://console.aws.amazon.com/bedrock

2. **Select Region**: 
   - In the top-right corner, select **"Asia Pacific (Mumbai) ap-south-1"**

3. **Enable Model Access**:
   - Click "Model access" in the left sidebar
   - Click "Manage model access" button
   - Find "Anthropic" section
   - Check the box for "Claude 3 Sonnet"
   - Scroll down and click "Request model access"
   - Wait 2-5 minutes for approval (usually instant)

4. **Verify Access**:
   ```bash
   aws bedrock list-foundation-models --region ap-south-1 --by-provider anthropic
   ```

## Deployment Steps

### Step 1: Install All Dependencies

From the project root:

```bash
npm install
```

This installs dependencies for all packages (frontend, backend, infrastructure).

### Step 2: Build Backend

```bash
cd packages/backend
npm run build
cd ../..
```

### Step 3: Bootstrap AWS CDK

This is a one-time setup per AWS account/region:

```bash
cd packages/infrastructure
npx cdk bootstrap
cd ../..
```

You should see output like:
```
✅  Environment aws://123456789012/ap-south-1 bootstrapped
```

### Step 4: Deploy Infrastructure

**Option A: Using the deployment script (Recommended)**

```bash
npm run deploy:dev
```

**Option B: Manual deployment**

```bash
cd packages/infrastructure
npx cdk deploy --all --require-approval never
cd ../..
```

**Deployment takes 5-10 minutes**. You'll see:
- Creating CloudFormation stack
- Creating DynamoDB table
- Creating S3 bucket
- Creating Lambda functions
- Creating API Gateway
- Creating Cognito User Pool
- Setting up CloudWatch monitoring

### Step 5: Save Deployment Outputs

After deployment completes, you'll see outputs like:

```
Outputs:
EligibilityMvpStack.ApiUrl = https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1/
EligibilityMvpStack.UserPoolId = ap-south-1_ABC123XYZ
EligibilityMvpStack.UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
EligibilityMvpStack.TableName = eligibility-mvp-table
EligibilityMvpStack.DocumentBucketName = eligibility-mvp-documents-123456789012
```

**SAVE THESE VALUES** - you'll need them for the frontend configuration.

### Step 6: Seed Sample Data

Populate the database with sample schemes:

```bash
npm run seed
```

This creates:
- 3 sample government schemes (PM Scholarship, PMKVY, Karnataka Widow Pension)
- Sample eligibility rules for each scheme

### Step 7: Disable Mock Mode in Frontend

Now that AWS is deployed, disable mock mode:

**Edit `packages/frontend/src/contexts/AuthContext.tsx`:**
```typescript
const MOCK_AUTH_MODE = false; // Change from true to false
```

**Edit `packages/frontend/src/services/api.ts`:**
```typescript
// Change this line:
const MOCK_API_MODE = import.meta.env.MODE !== 'test' && (import.meta.env.VITE_MOCK_API_MODE !== 'false');

// To this:
const MOCK_API_MODE = false;
```

**Edit `packages/frontend/src/components/DocumentUpload.tsx`:**
```typescript
const MOCK_API_MODE = false; // Change from the conditional to false
```

### Step 8: Configure Frontend Environment

Create `packages/frontend/.env` file with your deployment outputs:

```bash
cd packages/frontend
```

Create `.env` file:
```env
# Replace with your actual values from Step 5
VITE_API_BASE_URL=https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1
VITE_USER_POOL_ID=ap-south-1_ABC123XYZ
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_AWS_REGION=ap-south-1
```

### Step 9: Configure AWS Amplify in Frontend

**Edit `packages/frontend/src/main.tsx`** to add Amplify configuration:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION,
    }
  }
});
```

### Step 10: Test the Deployment

**Start the frontend:**
```bash
cd packages/frontend
npm run dev
```

**Open browser**: http://localhost:5173

**Test the flow:**
1. Sign up with a phone number (format: +919876543210)
2. Enter OTP code sent to your phone
3. Complete your profile
4. Check eligibility for a scheme
5. Upload documents

## Deployment Verification

### Check API Health

```bash
# Replace with your API URL
curl https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/health
```

### Check CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/EligibilityMvpStack-EligibilityHandler --follow --region ap-south-1
```

### Check DynamoDB Table

```bash
# List tables
aws dynamodb list-tables --region ap-south-1

# Scan eligibility rules
aws dynamodb scan --table-name eligibility-mvp-table --region ap-south-1
```

### Access CloudWatch Dashboard

Go to: https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:

Look for "Eligibility-MVP-Dashboard"

## Cost Monitoring

### View Current Costs

1. Go to AWS Console: https://console.aws.amazon.com
2. Click your account name (top-right)
3. Click "Billing and Cost Management"
4. View "Bills" to see current month charges

### Expected Costs

**Free Tier (First 12 months):**
- Lambda: 1M requests/month free
- DynamoDB: 25 GB storage free
- S3: 5 GB storage free
- API Gateway: 1M requests/month free

**Paid Services:**
- **Bedrock (Claude 3 Sonnet)**: ~₹500-2000/month depending on usage
- **Cognito**: Free for first 50,000 users
- **CloudWatch**: ~₹100-300/month for logs and metrics

**Total Estimated**: ₹1,000-3,000/month for MVP usage

### Set Up Budget Alerts

1. Go to AWS Budgets: https://console.aws.amazon.com/billing/home#/budgets
2. Click "Create budget"
3. Select "Cost budget"
4. Set amount: ₹3,000
5. Set alert at 80% (₹2,400)
6. Enter your email for notifications

## Troubleshooting

### Error: "Unable to locate credentials"

**Solution**: Run `aws configure` again and enter your access keys.

### Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solution**: 
1. Go to Bedrock console
2. Enable model access for Claude 3 Sonnet
3. Wait 2-5 minutes

### Error: "Stack already exists"

**Solution**: Update the existing stack:
```bash
cd packages/infrastructure
npx cdk deploy --all
```

### Error: "Phone number not verified" during signup

**Solution**: 
1. Go to Cognito console
2. Find your user pool
3. Go to "Users" tab
4. Manually verify the user's phone number

### Error: "CORS error" when calling API

**Solution**: 
1. Check API Gateway CORS settings
2. Verify the API URL in frontend `.env` file
3. Make sure you're using HTTPS, not HTTP

## Production Deployment

For production deployment:

1. **Use a custom domain**:
   - Register domain in Route 53
   - Create SSL certificate in ACM
   - Configure API Gateway custom domain

2. **Enable WAF** (Web Application Firewall):
   - Protect against common attacks
   - Rate limiting
   - IP filtering

3. **Set up CI/CD**:
   - Use GitHub Actions or AWS CodePipeline
   - Automated testing before deployment
   - Blue-green deployments

4. **Backup strategy**:
   - Enable DynamoDB point-in-time recovery
   - S3 versioning for documents
   - Regular CloudFormation template backups

5. **Security hardening**:
   - Use AWS Secrets Manager for sensitive data
   - Enable CloudTrail for audit logs
   - Set up AWS Config for compliance
   - Use VPC for Lambda functions

## Cleanup (Destroy Resources)

To remove all AWS resources and stop charges:

```bash
cd packages/infrastructure
npx cdk destroy --all
```

**Warning**: This deletes:
- All data in DynamoDB
- All uploaded documents in S3
- All Lambda functions
- API Gateway
- Cognito User Pool (all users)
- CloudWatch logs

## Next Steps

After successful deployment:

1. ✅ Test all features with real AWS services
2. ✅ Monitor CloudWatch dashboard
3. ✅ Set up budget alerts
4. ✅ Add more government schemes
5. ✅ Customize the UI
6. ✅ Set up production domain
7. ✅ Enable additional security features

## Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com
- **AWS Support**: https://console.aws.amazon.com/support
- **Bedrock Documentation**: https://docs.aws.amazon.com/bedrock
- **CDK Documentation**: https://docs.aws.amazon.com/cdk

## Quick Reference Commands

```bash
# Deploy to development
npm run deploy:dev

# Seed sample data
npm run seed

# View logs
npm run logs

# Run tests
npm test

# Destroy infrastructure
cd packages/infrastructure && npx cdk destroy --all

# Check AWS identity
aws sts get-caller-identity

# List CloudFormation stacks
aws cloudformation list-stacks --region ap-south-1

# View DynamoDB tables
aws dynamodb list-tables --region ap-south-1
```

---

**You're now ready to deploy!** Start with Step 1 (Install AWS CLI) and follow each step in order.
