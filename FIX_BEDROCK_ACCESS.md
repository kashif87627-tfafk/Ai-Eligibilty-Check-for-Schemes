# Fix Bedrock Model Access Issue

## Problem
The scheme discovery feature is failing with:
```
AccessDeniedException: Model access is denied due to IAM user or service role is not authorized to perform the required AWS Marketplace actions
```

## Solution: Enable Claude Model Access (NEW AWS PROCESS)

AWS has changed how Bedrock access works. Models are now auto-enabled on first use, but you need to invoke them through the console first.

### Method 1: Use Bedrock Playground (EASIEST)

1. **Go to Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. **Select Region**: Make sure you're in **ap-south-1 (Mumbai)** region (top right)
3. **Click "Playgrounds"** in the left sidebar
4. **Click "Chat"** to open the chat playground
5. **Select Model**: Choose **"Claude 3 Sonnet"** from the model dropdown
6. **Send a test message**: Type "Hello" and press Enter
7. **Wait for response**: Claude will respond, which enables the model for your account
8. **Done!** Model is now enabled

### Method 2: Use Model Catalog

1. **Go to Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. **Select Region**: Make sure you're in **ap-south-1 (Mumbai)** region
3. **Click "Model catalog"** in the left sidebar
4. **Find "Claude 3 Sonnet"**: Search or scroll to find it
5. **Click on the model card**
6. **Click "Request model access"** or **"Enable"** button
7. **Fill out use case form** (if required for Anthropic models)
8. **Submit and wait** 1-2 minutes for approval

### Method 3: Run Enable Script (After Console Access)

Once you've enabled through the console, you can verify with:
```powershell
node enable-bedrock.js
```

This will test if Claude is accessible and show a success message.

## After Enabling

1. **Wait 2 minutes** for the access to propagate
2. **Refresh your browser** at http://localhost:3000
3. **Go to "Discover Schemes" tab**
4. **Search for**: "Find education schemes for students"
5. **Should work now!**

## What's the Point of AI Scheme Discovery?

You asked: "what's the point if the AI scheme finder gives this error"

The AI Scheme Discovery feature is powerful because:

1. **Automatic Scheme Addition**: Claude searches the web for government schemes and structures the data
2. **No Manual Entry**: You don't need to manually add scheme details, eligibility criteria, documents, etc.
3. **Always Up-to-Date**: Discover new schemes as they're announced
4. **Natural Language**: Just ask "Find pension schemes" instead of filling forms
5. **Instant Availability**: Discovered schemes immediately appear in the dropdown for eligibility checking

**Example Flow**:
- You: "Find scholarship schemes for students in Karnataka"
- Claude: Searches and returns 3-5 schemes with full details
- You: Click "Add to Database" on one
- Scheme: Now appears in the eligibility check dropdown
- You: Select it and check your eligibility
- AI: Analyzes your profile and shows reasoning

Without this feature, you'd need to manually create each scheme with all criteria, documents, etc. With it, Claude does the heavy lifting!

### Step 4: Verify Access
After access is granted, refresh your frontend and try:
1. Go to "Discover Schemes" tab
2. Search for: "Find education schemes for students"
3. Should work now!

## Alternative: Test Scheme List First

While waiting for Bedrock access, you can test if the scheme list endpoint works:

1. Refresh your browser at http://localhost:3000
2. The dropdown should now load the 3 existing schemes from the database
3. You can check eligibility for those schemes

The scheme discovery feature will work once Bedrock access is enabled.

## Quick Test Commands

### Test Scheme List (should work now):
```powershell
curl https://csmvf1r14h.execute-api.ap-south-1.amazonaws.com/v1/api/v1/schemes/list
```

### Check CloudWatch Logs:
```powershell
aws logs tail /aws/lambda/eligibility-mvp-scheme --since 2m --follow
```

## What We Fixed

1. ✅ Fixed DynamoDB query issue (changed from Query to Scan)
2. ✅ Added DYNAMODB_TABLE_NAME environment variable
3. ✅ Redeployed all Lambda functions
4. ⏳ Waiting for Bedrock model access approval

## Next Steps

1. Enable Claude model access in Bedrock console (see steps above)
2. Refresh frontend - scheme list should load
3. Try scheme discovery once Bedrock access is granted
4. Test AI reasoning box with eligibility checks
