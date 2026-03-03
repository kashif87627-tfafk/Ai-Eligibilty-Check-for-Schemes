# AWS Cognito SMS OTP Setup Guide

## Why OTPs Aren't Working

AWS Cognito requires proper SMS configuration to send OTPs. By default, Cognito is in "sandbox mode" which has severe limitations:

- ✅ Can only send to verified phone numbers
- ❌ Cannot send to random phone numbers
- ❌ Limited to 1 SMS per day in sandbox
- ❌ Requires AWS Support ticket to enable production SMS

## Current Situation

You have 3 options:

### Option 1: Use Mock Mode (Recommended for MVP Testing)

**Best for**: Testing, development, demos without SMS costs

**Pros**:
- ✅ No SMS costs
- ✅ Works immediately
- ✅ No AWS configuration needed
- ✅ Perfect for testing UI/UX

**Cons**:
- ❌ Not real authentication
- ❌ Can't test actual SMS delivery

**How to enable**: Already done! I've re-enabled mock mode for you.

**Test credentials**:
- Username: `939843`
- Password: `939843`

### Option 2: Use Email Instead of Phone (Easier Alternative)

**Best for**: MVP without SMS costs, real authentication needed

**Pros**:
- ✅ Real AWS Cognito authentication
- ✅ No SMS costs
- ✅ No AWS Support ticket needed
- ✅ Works immediately

**Cons**:
- ❌ Requires code changes
- ❌ Users need email instead of phone

**Implementation**: See "Email Authentication Setup" section below.

### Option 3: Enable Production SMS (For Production Use)

**Best for**: Production deployment with real phone authentication

**Pros**:
- ✅ Real SMS OTPs
- ✅ Works with any phone number
- ✅ Professional user experience

**Cons**:
- ❌ Costs money (~₹0.50-1.00 per SMS in India)
- ❌ Requires AWS Support ticket (takes 24-48 hours)
- ❌ Requires spending limit increase
- ❌ Complex setup

**Implementation**: See "Production SMS Setup" section below.

---

## Option 2: Email Authentication Setup

### Step 1: Update Cognito User Pool

You need to modify the CDK stack to use email instead of phone.

**Edit `packages/infrastructure/lib/eligibility-mvp-stack.ts`:**

Find the User Pool configuration and change:

```typescript
// OLD (Phone-based)
signInAliases: {
  phone: true,
},
autoVerify: {
  phone: true,
},

// NEW (Email-based)
signInAliases: {
  email: true,
},
autoVerify: {
  email: true,
},
```

### Step 2: Redeploy Infrastructure

```powershell
cd packages\infrastructure
npx cdk deploy --all
```

### Step 3: Update Frontend Code

**Edit `packages/frontend/src/pages/LoginPage.tsx` and `SignUpPage.tsx`:**

Change phone input to email input:

```typescript
// Change from:
<input type="tel" placeholder="+91 Phone Number" />

// To:
<input type="email" placeholder="Email Address" />
```

### Step 4: Update AuthContext

**Edit `packages/frontend/src/contexts/AuthContext.tsx`:**

```typescript
// Change signup to use email
await signUp({
  username: email, // instead of phone
  password,
  options: {
    userAttributes: {
      email: email, // instead of phone_number
    },
  },
});
```

---

## Option 3: Production SMS Setup

### Step 1: Move Cognito Out of SMS Sandbox

1. **Go to AWS Console**: https://console.aws.amazon.com/sns
2. **Select Region**: ap-south-1 (Mumbai)
3. **Click "Text messaging (SMS)"** in left sidebar
4. **Click "Sandbox destination phone numbers"**
5. **Click "Move to production"**
6. **Fill out the form**:
   - Use case: One-time passwords
   - Website URL: Your website
   - Company name: Your company
   - Monthly SMS volume: Estimate (e.g., 1000)
   - Opt-in process: Describe how users consent
7. **Submit the request**

**Wait time**: 24-48 hours for AWS to review and approve.

### Step 2: Set SMS Spending Limit

1. **Go to SNS Console**: https://console.aws.amazon.com/sns
2. **Click "Text messaging (SMS)"**
3. **Click "Edit"** under "Text messaging preferences"
4. **Set spending limit**: e.g., ₹1,000/month
5. **Save changes**

### Step 3: Configure Cognito SMS Role

AWS Cognito needs an IAM role to send SMS via SNS.

**Edit `packages/infrastructure/lib/eligibility-mvp-stack.ts`:**

Add SMS configuration to User Pool:

```typescript
const userPool = new cognito.UserPool(this, 'UserPool', {
  // ... existing config ...
  
  // Add SMS configuration
  smsRole: new iam.Role(this, 'CognitoSMSRole', {
    assumedBy: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
    inlinePolicies: {
      'sns-publish': new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ['sns:Publish'],
            resources: ['*'],
          }),
        ],
      }),
    },
  }),
  smsRoleExternalId: 'eligibility-mvp-sms',
});
```

### Step 4: Redeploy

```powershell
cd packages\infrastructure
npx cdk deploy --all
```

### Step 5: Test SMS Delivery

After AWS approves your request (24-48 hours):

1. Try signing up with a real phone number
2. You should receive an OTP via SMS
3. Enter the OTP to complete signup

### SMS Costs

**India SMS Pricing** (via AWS SNS):
- Transactional SMS: ~₹0.50-1.00 per message
- Promotional SMS: ~₹0.30-0.50 per message

**Estimated monthly costs**:
- 100 signups/month: ₹50-100
- 500 signups/month: ₹250-500
- 1000 signups/month: ₹500-1000

---

## Recommended Approach for MVP

For your MVP, I recommend:

1. **Phase 1 (Now)**: Use Mock Mode
   - Test all features
   - Demo to stakeholders
   - Validate user flows
   - No costs

2. **Phase 2 (Beta)**: Switch to Email Authentication
   - Real authentication
   - No SMS costs
   - Works immediately
   - Good for beta testing

3. **Phase 3 (Production)**: Enable Production SMS
   - Submit AWS Support ticket
   - Wait for approval
   - Enable real phone authentication
   - Monitor SMS costs

---

## Current Status

✅ **Mock mode is now re-enabled** for you to continue testing.

You can:
- Login with username: `939843`, password: `939843`
- Test all features without SMS
- Demo the application
- Develop and iterate quickly

When you're ready for production, follow Option 3 above.

---

## Troubleshooting

### Error: "User pool does not have an SMS configuration"

**Solution**: Cognito User Pool needs SMS role. Follow Option 3, Step 3.

### Error: "SMS spending limit exceeded"

**Solution**: Increase spending limit in SNS console.

### Error: "Phone number not verified"

**Solution**: In Cognito console, manually verify the phone number for testing.

### SMS not received

**Possible causes**:
1. Still in sandbox mode (need to move to production)
2. Phone number format incorrect (must be +919876543210)
3. SMS spending limit reached
4. Carrier blocking AWS SMS (rare)

**Check CloudWatch logs**:
```powershell
aws logs tail /aws/lambda/CognitoSMSLambda --follow --region ap-south-1
```

---

## Quick Decision Matrix

| Scenario | Recommended Option |
|----------|-------------------|
| Testing/Development | Option 1: Mock Mode ✅ |
| MVP Demo | Option 1: Mock Mode ✅ |
| Beta Testing | Option 2: Email Auth |
| Production Launch | Option 3: Production SMS |
| Low Budget | Option 2: Email Auth |
| Need Phone Auth | Option 3: Production SMS |

---

**Current Setup**: Mock mode is enabled. You can continue testing immediately!
