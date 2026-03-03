# Eligibility MVP API Documentation

Complete API reference for the Eligibility-First Community Access Platform.

## Base URL

```
https://{api-id}.execute-api.ap-south-1.amazonaws.com/v1
```

Replace `{api-id}` with your API Gateway ID from deployment outputs.

## Authentication

All API endpoints require authentication using Amazon Cognito JWT tokens.

### Getting an Access Token

1. Sign up or sign in using AWS Amplify (frontend)
2. Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

### Example Authentication Flow

```bash
# Sign up (via Amplify - see frontend documentation)
# Sign in and get JWT token
# Use token in subsequent requests
```

---

## User Profile Endpoints

### Create User Profile

Create a new user profile with eligibility information.

**Endpoint:** `POST /profiles`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "phoneNumber": "+919876543210",
  "ageRange": "18-25",
  "gender": "male",
  "location": {
    "state": "Karnataka",
    "district": "Bangalore Urban",
    "ruralUrban": "urban"
  },
  "education": "graduate",
  "employmentStatus": "student",
  "incomeRange": "below_50k",
  "category": "SC",
  "disability": "none",
  "consent": {
    "dataCollection": true,
    "categoryDisclosure": true,
    "incomeDisclosure": true,
    "disabilityDisclosure": true
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "profile": {
    "userId": "user-123",
    "phoneNumber": "+919876543210",
    "ageRange": "18-25",
    "gender": "male",
    "location": {
      "state": "Karnataka",
      "district": "Bangalore Urban",
      "ruralUrban": "urban"
    },
    "education": "graduate",
    "employmentStatus": "student",
    "incomeRange": "below_50k",
    "category": "SC",
    "disability": "none",
    "consent": {
      "dataCollection": true,
      "categoryDisclosure": true,
      "incomeDisclosure": true,
      "disabilityDisclosure": true
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "phoneNumber": "+919876543210",
    "ageRange": "18-25",
    "gender": "male",
    "location": {
      "state": "Karnataka",
      "district": "Bangalore Urban",
      "ruralUrban": "urban"
    },
    "education": "graduate",
    "employmentStatus": "student",
    "incomeRange": "below_50k",
    "category": "SC",
    "disability": "none",
    "consent": {
      "dataCollection": true,
      "categoryDisclosure": true,
      "incomeDisclosure": true,
      "disabilityDisclosure": true
    }
  }'
```

---

### Get User Profile by ID

Retrieve a user profile by user ID.

**Endpoint:** `GET /profiles/{userId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": {
    "userId": "user-123",
    "phoneNumber": "+919876543210",
    "ageRange": "18-25",
    "gender": "male",
    "location": {
      "state": "Karnataka",
      "district": "Bangalore Urban",
      "ruralUrban": "urban"
    },
    "education": "graduate",
    "employmentStatus": "student",
    "incomeRange": "below_50k",
    "category": "SC",
    "disability": "none",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/profiles/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update User Profile

Update an existing user profile.

**Endpoint:** `PUT /profiles/{userId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "education": "postgraduate",
  "employmentStatus": "employed",
  "incomeRange": "2l_5l"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": {
    "userId": "user-123",
    "education": "postgraduate",
    "employmentStatus": "employed",
    "incomeRange": "2l_5l",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/profiles/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "education": "postgraduate",
    "employmentStatus": "employed",
    "incomeRange": "2l_5l"
  }'
```

---

### Delete User Profile

Delete a user profile.

**Endpoint:** `DELETE /profiles/{userId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/profiles/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Get Profile by Phone Number

Retrieve a user profile by phone number.

**Endpoint:** `GET /profiles/phone/{phoneNumber}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": {
    "userId": "user-123",
    "phoneNumber": "+919876543210",
    "ageRange": "18-25",
    "gender": "male"
  }
}
```

**cURL Example:**
```bash
curl -X GET https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/profiles/phone/%2B919876543210 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Eligibility Evaluation Endpoints

### Evaluate Eligibility for a Scheme

Evaluate user eligibility for a specific government scheme.

**Endpoint:** `POST /api/v1/eligibility/evaluate`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "schemeId": "scheme-pm-scholarship",
  "userProfile": {
    "ageRange": "18-25",
    "gender": "male",
    "location": {
      "state": "Karnataka",
      "district": "Bangalore Urban",
      "ruralUrban": "urban"
    },
    "education": "graduate",
    "employmentStatus": "student",
    "incomeRange": "below_50k",
    "category": "SC",
    "disability": "none"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "evaluation": {
    "evaluationId": "eval-abc123",
    "userId": "user-123",
    "schemeId": "scheme-pm-scholarship",
    "schemeName": "Prime Minister Scholarship Scheme",
    "eligibilityStatus": "strongly_eligible",
    "confidenceScore": 0.92,
    "confidenceBand": "high",
    "explanation": {
      "why": "You meet all the key criteria for this scholarship: you are in the eligible age range (18-25), currently a student pursuing graduation, from an economically weaker section (income below ₹50,000), and belong to SC category which is prioritized for this scheme.",
      "whyNot": null
    },
    "matchedCriteria": [
      {
        "criterion": "age",
        "required": "18-35",
        "actual": "18-25",
        "matched": true,
        "weight": 0.2
      },
      {
        "criterion": "employmentStatus",
        "required": "student",
        "actual": "student",
        "matched": true,
        "weight": 0.3
      },
      {
        "criterion": "incomeRange",
        "required": "below_2l",
        "actual": "below_50k",
        "matched": true,
        "weight": 0.25
      },
      {
        "criterion": "category",
        "required": "SC/ST/OBC",
        "actual": "SC",
        "matched": true,
        "weight": 0.15
      }
    ],
    "missingCriteria": [],
    "requiredDocuments": [
      {
        "documentType": "aadhaar",
        "description": "Aadhaar Card",
        "mandatory": true,
        "status": "not_uploaded"
      },
      {
        "documentType": "income_certificate",
        "description": "Income Certificate (below ₹2 lakhs)",
        "mandatory": true,
        "status": "not_uploaded"
      },
      {
        "documentType": "education_certificate",
        "description": "Educational Certificates",
        "mandatory": true,
        "status": "not_uploaded"
      },
      {
        "documentType": "caste_certificate",
        "description": "Caste Certificate (SC)",
        "mandatory": true,
        "status": "not_uploaded"
      },
      {
        "documentType": "bank_account",
        "description": "Bank Account Details",
        "mandatory": true,
        "status": "not_uploaded"
      }
    ],
    "nextSteps": [
      "Upload required documents (Aadhaar, income certificate, educational certificates, caste certificate, bank account details)",
      "Visit scholarships.gov.in to complete the online application",
      "Submit application before the deadline",
      "Track application status on the portal"
    ],
    "evaluatedAt": "2024-01-15T10:35:00Z",
    "usedLLM": false,
    "cacheHit": false
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/api/v1/eligibility/evaluate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "schemeId": "scheme-pm-scholarship",
    "userProfile": {
      "ageRange": "18-25",
      "gender": "male",
      "location": {
        "state": "Karnataka",
        "district": "Bangalore Urban",
        "ruralUrban": "urban"
      },
      "education": "graduate",
      "employmentStatus": "student",
      "incomeRange": "below_50k",
      "category": "SC",
      "disability": "none"
    }
  }'
```

---

### Evaluate All Schemes

Evaluate user eligibility across all available schemes.

**Endpoint:** `POST /api/v1/eligibility/evaluate-all`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "userProfile": {
    "ageRange": "18-25",
    "gender": "male",
    "location": {
      "state": "Karnataka",
      "district": "Bangalore Urban",
      "ruralUrban": "urban"
    },
    "education": "graduate",
    "employmentStatus": "student",
    "incomeRange": "below_50k",
    "category": "SC",
    "disability": "none"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "evaluations": [
    {
      "schemeId": "scheme-pm-scholarship",
      "schemeName": "Prime Minister Scholarship Scheme",
      "eligibilityStatus": "strongly_eligible",
      "confidenceScore": 0.92,
      "confidenceBand": "high"
    },
    {
      "schemeId": "scheme-skill-development",
      "schemeName": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
      "eligibilityStatus": "conditionally_eligible",
      "confidenceScore": 0.65,
      "confidenceBand": "medium"
    },
    {
      "schemeId": "scheme-widow-pension-karnataka",
      "schemeName": "Karnataka Widow Pension Scheme",
      "eligibilityStatus": "not_eligible",
      "confidenceScore": 0.15,
      "confidenceBand": "low"
    }
  ],
  "evaluatedAt": "2024-01-15T10:40:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/api/v1/eligibility/evaluate-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "userProfile": {
      "ageRange": "18-25",
      "gender": "male",
      "location": {
        "state": "Karnataka",
        "district": "Bangalore Urban",
        "ruralUrban": "urban"
      },
      "education": "graduate",
      "employmentStatus": "student",
      "incomeRange": "below_50k",
      "category": "SC",
      "disability": "none"
    }
  }'
```

---

### Re-evaluate After Profile Update

Re-evaluate eligibility after user profile changes.

**Endpoint:** `POST /api/v1/eligibility/re-evaluate`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "schemeId": "scheme-pm-scholarship"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "evaluation": {
    "evaluationId": "eval-xyz789",
    "userId": "user-123",
    "schemeId": "scheme-pm-scholarship",
    "eligibilityStatus": "conditionally_eligible",
    "confidenceScore": 0.55,
    "changesDetected": true,
    "previousStatus": "strongly_eligible",
    "statusChange": "downgraded"
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/api/v1/eligibility/re-evaluate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "schemeId": "scheme-pm-scholarship"
  }'
```

---

### Get Past Evaluations

Retrieve all past eligibility evaluations for a user.

**Endpoint:** `GET /api/v1/eligibility/user/{userId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "evaluations": [
    {
      "evaluationId": "eval-abc123",
      "schemeId": "scheme-pm-scholarship",
      "schemeName": "Prime Minister Scholarship Scheme",
      "eligibilityStatus": "strongly_eligible",
      "confidenceScore": 0.92,
      "evaluatedAt": "2024-01-15T10:35:00Z"
    },
    {
      "evaluationId": "eval-def456",
      "schemeId": "scheme-skill-development",
      "schemeName": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
      "eligibilityStatus": "conditionally_eligible",
      "confidenceScore": 0.65,
      "evaluatedAt": "2024-01-15T10:36:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/api/v1/eligibility/user/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Document Management Endpoints

### Generate Pre-signed Upload URL

Generate a pre-signed URL for uploading documents to S3.

**Endpoint:** `POST /documents/upload-url`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user-123",
  "documentType": "aadhaar",
  "fileName": "aadhaar_card.pdf",
  "contentType": "application/pdf"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "uploadUrl": "https://eligibility-mvp-documents-123456789012.s3.ap-south-1.amazonaws.com/documents/user-123/aadhaar/aadhaar_card.pdf?X-Amz-Algorithm=...",
  "documentId": "doc-abc123",
  "expiresIn": 3600
}
```

**cURL Example:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/documents/upload-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "documentType": "aadhaar",
    "fileName": "aadhaar_card.pdf",
    "contentType": "application/pdf"
  }'

# Then upload the file using the pre-signed URL
curl -X PUT "PRESIGNED_URL_FROM_RESPONSE" \
  -H "Content-Type: application/pdf" \
  --data-binary @aadhaar_card.pdf
```

---

### Get Document Metadata

Retrieve metadata for a specific document.

**Endpoint:** `GET /documents/{documentId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "document": {
    "documentId": "doc-abc123",
    "userId": "user-123",
    "documentType": "aadhaar",
    "fileName": "aadhaar_card.pdf",
    "fileSize": 245678,
    "contentType": "application/pdf",
    "status": "verified",
    "uploadedAt": "2024-01-15T10:45:00Z",
    "verifiedAt": "2024-01-15T10:46:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/documents/doc-abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Update Document Status

Update the verification status of a document.

**Endpoint:** `PUT /documents/{documentId}/status`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "verified"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "document": {
    "documentId": "doc-abc123",
    "status": "verified",
    "verifiedAt": "2024-01-15T10:46:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/documents/doc-abc123/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified"
  }'
```

---

### List User Documents

List all documents uploaded by a user.

**Endpoint:** `GET /documents/user/{userId}`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "documents": [
    {
      "documentId": "doc-abc123",
      "documentType": "aadhaar",
      "fileName": "aadhaar_card.pdf",
      "status": "verified",
      "uploadedAt": "2024-01-15T10:45:00Z"
    },
    {
      "documentId": "doc-def456",
      "documentType": "income_certificate",
      "fileName": "income_cert.pdf",
      "status": "pending",
      "uploadedAt": "2024-01-15T10:50:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET https://your-api-id.execute-api.ap-south-1.amazonaws.com/v1/documents/user/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid request body",
  "details": {
    "field": "ageRange",
    "issue": "Must be one of: 18-25, 26-35, 36-45, 46-60, 60+"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "UnauthorizedError",
  "message": "Invalid or expired authentication token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "RateLimitError",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse and control costs:

- **Development:** 10 requests/second, 10,000 requests/month
- **Staging:** 20 requests/second, 50,000 requests/month
- **Production:** 50 requests/second, 500,000 requests/month

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1705318800
```

---

## Caching

Eligibility evaluations are cached for 15 minutes to reduce costs and improve performance. Cache headers indicate cache status:

```
X-Cache-Hit: true
X-Cache-TTL: 900
```

---

## Monitoring

Monitor API usage and performance via CloudWatch Dashboard:

```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=Eligibility-MVP-Dashboard
```

Key metrics:
- API request count
- API latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- Bedrock API calls and token usage
- Cache hit rate

---

## Support

For API issues or questions:
- Check CloudWatch logs: `/aws/lambda/eligibility-mvp-*`
- Review error messages in responses
- Contact support with request ID from error response
