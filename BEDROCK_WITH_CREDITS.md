# Using Bedrock with AWS Credits

## Your Situation
- ✅ You have AWS credits
- ✅ Credits will cover Bedrock costs
- ❌ AWS still requires a payment method on file

## Why AWS Requires Payment Method

Even with credits, AWS requires a backup payment method for:
1. **Marketplace services** (like Anthropic Claude)
2. **Services that can scale quickly** (to prevent abuse)
3. **Backup if credits run out**

**Your credits WILL be used first** - the card is only charged if credits are exhausted.

---

## Solutions

### Option 1: Add Payment Method (Recommended)

**Why it's safe**:
- Your AWS credits will be used FIRST
- Card is only charged if credits run out
- You can set billing alerts to prevent overages
- You can remove the card after enabling Bedrock

**Steps**:
1. Go to: https://console.aws.amazon.com/billing/
2. Add credit/debit card
3. Enable Bedrock (card won't be charged)
4. Your credits cover all Bedrock usage
5. (Optional) Remove card later if you want

**Cost with your credits**:
- $0 until credits are exhausted
- Then ~$5-10/month for moderate usage

---

### Option 2: Try Bedrock Console Directly

Sometimes the console allows enabling without the script. Try this:

1. **Go to Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. **Region**: ap-south-1 (Mumbai)
3. **Click "Playgrounds"** → **"Chat"**
4. **Select "Claude 3 Sonnet"** from dropdown
5. **Try to send a message**

**Possible outcomes**:
- ✅ It works! Model is enabled
- ❌ Same payment error
- ⚠️ Asks you to enable model access (follow prompts)

---

### Option 3: Contact AWS Support

If you have AWS credits but can't add a payment method:

1. **Open AWS Support ticket**:
   - Go to: https://console.aws.amazon.com/support/
   - Click "Create case"
   - Select "Account and billing support"

2. **Explain your situation**:
   ```
   I have AWS credits but cannot enable Amazon Bedrock due to 
   INVALID_PAYMENT_INSTRUMENT error. I want to use my credits 
   for Bedrock. Can you enable Claude 3 Sonnet for my account?
   
   Account ID: 947632012971
   Region: ap-south-1
   Model: anthropic.claude-3-sonnet-20240229-v1:0
   ```

3. **AWS Support can**:
   - Enable Bedrock for you
   - Explain credit usage policy
   - Help with payment method issues

---

### Option 4: Use Virtual/Prepaid Card

If you don't want to use your main card:

1. **Get a virtual card**:
   - Privacy.com (US)
   - Revolut (Global)
   - Your bank's virtual card service

2. **Set a low limit** (e.g., $10)

3. **Add to AWS**

4. **Your credits will still be used first**

---

### Option 5: Use Mock Mode (Temporary)

While you sort out payment:

1. Edit `packages/frontend/.env`:
   ```env
   VITE_MOCK_MODE=true
   ```

2. Restart frontend

3. Test the platform without AI features

4. Add payment method later when ready

---

## How AWS Credits Work with Bedrock

### Credit Usage Priority:
1. **AWS credits are used FIRST**
2. **Payment method is only charged if credits run out**
3. **You get email alerts before credits are exhausted**

### Example:
- You have: $100 in AWS credits
- Bedrock usage: $5/month
- **Month 1-20**: Credits cover everything ($0 charged to card)
- **Month 21**: Credits exhausted, card is charged $5
- **You get alerts** before this happens

### Setting Up Alerts:
1. Go to AWS Billing → Budgets
2. Create budget: $100 (your credit amount)
3. Set alert at 80% ($80 used)
4. You'll know when credits are running low

---

## Recommended Approach

**For your situation (with AWS credits)**:

1. **Add a payment method** (even a prepaid card with $10)
   - Your credits will be used first
   - Card is backup only
   - You can remove it later

2. **Set up billing alerts**
   - Alert at 80% of credits used
   - You'll have warning before card is charged

3. **Enable Bedrock**
   - Run: `node enable-bedrock.js`
   - Or use Bedrock Playground

4. **Test AI features**
   - All costs covered by your credits
   - No surprise charges

5. **(Optional) Remove card later**
   - After testing
   - If you don't plan to use Bedrock long-term

---

## FAQ

**Q: Will adding a card charge me immediately?**
A: AWS may charge $1 for verification (refunded immediately). After that, your credits are used first.

**Q: Can I remove the card after enabling Bedrock?**
A: Yes, but Bedrock will stop working when you try to use it again.

**Q: What if my credits run out?**
A: You'll get email alerts. You can then decide to add more credits, use the card, or disable Bedrock.

**Q: Can I use a debit card?**
A: Yes, any valid credit/debit card works.

**Q: What about prepaid cards?**
A: Some work, some don't. Virtual cards from services like Privacy.com usually work.

---

## Bottom Line

**AWS policy**: Payment method required for Bedrock, even with credits.

**Your options**:
1. ✅ Add payment method (credits used first, card is backup)
2. ⏳ Contact AWS Support (they might enable it for you)
3. 🧪 Use mock mode (test without AI features)

**Recommendation**: Add a payment method. Your credits will cover everything, and you can remove the card later if needed.

---

**Next**: Try the Bedrock Playground first (Option 2 above) - it might work without the script!
