# Eligibility MVP Demo Preparation Guide

Complete guide for preparing and conducting a demo of the Eligibility-First Community Access Platform MVP.

## Pre-Demo Checklist

### 1. Infrastructure Deployment

- [ ] AWS credentials configured
- [ ] CDK infrastructure deployed successfully
- [ ] All Lambda functions deployed
- [ ] API Gateway endpoints accessible
- [ ] Cognito User Pool created
- [ ] DynamoDB table created
- [ ] S3 bucket created
- [ ] CloudWatch dashboard accessible

**Verification:**
```bash
# Check deployment status
aws cloudformation describe-stacks --stack-name EligibilityMvpStack --region ap-south-1

# Verify API Gateway
curl https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/health
```

### 2. Sample Data Seeded

- [ ] Eligibility rules seeded (3 schemes)
- [ ] Sample user profiles available
- [ ] Test documents prepared

**Verification:**
```bash
# Run seed script
npm run seed:dev

# Verify data in DynamoDB
aws dynamodb scan --table-name eligibility-mvp-table --limit 5 --region ap-south-1
```

### 3. Frontend Setup

- [ ] Frontend built successfully
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Authentication working
- [ ] API calls successful

**Verification:**
```bash
cd packages/frontend
npm run dev
# Open http://localhost:5173
```

### 4. Test Accounts Created

- [ ] Demo user account created in Cognito
- [ ] Phone number verified
- [ ] Test profile created
- [ ] Sample documents uploaded

**Demo Credentials:**
- Phone: +91XXXXXXXXXX (use your test number)
- OTP: (will be sent during demo)

---

## Demo Flow

### Part 1: Introduction (2 minutes)

**Talking Points:**
- Problem: Complex eligibility criteria, language barriers, lack of clarity
- Solution: AI-powered eligibility evaluation with explainability
- Technology: AWS serverless (Lambda, DynamoDB, Bedrock), React frontend
- MVP Scope: 3 government schemes, hybrid rule-based + LLM evaluation

**Show:**
- Architecture diagram (docs/ARCHITECTURE.md)
- Project structure overview

---

### Part 2: User Journey (10 minutes)

#### 2.1 Sign Up & Authentication (2 minutes)

**Demo Steps:**
1. Open frontend: http://localhost:5173
2. Click "Sign Up"
3. Enter phone number: +91XXXXXXXXXX
4. Enter OTP received via SMS
5. Successfully logged in

**Talking Points:**
- Amazon Cognito for authentication
- Phone number + OTP verification
- Secure JWT token-based authentication
- Optional MFA support

**Show:**
- Sign up page
- OTP verification
- Successful login redirect to dashboard

#### 2.2 Create User Profile (3 minutes)

**Demo Steps:**
1. Navigate to "Create Profile" page
2. Fill in user details:
   - Age Range: 18-25
   - Gender: Male
   - State: Karnataka
   - District: Bangalore Urban
   - Rural/Urban: Urban
   - Education: Graduate
   - Employment: Student
   - Income: Below ₹50,000
   - Category: SC (with consent)
   - Disability: None
3. Check consent boxes
4. Submit profile

**Talking Points:**
- Structured data collection for eligibility evaluation
- Consent tracking for sensitive data (category, income, disability)
- Privacy-first design
- Data validation and error handling

**Show:**
- User profile form with all fields
- Consent checkboxes
- Form validation
- Success message after submission

#### 2.3 Evaluate Eligibility (3 minutes)

**Demo Steps:**
1. Navigate to "Check Eligibility" page
2. Select scheme: "Prime Minister Scholarship Scheme"
3. Click "Check Eligibility"
4. View evaluation result:
   - Status: Strongly Eligible
   - Confidence Score: 92%
   - Explanation: Why eligible
   - Matched Criteria: Age, employment, income, category
   - Missing Documents: Aadhaar, income certificate, etc.
   - Next Steps: Upload documents, apply online

**Talking Points:**
- Hybrid evaluation: Rule-based + LLM reasoning
- Confidence scoring (High/Medium/Low)
- Explainability: Why/why-not eligible
- Missing criteria identification
- Document gap detection
- Actionable next steps

**Show:**
- Scheme selection dropdown
- Loading state during evaluation
- Eligibility result card with confidence badge
- Explanation text (why eligible)
- Matched criteria list
- Required documents list
- Next steps guidance

#### 2.4 Upload Documents (2 minutes)

**Demo Steps:**
1. Navigate to "Upload Documents" page
2. Drag and drop Aadhaar card PDF
3. View upload progress
4. See document status: "Pending Verification"
5. Upload income certificate
6. View list of uploaded documents

**Talking Points:**
- S3 pre-signed URL for secure uploads
- Drag-and-drop interface
- File validation (size, type)
- Document metadata storage
- Automatic processing via Lambda
- (Future: OCR and data extraction)

**Show:**
- Document upload component
- Drag-and-drop area
- Upload progress bar
- Document list with status
- Missing documents highlighted

