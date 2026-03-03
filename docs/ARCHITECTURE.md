# Eligibility MVP Architecture

Technical architecture documentation for the Eligibility-First Community Access Platform MVP.

## Architecture Overview

The Eligibility MVP follows a serverless, event-driven architecture built entirely on AWS services. The system is designed for scalability, cost-efficiency, and low operational overhead.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │  Voice IVR   │              │
│  │   (React)    │  │  (Future)    │  │  (Future)    │              │
│  └──────┬───────┘  └──────────────┘  └──────────────┘              │
└─────────┼──────────────────────────────────────────────────────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Authentication Layer                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Amazon Cognito User Pool                        │   │
│  │  • Phone/Email authentication                                │   │
│  │  • OTP verification                                          │   │
│  │  • JWT token generation                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────────┘
          │
          │ JWT Token
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Amazon API Gateway (REST API)                   │   │
│  │  • Cognito Authorizer                                        │   │
│  │  • Rate Limiting (10 req/sec)                                │   │
│  │  • Request/Response validation                               │   │
│  │  • CORS configuration                                        │   │
│  │  • CloudWatch logging                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────────┘
          │
          │ Lambda Proxy Integration
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Layer (Lambda)                      │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Profile        │  │  Eligibility    │  │  Document       │     │
│  │  Handler        │  │  Handler        │  │  Handler        │     │
│  │                 │  │                 │  │                 │     │
│  │  • Create       │  │  • Evaluate     │  │  • Upload URL   │     │
│  │  • Read         │  │  • Re-evaluate  │  │  • Metadata     │     │
│  │  • Update       │  │  • History      │  │  • List         │     │
│  │  • Delete       │  │  • All schemes  │  │  • Status       │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                     │              │
│           └────────────────────┼─────────────────────┘              │
│                                │                                    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Hybrid Eligibility Service                      │   │
│  │  ┌────────────────────┐  ┌────────────────────┐             │   │
│  │  │ Rule Evaluation    │  │ LLM Reasoning      │             │   │
│  │  │ Engine             │  │ (Bedrock)          │             │   │
│  │  │                    │  │                    │             │   │
│  │  │ • Deterministic    │  │ • Contextual       │             │   │
│  │  │ • Confidence       │  │ • Explanation      │             │   │
│  │  │ • Fast             │  │ • Ambiguous cases  │             │   │
│  │  └────────────────────┘  └────────────────────┘             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Supporting Services                             │   │
│  │  • Evaluation Cache (15 min TTL)                             │   │
│  │  • Rate Limiter                                              │   │
│  │  • Metrics Publisher                                         │   │
│  │  • Document Gap Detection                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────┬─────────────────────────────────────────┬─────────────────┘
          │                                         │
          │                                         │
          ▼                                         ▼
┌──────────────────────────┐          ┌──────────────────────────┐
│    Data Layer            │          │    AI/ML Layer           │
│                          │          │                          │
│  ┌────────────────────┐  │          │  ┌────────────────────┐  │
│  │  Amazon DynamoDB   │  │          │  │  Amazon Bedrock    │  │
│  │  (Single Table)    │  │          │  │  (Claude 3 Sonnet) │  │
│  │                    │  │          │  │                    │  │
│  │  • User Profiles   │  │          │  │  • Contextual      │  │
│  │  • Eligibility     │  │          │  │    reasoning       │  │
│  │    Rules           │  │          │  │  • Explanation     │  │
│  │  • Evaluations     │  │          │  │    generation      │  │
│  │  • Documents       │  │          │  │  • Ambiguity       │  │
│  │    Metadata        │  │          │  │    resolution      │  │
│  │  • Cache           │  │          │  └────────────────────┘  │
│  └────────────────────┘  │          └──────────────────────────┘
│                          │
│  ┌────────────────────┐  │
│  │  Amazon S3         │  │
│  │                    │  │
│  │  • Document        │  │
│  │    Storage         │  │
│  │  • Versioning      │  │
│  │  • Encryption      │  │
│  │  • Lifecycle       │  │
│  └────────────────────┘  │
└──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Monitoring & Observability                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Amazon CloudWatch                               │   │
│  │  • Logs (7-day retention)                                    │   │
│  │  • Metrics (API, Lambda, Bedrock, Cache)                     │   │
│  │  • Dashboard (real-time monitoring)                          │   │
│  │  • Alarms (error rate, latency, cost)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              AWS Budgets                                     │   │
│  │  • Budget alerts (₹1k, ₹3k, ₹5k)                            │   │
│  │  • Cost tracking                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Amazon SNS                                      │   │
│  │  • Alarm notifications                                       │   │
│  │  • Budget alerts                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Layer (React + Vite)

