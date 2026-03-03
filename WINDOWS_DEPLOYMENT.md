# Windows Deployment Guide

Since you're on Windows, the bash scripts won't work directly. Here's the step-by-step manual deployment process:

## Prerequisites

Make sure you have:
- ✅ Node.js installed (you have v24.13.0)
- ✅ npm installed (you have 11.8.0)
- ⚠️ AWS CLI installed (you need to install this)
- ⚠️ AWS credentials configured

## Step 1: Install AWS CLI

Download and install from: https://awscli.amazonaws.com/AWSCLIV2.msi

After installation, **restart your PowerShell terminal** and verify:
```powershell
aws --version
```

## Step 2: Configure AWS Credentials

```powershell
aws configure
```

Enter:
- AWS Access Key ID: [your access key]
- AWS Secret Access Key: [your secret key]
- Default region name: `ap-south-1`
- Default output format: `json`

Verify:
```powershell
aws sts get-caller-identity
```

## Step 3: Enable Bedrock Model Access

1. Go to: https://console.aws.amazon.com/bedrock
2. Select region: **ap-south-1 (Mumbai)** in top-right corner
3. Click "Model access" in left sidebar
4. Click "Manage model access"
5. Find "Anthropic" and check "Claude 3 Sonnet"
6. Click "Request model access"
7. Wait 2-5 minutes

Verify:
```powershell
aws bedrock list-foundation-models --region ap-south-1 --by-provider anthropic
```

## Step 4: Install Dependencies

From the project root:

```powershell
npm install
```

## Step 5: Build Backend

```powershell
cd packages\backend
npm run build
cd ..\..
```

## Step 6: Bootstrap CDK (One-time setup)

```powershell
cd packages\infrastructure
npx cdk bootstrap
```

You should see:
```
✅  Environment aws://123456789012/ap-south-1 bootstrapped
```

## Step 7: Deploy Infrastructure

**Stay in the `packages\infrastructure` directory** and run:

```powershell
npx cdk deploy --all --require-approval never
```

This will take 5-10 minutes. You'll see:
- Creating CloudFormation stack
- Creating DynamoDB table
- Creating S3 bucket
- Creating Lambda functions
- Creating API Gateway
- Creating Cognito User Pool

## Step 8: Save Deployment Outputs

After deployment, you'll see outputs like:

```
Outputs:
EligibilityMvpStack.ApiUrl = https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1/
EligibilityMvpStack.UserPoolId = ap-south-1_ABC123XYZ
EligibilityMvpStack.UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
EligibilityMvpStack.TableName = eligibility-mvp-table
EligibilityMvpStack.DocumentBucketName = eligibility-mvp-documents-123456789012
```

**COPY THESE VALUES** - you'll need them!

## Step 9: Seed Sample Data

Go back to project root and run the seed script manually:

```powershell
cd ..\..
node packages\backend\src\scripts\seed-eligibility-rules.ts
```

Or use AWS CLI to seed data:

```powershell
# Get your table name from Step 8 outputs
$TABLE_NAME = "eligibility-mvp-table"

# This will be done after we create a proper seed script
```

## Step 10: Configure Frontend

Create `packages\frontend\.env` file:

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1
VITE_USER_POOL_ID=ap-south-1_ABC123XYZ
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_AWS_REGION=ap-south-1
```

Replace with your actual values from Step 8.

## Step 11: Disable Mock Mode

Edit these files and change to `false`:

**`packages\frontend\src\contexts\AuthContext.tsx`:**
```typescript
const MOCK_AUTH_MODE = false; // Change from true to false
```

**`packages\frontend\src\services\api.ts`:**
```typescript
const MOCK_API_MODE = false; // Change the conditional to just false
```

**`packages\frontend\src\components\DocumentUpload.tsx`:**
```typescript
const MOCK_API_MODE = false; // Change the conditional to just false
```

## Step 12: Test the Deployment

Start the frontend:

```powershell
cd packages\frontend
npm run dev
```

Open browser: http://localhost:5173

Test:
1. Sign up with phone number (+919876543210)
2. Enter OTP
3. Complete profile
4. Check eligibility
5. Upload documents

## Quick Commands Reference

```powershell
# From project root

# Install dependencies
npm install

# Build backend
cd packages\backend; npm run build; cd ..\..

# Bootstrap CDK (one-time)
cd packages\infrastructure; npx cdk bootstrap; cd ..\..

# Deploy infrastructure
cd packages\infrastructure; npx cdk deploy --all --require-approval never; cd ..\..

# Start frontend
cd packages\frontend; npm run dev

# View logs
aws logs tail /aws/lambda/EligibilityMvpStack-EligibilityHandler --follow --region ap-south-1

# Destroy everything
cd packages\infrastructure; npx cdk destroy --all; cd ..\..
```

## Troubleshooting

### Error: "bash: command not found"

**Solution**: Don't use `npm run deploy:dev`. Use the manual commands above instead.

### Error: "Unable to locate credentials"

**Solution**: Run `aws configure` and enter your credentials.

### Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solution**: Enable Bedrock model access (Step 3).

### Error: "Stack already exists"

**Solution**: The stack is already deployed. To update it:
```powershell
cd packages\infrastructure
npx cdk deploy --all
```

To destroy and redeploy:
```powershell
cd packages\infrastructure
npx cdk destroy --all
npx cdk deploy --all --require-approval never
```

## Cost Monitoring

View costs at: https://console.aws.amazon.com/billing

Expected costs: ₹1,000-3,000/month for MVP usage

## Next Steps

After successful deployment:

1. ✅ Test all features with real AWS
2. ✅ Monitor CloudWatch dashboard
3. ✅ Set up budget alerts
4. ✅ Add more schemes
5. ✅ Customize UI

## Cleanup

To remove all AWS resources:

```powershell
cd packages\infrastructure
npx cdk destroy --all
```

---

**Start with Step 1** and follow each step in order!