---

### Part 3: Technical Deep Dive (8 minutes)

#### 3.1 Architecture Overview (2 minutes)

**Show:**
- Architecture diagram (docs/ARCHITECTURE.md)
- AWS services used:
  - API Gateway (REST API)
  - Lambda (Node.js 20.x)
  - DynamoDB (single-table design)
  - S3 (document storage)
  - Cognito (authentication)
  - Bedrock (Claude 3 Sonnet)
  - CloudWatch (monitoring)

**Talking Points:**
- Serverless architecture for scalability and cost-efficiency
- Event-driven design
- Pay-per-use pricing model
- No infrastructure management

#### 3.2 Eligibility Evaluation Engine (3 minutes)

**Show:**
- Code: `packages/backend/src/services/rule-evaluation-engine.ts`
- Sample eligibility rule: `packages/backend/src/data/sample-eligibility-rules.ts`

**Talking Points:**
- **Rule-Based Evaluation:**
  - Deterministic matching against criteria
  - Weighted scoring
  - Confidence calculation
  - Fast and cost-effective

- **LLM Reasoning (Bedrock):**
  - Called only for ambiguous cases (40-70% confidence)
  - Contextual understanding
  - Explanation generation
  - Cost optimization via caching

- **Hybrid Approach:**
  - Best of both worlds
  - Rules for clear-cut cases
  - LLM for nuanced scenarios
  - Reduced API costs

**Demo:**
```bash
# Show rule evaluation example
cd packages/backend
npm run example:rule-evaluation

# Show Bedrock integration example
npm run example:bedrock-integration
```

#### 3.3 Monitoring & Cost Controls (3 minutes)

**Show:**
- CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=Eligibility-MVP-Dashboard

**Metrics:**
- API request count and latency
- Lambda invocations and errors
- Bedrock API calls and token usage
- Cache hit rate
- Error rates

**Alarms:**
- High API error rate (>5%)
- High API latency (>5s)
- Lambda errors and throttles
- High Bedrock costs
- Low cache hit rate

**Budget Alerts:**
- ₹1,000, ₹3,000, ₹5,000 thresholds
- Email/SMS notifications

**Talking Points:**
- Real-time monitoring
- Proactive alerting
- Cost tracking and optimization
- Performance metrics
- Error tracking

---

### Part 4: Testing & Quality (5 minutes)

#### 4.1 Unit Tests

**Demo:**
```bash
# Run backend tests
cd packages/backend
npm test

# Run frontend tests
cd packages/frontend
npm test

# Run infrastructure tests
cd packages/infrastructure
npm test
```

**Show:**
- Test coverage: 245 backend tests, 31 frontend tests, 23 infrastructure tests
- All tests passing
- Test structure and organization

**Talking Points:**
- Comprehensive test coverage
- Unit tests for business logic
- Integration tests for API endpoints
- Infrastructure tests for CDK stack
- Continuous testing during development

#### 4.2 Sample Test Scenarios

**Show:**
- Sample user profiles: `packages/backend/src/data/sample-user-profiles.ts`
- Test scenarios:
  - Strongly eligible (high confidence)
  - Conditionally eligible (medium confidence)
  - Not eligible (low confidence)
  - Edge cases (missing data, no consent)

**Demo:**
```bash
# Run eligibility evaluation with sample profiles
cd packages/backend
npm run example:rule-evaluation
```

---

### Part 5: Deployment & Operations (5 minutes)

#### 5.1 Deployment Process

