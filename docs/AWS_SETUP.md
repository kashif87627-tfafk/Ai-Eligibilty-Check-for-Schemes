# AWS Setup Guide

This guide walks you through setting up AWS credentials and permissions for deploying the Eligibility MVP.

## Prerequisites

- AWS Account (create one at https://aws.amazon.com)
- AWS CLI installed (https://aws.amazon.com/cli/)
- Node.js 20.x or later
- npm or yarn package manager

## Step 1: Create IAM User

1. Log in to AWS Console: https://console.aws.amazon.com
2. Navigate to IAM (Identity and Access Management)
3. Click "Users" → "Add users"
4. User name: `eligibility-mvp-deployer`
5. Select "Programmatic access"
6. Click "Next: Permissions"

## Step 2: Attach Policies

Attach the following AWS managed policies:

### Required Policies:
- `AWSCloudFormationFullAccess` - For CDK deployments
- `AmazonDynamoDBFullAccess` - For DynamoDB table management
- `AmazonS3FullAccess` - For S3 bucket management
- `AWSLambda_FullAccess` - For Lambda function deployment
- `AmazonAPIGatewayAdministrator` - For API Gateway setup
- `AmazonCognitoPowerUser` - For Cognito user pool management
- `CloudWatchFullAccess` - For monitoring and logs
- `IAMFullAccess` - For creating Lambda execution roles

### Bedrock Access:
Create a custom inline policy for Bedrock access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

### Budget Access:
Add budget management permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "budgets:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 3: Enable Bedrock Model Access

1. Navigate to Amazon Bedrock console: https://console.aws.amazon.com/bedrock
2. Select region: **ap-south-1 (Mumbai)**
3. Click "Model access" in the left sidebar
4. Click "Manage model access"
5. Find "Anthropic" section
6. Enable "Claude 3 Sonnet"
7. Click "Save changes"
8. Wait for access to be granted (usually takes a few minutes)

**Note:** Bedrock model access is region-specific. Ensure you enable it in ap-south-1.

## Step 4: Configure AWS CLI

### Option 1: Using AWS Configure (Recommended)

```bash
aws configure
```

Enter the following when prompted:
- AWS Access Key ID: [Your access key from Step 2]
- AWS Secret Access Key: [Your secret key from Step 2]
- Default region name: `ap-south-1`
- Default output format: `json`

### Option 2: Using Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_DEFAULT_REGION=ap-south-1
```

Add these to your `~/.bashrc` or `~/.zshrc` for persistence.

### Option 3: Using AWS Profiles

For multiple environments, use named profiles:

```bash
# Configure dev profile
aws configure --profile eligibility-dev

# Configure prod profile
aws configure --profile eligibility-prod
```

Use profiles in deployment:
```bash
export AWS_PROFILE=eligibility-dev
npm run deploy
```

## Step 5: Verify AWS Credentials

Test your credentials:

```bash
# Check identity
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/eligibility-mvp-deployer"
# }
```

Test Bedrock access:

```bash
aws bedrock list-foundation-models --region ap-south-1 --by-provider anthropic
```

## Step 6: Bootstrap CDK

Before first deployment, bootstrap CDK in your account:

```bash
cd packages/infrastructure
npx cdk bootstrap aws://ACCOUNT_ID/ap-south-1
```

Replace `ACCOUNT_ID` with your AWS account ID from Step 5.

## Security Best Practices

### 1. Use IAM Roles for Production

For production deployments, use IAM roles instead of access keys:
- Create an EC2 instance or use AWS CloudShell
- Attach an IAM role with required permissions
- Deploy from the instance (no access keys needed)

### 2. Rotate Access Keys Regularly

```bash
# Create new access key
aws iam create-access-key --user-name eligibility-mvp-deployer

# Delete old access key
aws iam delete-access-key --user-name eligibility-mvp-deployer --access-key-id OLD_KEY_ID
```

### 3. Enable MFA for IAM User

1. Go to IAM → Users → eligibility-mvp-deployer
2. Click "Security credentials" tab
3. Click "Manage" next to "Assigned MFA device"
4. Follow the wizard to set up MFA

### 4. Use AWS Secrets Manager for Sensitive Data

Store sensitive configuration in AWS Secrets Manager:

```bash
# Store API keys
aws secretsmanager create-secret \
  --name eligibility-mvp/api-keys \
  --secret-string '{"key":"value"}' \
  --region ap-south-1
```

### 5. Restrict IP Access (Optional)

Add IP-based conditions to IAM policies:

```json
{
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": "YOUR_IP_ADDRESS/32"
    }
  }
}
```

## Troubleshooting

### Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solution:** Ensure Bedrock model access is enabled (Step 3) and the IAM policy includes Bedrock permissions.

### Error: "Unable to locate credentials"

**Solution:** Run `aws configure` or set environment variables (Step 4).

### Error: "Access Denied" during CDK bootstrap

**Solution:** Ensure the IAM user has CloudFormation and S3 permissions.

### Error: "Region not supported"

**Solution:** Verify you're using `ap-south-1` region. Some services may not be available in all regions.

### Error: "Rate exceeded" or "Throttling"

**Solution:** AWS has API rate limits. Wait a few minutes and retry. For production, request limit increases.

## Cost Estimation

### Free Tier Eligible Services:
- Lambda: 1M requests/month free
- DynamoDB: 25 GB storage + 25 WCU/RCU free
- S3: 5 GB storage free
- CloudWatch: 10 custom metrics free

### Paid Services:
- **Bedrock (Claude 3 Sonnet):**
  - Input: $0.003 per 1K tokens
  - Output: $0.015 per 1K tokens
  - Estimated: ₹500-2000/month (depends on usage)

- **API Gateway:**
  - $3.50 per million requests
  - Estimated: ₹200-500/month

- **Cognito:**
  - First 50,000 MAUs free
  - Estimated: ₹0/month (within free tier)

**Total Estimated Cost:** ₹3,000-5,000/month for MVP usage

## Budget Alerts

The deployment automatically creates budget alerts at:
- ₹1,000 (80% and 100% thresholds)
- ₹3,000 (80% and 100% thresholds)
- ₹5,000 (80% and 100% thresholds)

You'll receive SNS notifications when thresholds are exceeded.

## Next Steps

After completing AWS setup:

1. Deploy the infrastructure:
   ```bash
   npm run deploy
   ```

2. Seed sample data:
   ```bash
   npm run seed
   ```

3. Test the API:
   ```bash
   npm run test:api
   ```

4. Access the CloudWatch dashboard to monitor your deployment

## Support

For issues or questions:
- Check AWS documentation: https://docs.aws.amazon.com
- Review CloudWatch logs for error details
- Contact AWS Support (if you have a support plan)
