# Quick Deployment Guide - AI Features

## 🚀 Quick Start (3 Commands)

### 1. Build Backend
```bash
cd packages/backend
npm run build && npm run bundle-lambda
```

### 2. Deploy to AWS
```bash
cd ../infrastructure
npx cdk deploy --all --require-approval never
```

### 3. Start Frontend
```bash
cd ../frontend
npm run dev
```

---

## ✅ Verification

### Check 1: Backend Deployed
```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `eligibility-mvp`)].FunctionName'
```

**Expected Output:**
```
[
    "eligibility-mvp-profile",
    "eligibility-mvp-eligibility",
    "eligibility-mvp-document",
    "eligibility-mvp-document-processor",
    "eligibility-mvp-scheme"  ← NEW!
]
```

### Check 2: Frontend Running
Open browser: http://localhost:5173

**Expected:**
- Login page loads
- Can sign in
- Dashboard shows tabs

### Check 3: AI Features Working

1. **AI Reasoning Box:**
   - Select a scheme
   - Click "Check Eligibility"
   - See purple AI Analysis box

2. **Scheme Discovery:**
   - Click "Discover Schemes" tab
   - Type: "Find education schemes"
   - Click Search
   - See results

---

## 🐛 Quick Fixes

### Problem: Build fails
```bash
cd packages/backend
npm install
npm run build
```

### Problem: Deploy fails
```bash
cd packages/infrastructure
npm install
npx cdk bootstrap  # If first time
npx cdk deploy --all
```

### Problem: Frontend errors
```bash
cd packages/frontend
npm install
npm run dev
```

---

## 📊 What Changed

### Backend (5 files):
1. ✅ `bedrock-integration.ts` - Enhanced AI prompts
2. ✅ `hybrid-eligibility-service.ts` - Added scenarios/suggestions
3. ✅ `scheme-handler.ts` - NEW scheme discovery
4. ✅ Infrastructure - Added scheme Lambda
5. ✅ API routes - Added 3 new endpoints

### Frontend (7 files):
1. ✅ `AIReasoningBox.tsx` - NEW component
2. ✅ `AIReasoningBox.css` - NEW styles
3. ✅ `SchemeDiscovery.tsx` - NEW component
4. ✅ `SchemeDiscovery.css` - NEW styles
5. ✅ `EligibilityEvaluation.tsx` - Updated
6. ✅ `DashboardPage.tsx` - Added tabs
7. ✅ `api.ts` - Added scheme APIs

---

## 🎯 Test Scenarios

### Scenario 1: Borderline Case
```
Profile:
- Age: 24
- Income: ₹2.05L (limit ₹2L)
- Category: OBC

Expected:
- Status: Conditionally Eligible
- AI shows scenarios
- AI suggests actions
```

### Scenario 2: Scheme Discovery
```
Search: "Find scholarship schemes"

Expected:
- Claude returns 3-5 schemes
- Each has confidence score
- Can add to database
```

### Scenario 3: Dynamic Loading
```
Action: Refresh page

Expected:
- Dropdown loads schemes from API
- Shows all schemes (including new ones)
```

---

## ⏱️ Deployment Time

- Build: ~2 minutes
- Deploy: ~3 minutes
- Total: ~5 minutes

---

## 💰 Cost Impact

**New Resources:**
- 1 additional Lambda function
- 3 additional API routes
- No new AWS services

**Estimated Cost:**
- Same as before (~$1-5/month idle)
- Bedrock calls: ~$0.01 per scheme discovery

---

## ✅ Success Criteria

- [ ] 5 Lambda functions deployed
- [ ] AI Reasoning Box shows
- [ ] Scheme discovery works
- [ ] Schemes load dynamically
- [ ] No console errors
- [ ] All features functional

---

## 🎉 You're Done!

Your AI-powered eligibility platform is now live with:
- ✅ Enhanced AI reasoning
- ✅ Automatic scheme discovery
- ✅ Beautiful UI
- ✅ Dynamic loading

**Next:** Test all features and show stakeholders!
