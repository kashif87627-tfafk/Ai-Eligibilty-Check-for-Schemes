# Final Bedrock Access Fix - Payment Method Required

## Current Error
```
INVALID_PAYMENT_INSTRUMENT: A valid payment instrument must be provided.
```

## Root Cause
Your AWS account needs a valid payment method (credit/debit card) to use Bedrock models, even if you're on the free tier.

---

## Solution: Add Payment Method

### Step 1: Add Payment Method to AWS Account

1. **Go to AWS Billing Console**:
   - URL: https://console.aws.amazon.com/billing/
   - Or: AWS Console → Your Name (top right) → Billing and Cost Management

2. **Click "Payment methods"** in the left sidebar

3. **Click "Add a payment method"**

4. **Enter your credit/debit card details**:
   - Card number
   - Expiration date
   - CVV
   - Billing address

5. **Click "Add card"** or "Verify and add"

6. **Set as default** (if prompted)

### Step 2: Wait for Verification
- AWS may charge $1 for verification (refunded immediately)
- Wait 2-3 minutes for the card to be verified

### Step 3: Enable Bedrock Model
After adding payment method, try ONE of these:

#### Option A: Use Bedrock Playground (EASIEST)
1. Go to: https://console.aws.amazon.com/bedrock/
2. Region: ap-south-1 (Mumbai)
3. Click "Playgrounds" → "Chat"
4. Select "Claude 3 Sonnet"
5. Type "Hello" and press Enter
6. Model will be enabled automatically

#### Option B: Run Enable Script
```powershell
node enable-bedrock.js
```

**Expected Output**:
```
✅ SUCCESS! Claude is now enabled for your account!
```

---

## Cost Information

### Bedrock Pricing (ap-south-1):
- **Claude 3 Sonnet**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Average scheme discovery**: ~$0.01-0.02 per search
- **Average eligibility check**: ~$0.005-0.01 per check

### Free Tier:
- Bedrock does NOT have a free tier
- But costs are very low for testing/MVP

### Estimated Monthly Cost for Your MVP:
- 100 scheme discoveries: ~$1-2
- 500 eligibility checks: ~$2.50-5
- **Total**: ~$5-10/month for moderate usage

### Cost Control:
- Set up billing alerts in AWS Billing Console
- Recommended: Set alert at $10/month
- You can always disable Bedrock if costs are too high

---

## Alternative: Use Mock Mode (No Bedrock)

If you don't want to add a payment method right now, you can test with mock data:

### Enable Mock Mode:

1. **Update frontend `.env`**:
```env
VITE_MOCK_MODE=true
```

2. **Restart frontend**:
```powershell
# Stop current frontend (Ctrl+C in terminal)
cd packages/frontend
npm run dev
```

3. **What works in mock mode**:
- ✅ View schemes
- ✅ Check eligibility (rule-based)
- ✅ See confidence scores
- ❌ No AI reasoning
- ❌ No scheme discovery
- ❌ No AI suggestions

---

## After Adding Payment Method

### Test Bedrock Access:
```powershell
node enable-bedrock.js
```

### If Successful:
1. Refresh browser at http://localhost:3000
2. Go to "Discover Schemes" tab
3. Search: "Find education schemes"
4. Should work now!

### Test AI Reasoning:
1. Go to "Check Eligibility" tab
2. Select a scheme
3. Click "Check Eligibility"
4. Purple AI Analysis box should appear

---

## Troubleshooting

### Still Getting Payment Error?
1. Make sure card is verified (check email)
2. Try a different card
3. Contact AWS Support if card keeps failing

### Don't Want to Add Payment Method?
- Use mock mode (see above)
- Or use a different AI service (would require code changes)
- Or skip AI features and use rule-based only

### Want to Minimize Costs?
1. Set billing alerts
2. Use caching (already implemented)
3. Limit scheme discoveries
4. Test with mock mode first

---

## Summary

**To use AI features, you need**:
1. ✅ AWS account (you have this)
2. ✅ IAM permissions (we just added these)
3. ❌ Valid payment method (you need to add this)
4. ⏳ Bedrock model enabled (happens automatically after #3)

**Next Steps**:
1. Add payment method to AWS account
2. Wait 2-3 minutes
3. Run `node enable-bedrock.js`
4. Test in your app!

**OR use mock mode** if you don't want to add payment method yet.

---

## Questions?

**Q: Will I be charged immediately?**
A: Only when you use Bedrock. No usage = no charges (except the $1 verification, which is refunded).

**Q: Can I remove the card later?**
A: Yes, but Bedrock will stop working.

**Q: What if I exceed my budget?**
A: Set up billing alerts. AWS will email you when you hit thresholds.

**Q: Is there a way to use AI without Bedrock?**
A: Yes, but it requires code changes to use a different AI service (OpenAI, etc.).

---

**Decision Time**: Add payment method for full AI features, or use mock mode for testing?