**Technology:** React 18, TypeScript, Vite, AWS Amplify

**Components:**
- `UserProfileForm` - Collects user demographic and eligibility data
- `EligibilityEvaluation` - Displays eligibility results with confidence scores
- `DocumentUpload` - Handles document upload with drag-and-drop
- `AuthContext` - Manages authentication state with Cognito

**Key Features:**
- Responsive design for mobile and desktop
- Form validation with consent tracking
- Real-time eligibility evaluation
- Document upload with progress tracking

**Deployment:** Static hosting (S3 + CloudFront in future)

---

### 2. Authentication Layer (Amazon Cognito)

**Configuration:**
- User Pool with phone/email authentication
- OTP verification for phone numbers
- JWT token generation with 1-hour expiry
- Optional MFA support

**Security:**
- Password policy: 8+ chars, uppercase, lowercase, digits
- Account recovery via phone/email
- Prevent user enumeration attacks

---

### 3. API Gateway Layer

**Configuration:**
- REST API with regional endpoint
- Cognito User Pool Authorizer
- Rate limiting: 10 req/sec, 20 burst
- Usage plan: 10,000 req/month
- CORS enabled for frontend origin

**Endpoints:**
- `/profiles/*` - User profile management
- `/api/v1/eligibility/*` - Eligibility evaluation
- `/documents/*` - Document management

**Monitoring:**
- CloudWatch Logs (INFO level)
- Request/response logging
- X-Ray tracing enabled

---

### 4. Application Layer (AWS Lambda)

#### Profile Handler
**Runtime:** Node.js 20.x  
**Memory:** 512 MB  
**Timeout:** 30 seconds

**Operations:**
- Create user profile
- Get profile by ID or phone
- Update profile
- Delete profile

**Data Validation:**
- Required fields: userId, phoneNumber, ageRange, location
- Optional fields: category, disability (with consent)
- Consent tracking for sensitive data

#### Eligibility Handler
**Runtime:** Node.js 20.x  
**Memory:** 1024 MB  
**Timeout:** 60 seconds

**Operations:**
- Evaluate eligibility for single scheme
- Evaluate all schemes
- Re-evaluate after profile update
- Get evaluation history

**Evaluation Flow:**
1. Check cache for recent evaluation
2. Run rule-based evaluation
3. If ambiguous, call Bedrock for contextual reasoning
4. Merge results and calculate confidence score
5. Generate explanation (why/why-not)
6. Identify missing criteria and documents
7. Cache result for 15 minutes
8. Return structured response

#### Document Handler
**Runtime:** Node.js 20.x  
**Memory:** 512 MB  
**Timeout:** 30 seconds

**Operations:**
- Generate pre-signed upload URL
- Get document metadata
- Update document status
- List user documents

**Document Types:**
- Aadhaar Card
- Income Certificate
- Caste Certificate
- Education Certificates
- Bank Account Details
- Death Certificate (for widow pension)
- Domicile Certificate

#### Document Processor Handler
**Runtime:** Node.js 20.x  
**Memory:** 512 MB  
**Timeout:** 60 seconds

**Trigger:** S3 ObjectCreated event

**Operations:**
- Extract document metadata
- Validate file type and size
- Update document status in DynamoDB
- (Future: OCR and data extraction)

---

### 5. Business Logic Layer

#### Rule Evaluation Engine

**Purpose:** Deterministic eligibility evaluation based on predefined rules

**Algorithm:**
1. Load eligibility rule for scheme
2. Match user profile against each criterion
3. Calculate match score for each criterion
4. Apply criterion weights
5. Calculate overall confidence score
6. Classify into confidence bands:
   - High (>70%): Strongly Eligible
   - Medium (40-70%): Conditionally Eligible
   - Low (<40%): Not Eligible
7. Identify missing criteria
8. Identify required documents

**Operators:**
- `eq` - Exact match
- `in` - Value in list
- `range` - Value in range
- `lt`, `gt`, `lte`, `gte` - Comparisons

