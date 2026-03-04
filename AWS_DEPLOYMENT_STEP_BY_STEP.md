# AWS Deployment - Complete Step-by-Step Guide

## Prerequisites

Before starting, you need:
1. An AWS account (create one at https://aws.amazon.com if you don't have one)
2. A credit/debit card for AWS (they offer free tier, but need card for verification)
3. Windows PowerShell (already installed on your system)

---

## Step 1: Create AWS Account (If You Don't Have One)

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process:
   - Enter email and password
   - Provide contact information
   - Add payment method (credit/debit card)
   - Verify phone number
   - Choose "Basic Support - Free" plan
4. Wait for account activation (usually takes a few minutes)

---

## Step 2: Create IAM User with Access Keys

### 2.1 Login to AWS Console

1. Go to https://console.aws.amazon.com
2. Login with your root account credentials
3. In the search bar at top, type "IAM" and click on "IAM" service

### 2.2 Create IAM User

1. In the left sidebar, click "Users"
2. Click "Create user" button (orange button on right)
3. Enter username: `cdk-deployer` (or any name you prefer)
4. Click "Next"

### 2.3 Set Permissions

1. Select "Attach policies directly"
2. In the search box, type and select these policies (check the checkbox):
   - `AdministratorAccess` (for full deployment permissions)
   
   **Note**: For production, you should use more restrictive permissions, but for initial setup, AdministratorAccess is easiest.

3. Click "Next"
4. Click "Create user"

### 2.4 Create Access Keys

1. Click on the user you just created (`cdk-deployer`)
2. Click on "Security credentials" tab
3. Scroll down to "Access keys" section
4. Click "Create access key"
5. Select "Command Line Interface (CLI)"
6. Check the confirmation checkbox at bottom
7. Click "Next"
8. (Optional) Add description: "CDK Deployment"
9. Click "Create access key"

### 2.5 Save Your Credentials

**IMPORTANT**: You'll see two values:
- **Access key ID**: Something like `AKIAIOSFODNN7EXAMPLE`
- **Secret access key**: Something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**Copy both values immediately** - you won't be able to see the secret key again!

Options to save:
- Click "Download .csv file" button (recommended)
- Or copy both values to a secure text file

Click "Done" when finished.

---

## Step 3: Install AWS CLI

### 3.1 Download AWS CLI

1. Open your web browser
2. Go to: https://awscli.amazonaws.com/AWSCLIV2.msi
3. The download should start automatically (it's about 30 MB)

### 3.2 Install AWS CLI

1. Once downloaded, double-click the `AWSCLIV2.msi` file
2. Click "Next" on the welcome screen
3. Accept the license agreement, click "Next"
4. Keep default installation location, click "Next"
5. Click "Install"
6. Click "Finish" when installation completes

### 3.3 Verify Installation

1. Open a **NEW** PowerShell window (important - close old ones)
2. Run this command:

```powershell
aws --version
```

You should see output like:
```
aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64
```

If you get an error, restart your computer and try again.

---

## Step 4: Configure AWS Credentials

### 4.1 Run AWS Configure

Open PowerShell in your project directory and run:

```powershell
aws configure
```

### 4.2 Enter Your Credentials

You'll be prompted for 4 values. Enter them one by one:

**Prompt 1:**
```
AWS Access Key ID [None]:
```
**Enter**: Your Access Key ID from Step 2.5 (e.g., `AKIAIOSFODNN7EXAMPLE`)

**Prompt 2:**
```
AWS Secret Access Key [None]:
```
**Enter**: Your Secret Access Key from Step 2.5 (the long one)

**Prompt 3:**
```
Default region name [None]:
```
**Enter**: `ap-south-1` (this is Mumbai region)

**Prompt 4:**
```
Default output format [None]:
```
**Enter**: `json`

### 4.3 Verify Configuration

Run this command:

```powershell
aws sts get-caller-identity
```

You should see output like:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/cdk-deployer"
}
```

**Copy the Account number** (the 12-digit number) - you'll need it in the next step!

---

## Step 5: Bootstrap AWS CDK

### 5.1 Navigate to Infrastructure Directory

```powershell
cd C:\Users\mdk80\Desktop\Eligibility-First-Community-Access-Platform\packages\infrastructure
```

### 5.2 Bootstrap CDK

Replace `123456789012` with your actual AWS account number from Step 4.3:

```powershell
npx cdk bootstrap aws://123456789012/ap-south-1
```

**Example:**
```powershell
npx cdk bootstrap aws://987654321098/ap-south-1
```

This will take 2-3 minutes. You'll see output like:
```
 ⏳  Bootstrapping environment aws://123456789012/ap-south-1...
 ✅  Environment aws://123456789012/ap-south-1 bootstrapped.
```

---

## Step 6: Deploy Infrastructure to AWS

### 6.1 Build the Infrastructure Code

Still in the infrastructure directory, run:

```powershell
npm run build
```

This compiles the TypeScript code. Should complete in a few seconds.

### 6.2 Deploy All Stacks

```powershell
npx cdk deploy --all
```

**What happens:**
- CDK will show you all the resources it will create
- You'll see a list of IAM policies, Lambda functions, API Gateway, etc.
- You'll be asked: `Do you wish to deploy these changes (y/n)?`

**Type `y` and press Enter**

**Deployment time**: 10-15 minutes (this is normal!)

You'll see progress like:
```
EligibilityMvpStack: deploying...
EligibilityMvpStack: creating CloudFormation changeset...
 0/45 | 10:30:45 AM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack
 1/45 | 10:30:50 AM | CREATE_IN_PROGRESS   | AWS::DynamoDB::Table
...
```

### 6.3 Save the Outputs

When deployment completes, you'll see outputs like:

```
Outputs:
EligibilityMvpStack.ApiEndpoint = https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1
EligibilityMvpStack.UserPoolId = ap-south-1_AbCdEfGhI
EligibilityMvpStack.UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
EligibilityMvpStack.DocumentBucketName = eligibilitymvpstack-documentbucket-xyz123
```

**IMPORTANT**: Copy all these values! You'll need them in the next step.

---

## Step 7: Update Frontend Configuration

### 7.1 Open Frontend .env File

Navigate to:
```
C:\Users\mdk80\Desktop\Eligibility-First-Community-Access-Platform\packages\frontend\.env
```

### 7.2 Update with Your Values

Replace the values with the outputs from Step 6.3:

```env
VITE_API_BASE_URL=https://abc123xyz.execute-api.ap-south-1.amazonaws.com/v1
VITE_USER_POOL_ID=ap-south-1_AbCdEfGhI
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_AWS_REGION=ap-south-1
```

**Make sure to use YOUR actual values from the deployment output!**

Save the file.

---

## Step 8: Disable Mock Modes

### 8.1 Disable Mock Auth

Open: `packages/frontend/src/contexts/AuthContext.tsx`

Find this line (around line 17):
```typescript
const MOCK_AUTH_MODE = true;
```

Change it to:
```typescript
const MOCK_AUTH_MODE = false;
```

Save the file.

### 8.2 Disable Mock API

Open: `packages/frontend/src/services/api.ts`

Find this line (around line 3):
```typescript
const MOCK_API_MODE = true;
```

Change it to:
```typescript
const MOCK_API_MODE = false;
```

Save the file.

---

## Step 9: Seed Sample Data (Optional but Recommended)

This adds sample eligibility rules to your database:

```powershell
cd C:\Users\mdk80\Desktop\Eligibility-First-Community-Access-Platform\packages\backend
```

Set environment variables (replace with your actual values):

```powershell
$env:DYNAMODB_TABLE_NAME="EligibilityMvpStack-EligibilityRulesTable"
$env:AWS_REGION="ap-south-1"
```

Run the seed script:

```powershell
npx ts-node src/scripts/seed-eligibility-rules.ts
```

You should see:
```
✅ Successfully seeded 3 eligibility rules
```

---

## Step 10: Test the Application

### 10.1 Start Frontend

```powershell
cd C:\Users\mdk80\Desktop\Eligibility-First-Community-Access-Platform\packages\frontend
npm run dev
```

### 10.2 Open in Browser

Open: http://localhost:5173

### 10.3 Sign Up

1. Click "Sign up"
2. Enter your real email address (you'll receive a verification code)
3. Create a password (at least 8 characters, with uppercase, lowercase, and number)
4. Click "Sign Up"

### 10.4 Verify Email

1. Check your email inbox
2. You should receive an email from AWS Cognito with a 6-digit code
3. Enter the code in the verification screen
4. Click "Verify"

### 10.5 Login

1. Enter your email and password
2. Click "Login"
3. You should be redirected to the dashboard

### 10.6 Complete Profile

1. Fill out the KYC form with your details
2. Click "Save Profile"
3. You should see "Profile created successfully!"

### 10.7 Check Eligibility

1. Click "Check Eligibility" button
2. Select a scheme from the dropdown
3. Click "Evaluate Eligibility"
4. Wait a few seconds
5. You should see real eligibility results from AWS Bedrock!

---

## Troubleshooting

### Error: "Unable to resolve credentials"

**Solution**: Re-run `aws configure` and make sure you entered the correct access keys.

### Error: "User pool does not exist"

**Solution**: 
1. Check that you updated the `.env` file with correct values
2. Make sure you saved the file
3. Restart the frontend dev server

### Error: "Network request failed"

**Solution**:
1. Check that the API endpoint in `.env` is correct
2. Make sure the API Gateway was deployed successfully
3. Check AWS Console → API Gateway to verify it exists

### Email verification code not received

**Solution**:
1. Check spam/junk folder
2. Wait 2-3 minutes (sometimes delayed)
3. Make sure you entered a valid email address
4. Check AWS Console → Cognito → User Pools to see if user was created

### Deployment takes too long or fails

**Solution**:
1. Check your internet connection
2. Make sure you have sufficient AWS permissions
3. Check AWS CloudFormation console for error details
4. Try deploying again: `npx cdk deploy --all`

---

## Cost Estimate

With AWS Free Tier:
- **First 12 months**: Mostly free (within free tier limits)
- **After free tier**: Approximately $5-20/month depending on usage

Services used:
- Lambda: 1M requests/month free
- DynamoDB: 25 GB storage free
- API Gateway: 1M requests/month free
- Cognito: 50,000 MAU free
- S3: 5 GB storage free
- Bedrock: Pay per use (~$0.01 per request)

---

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Test with real email authentication
3. ✅ Upload documents
4. ✅ Check eligibility with real AI evaluation
5. 🚀 Deploy frontend to production (Vercel, Netlify, or S3)

---

## Need Help?

If you encounter any errors:
1. Copy the exact error message
2. Check which step you're on
3. Share the error with me and I'll help you fix it!
