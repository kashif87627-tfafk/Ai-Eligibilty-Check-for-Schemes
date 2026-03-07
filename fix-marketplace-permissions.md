# Fix AWS Marketplace Permissions for Bedrock

## Problem
```
AccessDeniedException: Model access is denied due to IAM user or service role is not authorized 
to perform the required AWS Marketplace actions (aws-marketplace:ViewSubscriptions, 
aws-marketplace:Subscribe)
```

## Root Cause
Your IAM user/role needs AWS Marketplace permissions to enable Bedrock models for the first time.

---

## Solution: Add Marketplace Permissions

### Option 1: Add Permissions via AWS Console (RECOMMENDED)

#### Step 1: Go to IAM Console
1. Open: https://console.aws.amazon.com/iam/
2. Click **"Users"** in the left sidebar
3. Find and click on **your username** (the one you're logged in with)

#### Step 2: Add Marketplace Policy
1. Click the **"Permissions"** tab
2. Click **"Add permissions"** button
3. Select **"Attach policies directly"**
4. Search for: **"AWSMarketplaceManageSubscriptions"**
5. Check the box next to it
6. Click **"Next"** then **"Add permissions"**

#### Step 3: Add Bedrock Full Access (Temporary)
While you're here, also add:
1. Search for: **"AmazonBedrockFullAccess"**
2. Check the box
3. Click **"Next"** then **"Add permissions"**

#### Step 4: Test Access
Wait 1-2 minutes for permissions to propagate, then run:
```powershell
node enable-bedrock.js
```

---

### Option 2: Add Custom Policy (More Secure)

If you want minimal permissions, create a custom policy:

#### Step 1: Create Custom Policy
1. Go to IAM Console → Policies
2. Click **"Create policy"**
3. Click **"JSON"** tab
4. Paste this policy:

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
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click **"Next"**
6. Name it: **"BedrockMarketplaceAccess"**
7. Click **"Create policy"**

#### Step 2: Attach to Your User
1. Go to IAM → Users → Your username
2. Click **"Add permissions"**
3. Select **"Attach policies directly"**
4. Search for: **"BedrockMarketplaceAccess"**
5. Check the box and click **"Add permissions"**

---

### Option 3: Use AWS CLI (Quick)

If you have admin access, run this command:

```powershell
# Get your username
$username = aws sts get-caller-identity --query "Arn" --output text | Split-Path -Leaf

# Attach marketplace policy
aws iam attach-user-policy --user-name $username --policy-arn arn:aws:iam::aws:policy/AWSMarketplaceManageSubscriptions

# Attach Bedrock policy
aws iam attach-user-policy --user-name $username --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

Write-Host "✅ Permissions added! Wait 2 minutes then test."
```

---

## After Adding Permissions

### Step 1: Wait 2 Minutes
IAM permissions take 1-2 minutes to propagate.

### Step 2: Test with Script
```powershell
node enable-bedrock.js
```

**Expected Output**:
```
✅ SUCCESS! Claude is now enabled for your account!
📝 Claude Response: Model enabled successfully
```

### Step 3: Test in Browser
1. Refresh http://localhost:3000
2. Go to "Discover Schemes" tab
3. Search: "Find education schemes"
4. Should work now!

---

## Troubleshooting

### Still Getting Access Denied?

1. **Check if you're using the root account**:
   - Root accounts may have restrictions
   - Try creating an IAM user with admin permissions

2. **Check Organization SCPs**:
   - If you're in an AWS Organization, Service Control Policies might block Bedrock
   - Contact your AWS admin

3. **Try a different region**:
   - Some regions may have different requirements
   - Try us-east-1 (Virginia) which usually has fewer restrictions

4. **Contact AWS Support**:
   - If nothing works, open a support ticket
   - Mention you need Bedrock model access for Claude 3 Sonnet

---

## Alternative: Use Different Model

If you can't get Claude access, you can modify the code to use a different model that doesn't require marketplace permissions:

### Models that might work without marketplace:
- Amazon Titan models (built-in to AWS)
- AI21 Labs models
- Cohere models

However, Claude 3 Sonnet is the best for this use case.

---

## Security Note

After enabling Bedrock access, you can remove the marketplace permissions if you want:
1. The model will stay enabled
2. You only need marketplace permissions for the FIRST activation
3. After that, just `bedrock:InvokeModel` permission is enough

---

## Quick Check: Do You Have Admin Access?

Run this to check your permissions:
```powershell
aws iam get-user
```

If you see your user details, you have IAM access.

If you get "AccessDenied", you'll need to:
1. Contact your AWS account administrator
2. Ask them to add the permissions above
3. Or ask them to enable Bedrock for you

---

**Next Steps**:
1. Add the marketplace permissions (Option 1 is easiest)
2. Wait 2 minutes
3. Run `node enable-bedrock.js`
4. Test in your app!