**Example Rule:**
```json
{
  "ruleId": "rule-pm-scholarship-2024",
  "schemeId": "scheme-pm-scholarship",
  "criteria": [
    {
      "field": "ageRange",
      "operator": "in",
      "value": ["18-25", "26-35"],
      "weight": 0.2,
      "mandatory": true
    },
    {
      "field": "employmentStatus",
      "operator": "eq",
      "value": "student",
      "weight": 0.3,
      "mandatory": true
    },
    {
      "field": "incomeRange",
      "operator": "in",
      "value": ["below_50k", "50k_1l", "1l_2l"],
      "weight": 0.25,
      "mandatory": true
    }
  ]
}
```

#### Bedrock Integration (LLM Reasoning)

**Model:** Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)

**When Used:**
- Ambiguous cases (confidence score 40-70%)
- Missing data that requires inference
- Complex eligibility scenarios
- Explanation generation

**Prompt Template:**
```
You are an eligibility assessment expert for Indian government schemes.

User Profile:
{user_profile_json}

Scheme Criteria:
{scheme_criteria_json}

Rule-Based Evaluation:
{rule_evaluation_result}

Task: Provide a contextual eligibility assessment considering:
1. Nuances not captured by rules
2. Reasonable inferences from available data
3. Clear explanation of eligibility status
4. Specific reasons for eligibility or ineligibility

Respond in JSON format:
{
  "eligibilityStatus": "strongly_eligible|conditionally_eligible|not_eligible",
  "confidenceScore": 0.0-1.0,
  "explanation": {
    "why": "...",
    "whyNot": "..."
  },
  "additionalConsiderations": ["..."]
}
```

**Cost Optimization:**
- Cache identical requests for 15 minutes
- Only call for ambiguous cases
- Limit max tokens to 2000
- Monitor token usage via CloudWatch

#### Evaluation Cache

**Implementation:** DynamoDB with TTL

**Cache Key:** Hash of (userId + schemeId + profile_hash)

**TTL:** 15 minutes (900 seconds)

**Cache Hit Rate Target:** >50%

**Benefits:**
- Reduced Bedrock API calls
- Lower latency for repeat evaluations
- Cost savings

#### Rate Limiter

**Implementation:** Token bucket algorithm in DynamoDB

**Limits:**
- 10 requests/second per user
- 100 requests/hour per user
- 10,000 requests/month per API key

**Response:** HTTP 429 with Retry-After header

#### Metrics Publisher

**Custom Metrics:**
- `APILatency` - API response time by endpoint
- `APIError` - Error count by type
- `BedrockAPICall` - Bedrock invocation count
- `BedrockInputTokens` - Input token usage
- `BedrockOutputTokens` - Output token usage
- `CacheHit` - Cache hit/miss count
- `EvaluationCount` - Evaluation count by scheme

**Namespace:** `EligibilityMVP`

**Dimensions:** Endpoint, ErrorType, SchemeId, Result

---

### 6. Data Layer

#### DynamoDB Single-Table Design

**Table Name:** `eligibility-mvp-table`

**Partition Key:** `PK` (String)  
**Sort Key:** `SK` (String)

**GSI1:** `GSI1PK` / `GSI1SK` - Entity type queries  
**GSI2:** `GSI2PK` / `GSI2SK` - Location-based queries

**Access Patterns:**

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| User Profile | USER#{userId} | PROFILE | PROFILE | USER#{userId} |
| Eligibility Rule | RULE#{ruleId} | SCHEME#{schemeId} | SCHEME#{schemeId} | CATEGORY#{category} |
| Evaluation | USER#{userId} | EVAL#{evaluationId} | EVAL#{schemeId} | TIMESTAMP#{timestamp} |
| Document | USER#{userId} | DOC#{documentId} | DOC#{documentType} | USER#{userId} |
| Cache | CACHE#{cacheKey} | CACHE | CACHE | TTL#{expiresAt} |

**Capacity Mode:** On-demand (pay per request)

**Encryption:** AWS managed keys

**Point-in-Time Recovery:** Enabled

**TTL Attribute:** `expiresAt` (for cache entries)

#### S3 Document Storage

**Bucket Name:** `eligibility-mvp-documents-{account-id}`