**Demo:**
```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

**Show:**
- Deployment script: `scripts/deploy.sh`
- Environment configurations: `config/environments/`
- Deployment output with stack details

**Talking Points:**
- One-command deployment
- Environment-specific configurations
- Automated build and deploy
- Infrastructure as code (CDK)
- Rollback capabilities

#### 5.2 Data Seeding

**Demo:**
```bash
# Seed sample data
npm run seed:dev
```

**Show:**
- Seed script: `scripts/seed.sh`
- Sample schemes seeded
- Sample profiles available

#### 5.3 Documentation

**Show:**
- API Documentation: `docs/API_DOCUMENTATION.md`
- Setup Guide: `docs/SETUP_GUIDE.md`
- AWS Setup: `docs/AWS_SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`

**Talking Points:**
- Comprehensive documentation
- API reference with examples
- Step-by-step setup instructions
- Architecture diagrams
- Troubleshooting guides

---

## Demo Scenarios

### Scenario 1: Strongly Eligible Student

**Profile:**
- Age: 18-25
- Employment: Student
- Income: Below ₹50k
- Category: SC
- Education: Graduate

**Expected Result:**
- Scheme: PM Scholarship
- Status: Strongly Eligible
- Confidence: 90%+
- Explanation: Meets all criteria

### Scenario 2: Conditionally Eligible (Income Boundary)

**Profile:**
- Age: 18-25
- Employment: Student
- Income: ₹2L-₹5L (above threshold)
- Disability: Physical

**Expected Result:**
- Scheme: PM Scholarship
- Status: Conditionally Eligible
- Confidence: 50-60%
- Explanation: Income exceeds limit, but may qualify under disability quota

### Scenario 3: Not Eligible (Employed Professional)

**Profile:**
- Age: 26-35
- Employment: Employed
- Income: Above ₹5L
- Education: Postgraduate

**Expected Result:**
- Scheme: PM Scholarship
- Status: Not Eligible
- Confidence: <30%
- Explanation: Employed and high income disqualify

### Scenario 4: Missing Data (Edge Case)

**Profile:**
- Age: 18-25
- Missing: Employment, income, category
- No consent for sensitive data

**Expected Result:**
- Status: Ambiguous
- Confidence: Low
- Explanation: Insufficient data for evaluation
- Action: Request missing information

---

## Q&A Preparation

### Technical Questions

**Q: Why use serverless architecture?**
A: Scalability, cost-efficiency (pay-per-use), no infrastructure management, auto-scaling, and reduced operational overhead.

**Q: How do you handle Bedrock API costs?**
A: Hybrid evaluation (rules first), caching (15 min TTL), rate limiting, and monitoring with budget alerts.

**Q: What about data privacy?**
A: Consent tracking, encryption at rest and in transit, minimal data collection, GDPR-ready design, and data deletion capabilities.

**Q: How do you ensure accuracy?**
A: Hybrid approach (rules + LLM), confidence scoring, explainability, human-in-the-loop (future), and continuous testing.

**Q: What's the deployment process?**
A: One-command deployment via CDK, environment-specific configs, automated testing, and rollback capabilities.

### Business Questions

**Q: What's the estimated cost?**
A: ₹3,000-5,000/month for MVP usage, with AWS Free Tier covering many services initially.

**Q: How many schemes can it handle?**
A: Currently 3 sample schemes, but designed to scale to hundreds with minimal changes.

**Q: What's the user experience like?**
A: Simple, intuitive interface with step-by-step guidance, explainable results, and actionable next steps.

**Q: How long does evaluation take?**
A: <2 seconds for rule-based, <5 seconds with LLM reasoning, with caching reducing repeat evaluations.

**Q: What's next after MVP?**
A: Voice input/output, multilingual support, DigiLocker integration, offline capabilities, and more schemes.

---

## Post-Demo Follow-Up

### Materials to Share

1. **Documentation:**
   - API Documentation
   - Setup Guide
   - Architecture Overview

2. **Code Repository:**
   - GitHub link (if public)
   - Access instructions

3. **Demo Recording:**
   - Screen recording of demo
   - Walkthrough video

4. **Cost Estimates:**
   - Detailed breakdown
   - Scaling projections

5. **Roadmap:**
   - Phase 2 features
   - Timeline estimates

### Next Steps

1. **Pilot Deployment:**
   - Select pilot location
   - Onboard test users
   - Gather feedback

2. **Feature Prioritization:**
   - Review feedback
   - Prioritize enhancements
   - Plan Phase 2

3. **Production Readiness:**
   - Security hardening
   - Performance optimization
   - Compliance review

4. **Training:**
   - User training materials
   - Admin documentation
   - Support procedures

---

## Troubleshooting During Demo

### Issue: API not responding

**Solution:**
1. Check API Gateway URL
2. Verify Lambda functions are deployed
3. Check CloudWatch logs for errors
4. Restart frontend dev server

### Issue: Authentication failing

**Solution:**
1. Verify Cognito User Pool ID and Client ID
2. Check phone number format (+91XXXXXXXXXX)
3. Ensure OTP is correct
4. Check network connectivity

### Issue: Evaluation taking too long

**Solution:**
1. Check Bedrock API status
2. Verify cache is working
3. Check Lambda timeout settings
4. Review CloudWatch metrics

### Issue: Documents not uploading

**Solution:**
1. Check S3 bucket permissions
2. Verify pre-signed URL generation
3. Check file size limits
4. Review CORS configuration

---

## Demo Tips

1. **Practice:** Run through the demo multiple times before the actual presentation
2. **Backup:** Have screenshots/videos ready in case of technical issues
3. **Timing:** Keep to the schedule, allocate time for Q&A
4. **Engagement:** Ask questions, encourage interaction
5. **Clarity:** Explain technical concepts in simple terms
6. **Focus:** Highlight key features and benefits
7. **Confidence:** Be prepared for unexpected questions
8. **Follow-up:** Collect feedback and action items

---

## Success Metrics

After the demo, evaluate success based on:

- [ ] All demo scenarios completed successfully
- [ ] Technical questions answered satisfactorily
- [ ] Audience engagement and interest
- [ ] Positive feedback received
- [ ] Next steps identified
- [ ] Follow-up meetings scheduled

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [AWS Setup](./AWS_SETUP.md)
- [Architecture](./ARCHITECTURE.md)
- [GitHub Repository](#)
- [Project Roadmap](#)