**Structure:**
```
documents/
  {userId}/
    aadhaar/
      {documentId}.pdf
    income_certificate/
      {documentId}.pdf
    education_certificate/
      {documentId}.pdf
```

**Security:**
- Block all public access
- Encryption at rest (S3-managed)
- Versioning enabled
- Lifecycle policy: Delete old versions after 30 days

**CORS Configuration:**
- Allow PUT, POST, GET from frontend origin
- Allow Authorization header

**Event Notifications:**
- ObjectCreated → Document Processor Lambda

---

### 7. AI/ML Layer (Amazon Bedrock)

**Model:** Claude 3 Sonnet

**Region:** ap-south-1 (Mumbai)

**Pricing:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens

**Usage Patterns:**
- Average input: 500-800 tokens
- Average output: 200-400 tokens
- Cost per call: ~₹0.50-1.00

**Monthly Estimate:**
- 1000 evaluations with 30% LLM usage
- 300 Bedrock calls
- Cost: ₹150-300/month

**Optimization:**
- Cache results for 15 minutes
- Only call for ambiguous cases
- Limit max tokens
- Monitor usage via CloudWatch

---

### 8. Monitoring & Observability

#### CloudWatch Dashboard

**Widgets:**
1. API Gateway - Request count, latency, errors
2. Lambda - Invocations, duration, errors, throttles
3. Bedrock - API calls, token usage
4. Cache - Hit rate, miss rate
5. Custom Metrics - API latency by endpoint, error types

**Refresh:** Auto-refresh every 1 minute

#### CloudWatch Alarms

**Configured Alarms:**
1. High API Error Rate (>5%)
2. High API Latency (>5 seconds)
3. Lambda Errors (>5 in 5 minutes)
4. Lambda Throttles (>1)
5. High Bedrock Calls (>100 in 5 minutes)
6. High Bedrock Tokens (>50K in 5 minutes)
7. Low Cache Hit Rate (<50%)

**Actions:** Send notification to SNS topic

#### AWS Budgets

**Budget Alerts:**
- ₹1,000 budget (80%, 100% thresholds)
- ₹3,000 budget (80%, 100% thresholds)
- ₹5,000 budget (80%, 100% thresholds)

**Notification:** SNS topic → Email/SMS

---

## Data Flow

### Eligibility Evaluation Flow

```
1. User submits profile via frontend
   ↓
2. Frontend calls POST /api/v1/eligibility/evaluate
   ↓
3. API Gateway validates JWT token
   ↓
4. Lambda handler receives request
   ↓
5. Check evaluation cache
   ├─ Cache Hit → Return cached result
   └─ Cache Miss → Continue
   ↓
6. Load eligibility rule from DynamoDB
   ↓
7. Run rule-based evaluation
   ├─ High confidence (>70%) → Skip LLM
   ├─ Low confidence (<40%) → Skip LLM
   └─ Medium confidence (40-70%) → Call Bedrock
   ↓
8. If Bedrock called:
   ├─ Format prompt with profile and rule
   ├─ Call Bedrock API
   ├─ Parse LLM response
   └─ Merge with rule-based result
   ↓
9. Generate explanation (why/why-not)
   ↓
10. Identify missing criteria and documents
   ↓
11. Calculate final confidence score
   ↓
12. Store evaluation in DynamoDB
   ↓
13. Cache result for 15 minutes
   ↓
14. Publish metrics to CloudWatch
   ↓
15. Return structured response to frontend
   ↓
16. Frontend displays eligibility result
```

### Document Upload Flow

```
1. User selects document in frontend
   ↓
2. Frontend calls POST /documents/upload-url
   ↓
3. Lambda generates pre-signed S3 URL
   ↓
4. Frontend uploads file directly to S3
   ↓
5. S3 triggers ObjectCreated event
   ↓
6. Document Processor Lambda invoked
   ↓
7. Extract metadata (size, type, etc.)
   ↓
8. Validate file
   ↓
9. Update document status in DynamoDB
   ↓
10. (Future: Run OCR and extract data)
   ↓
11. Frontend polls for document status
```

---

## Security

### Authentication & Authorization
- Cognito JWT tokens for all API requests
- Token expiry: 1 hour
- Refresh tokens: 30 days
- MFA optional

### Data Protection
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS, TLS 1.2+)
- Sensitive data consent tracking
- PII handling compliance

### Network Security
- API Gateway with Cognito authorizer
- Lambda in VPC (future enhancement)
- S3 bucket policies (block public access)
- CORS restrictions

### IAM Permissions
- Least privilege principle
- Lambda execution role with minimal permissions
- Service-to-service authentication via IAM roles

### Compliance
- GDPR-ready (consent tracking, data deletion)
- Data residency (ap-south-1 region)
- Audit logging (CloudWatch Logs)

---

## Scalability

### Current Limits
- API Gateway: 10 req/sec, 20 burst
- Lambda: 1000 concurrent executions (default)
- DynamoDB: On-demand (auto-scaling)
- S3: Unlimited storage

### Scaling Strategy
1. **Horizontal Scaling:** Lambda auto-scales with load
2. **Caching:** 15-minute cache reduces backend load
3. **Rate Limiting:** Prevents abuse and cost overruns
4. **On-Demand Capacity:** DynamoDB scales automatically

### Performance Targets
- API latency: <2 seconds (p95)
- Cache hit rate: >50%
- Error rate: <1%
- Availability: >99.9%

---

## Cost Optimization

### Strategies
1. **Caching:** Reduce Bedrock API calls by 50%+
2. **Hybrid Evaluation:** Use rules first, LLM only when needed
3. **On-Demand Pricing:** Pay only for actual usage
4. **Log Retention:** 7 days (reduce storage costs)
5. **S3 Lifecycle:** Delete old document versions after 30 days
6. **Rate Limiting:** Prevent cost overruns from abuse

### Cost Breakdown (Monthly)
- **Lambda:** ₹100-300 (within free tier for low usage)
- **DynamoDB:** ₹200-500 (on-demand)
- **S3:** ₹50-100 (storage + requests)
- **API Gateway:** ₹200-500 (requests)
- **Bedrock:** ₹500-2000 (depends on usage)
- **CloudWatch:** ₹100-200 (logs + metrics)
- **Cognito:** ₹0 (within free tier for <50K MAUs)

**Total:** ₹3,000-5,000/month

---

## Future Enhancements

### Phase 2
- Voice input/output (Transcribe, Polly)
- Multilingual support (Translate)
- DigiLocker integration
- SMS/IVR notifications

### Phase 3
- Offline PWA capabilities
- Personalized roadmap generation
- Form filling assistance
- Advanced analytics dashboard

### Phase 4
- Multi-region deployment
- Production-scale security hardening
- Comprehensive test coverage
- Life event triggered re-evaluation
- Community features

---

## Deployment Architecture

### Environments

**Development:**
- Single region (ap-south-1)
- Verbose logging
- Lower rate limits
- Sample data seeded

**Staging:**
- Single region (ap-south-1)
- Moderate logging
- Medium rate limits
- Production-like data

**Production:**
- Single region (ap-south-1)
- Minimal logging
- High rate limits
- Real user data
- Enhanced monitoring

### CI/CD (Future)
- GitHub Actions for automated testing
- CDK deployment pipeline
- Blue-green deployments
- Automated rollback on errors

---

## Disaster Recovery

### Backup Strategy
- DynamoDB: Point-in-time recovery (35 days)
- S3: Versioning enabled
- CloudWatch Logs: 7-day retention

### Recovery Procedures
1. **Data Loss:** Restore from DynamoDB PITR
2. **Infrastructure Failure:** Redeploy via CDK
3. **Region Outage:** Manual failover (future: multi-region)

### RTO/RPO Targets
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour

---

## Monitoring & Alerting

### Key Metrics
- API request count and latency
- Lambda invocations and errors
- Bedrock API calls and token usage
- Cache hit rate
- Error rates by type
- Cost metrics

### Alert Channels
- SNS topic for CloudWatch alarms
- Email notifications for budget alerts
- (Future: Slack, PagerDuty integration)

### On-Call Procedures
1. Receive alarm notification
2. Check CloudWatch dashboard
3. Review Lambda logs
4. Identify root cause
5. Apply fix or rollback
6. Monitor recovery
7. Post-mortem analysis

---

## References

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Serverless Application Lens](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/welcome.html)
- [Amazon Bedrock Best Practices](https://docs.aws.amazon.com/bedrock/latest/userguide/best-practices.html)
- [DynamoDB Single-Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
