# Mock Mode Guide

This guide explains how to run the Eligibility MVP application in mock mode for local development and testing without deploying to AWS.

## What is Mock Mode?

Mock mode allows you to test the frontend application locally without requiring:
- AWS Cognito for authentication
- AWS API Gateway and Lambda for backend APIs
- AWS S3 for document storage
- AWS DynamoDB for data persistence

All authentication, API calls, and data storage are simulated using localStorage and in-memory data.

## How to Enable Mock Mode

Mock mode is **enabled by default** in the development environment. You'll see console warnings when the app starts:

```
🔧 MOCK AUTH MODE ENABLED - Use username: 939843, password: 939843
🔧 MOCK API MODE ENABLED - All API calls will use mock data
```

## Using the Application in Mock Mode

### 1. Start the Development Server

```bash
cd packages/frontend
npm run dev
```

The application will be available at `http://localhost:5173`

### 2. Login

Use these credentials:
- **Username (Phone)**: `939843` or `+91939843`
- **Password**: `939843`

The login page will automatically add the `+91` prefix if you enter just the number.

### 3. Complete Your Profile

After logging in, you'll be prompted to complete your profile. Fill in:
- Age range (required)
- State and district (required)
- Area type: Rural or Urban (required)
- Optional fields: gender, education, occupation, etc.
- Sensitive data (with explicit consent): income, category, disability status

### 4. Check Eligibility

Once your profile is complete, you can:
- Select a government scheme from the dropdown
- Click "Check Eligibility"
- View mock eligibility results including:
  - Eligibility status
  - Confidence score
  - Reasoning
  - Missing documents
  - Suggested next steps

### 5. Upload Documents

You can upload documents in mock mode:
- Select document type (Aadhaar, Income Certificate, etc.)
- Drag and drop or browse for files
- Files are "uploaded" to localStorage (not actually sent anywhere)
- View uploaded documents list

## Mock Data Storage

All data in mock mode is stored in the browser's localStorage:
- `mockUser`: Current logged-in user
- `mockUserProfile`: User profile data
- `mockUserDocuments`: Uploaded documents metadata

To reset all data, open browser console and run:
```javascript
localStorage.clear()
```

## Switching to Real AWS Mode

When you're ready to deploy and use real AWS services:

### 1. Update Frontend Configuration

Edit `packages/frontend/src/contexts/AuthContext.tsx`:
```typescript
const MOCK_AUTH_MODE = false; // Change to false
```

Edit `packages/frontend/src/services/api.ts`:
```typescript
// Remove or comment out the mock mode check
const MOCK_API_MODE = false; // Change to false
```

Edit `packages/frontend/src/components/DocumentUpload.tsx`:
```typescript
const MOCK_API_MODE = false; // Change to false
```

### 2. Configure AWS Amplify

Make sure your `.env` file has the correct AWS configuration:
```
VITE_AWS_REGION=your-region
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_API_BASE_URL=your-api-gateway-url
```

### 3. Deploy Infrastructure

```bash
cd packages/infrastructure
npm run deploy
```

### 4. Seed Data

```bash
npm run seed
```

## Testing

Tests automatically disable mock mode to allow proper unit testing with mocked fetch calls.

Run all tests:
```bash
npm test
```

Run frontend tests only:
```bash
cd packages/frontend
npm test
```

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using username: `939843` and password: `939843`
- The phone number can be entered with or without the `+91` prefix

### Data not persisting
- Mock data is stored in localStorage
- Clearing browser data will reset everything
- Use the same browser for consistent experience

### Console warnings
- The mock mode warnings are intentional
- They remind you that you're not using real AWS services
- They will disappear when you switch to real mode

## Limitations of Mock Mode

Mock mode is great for UI development and testing, but has limitations:
- No real authentication security
- No data validation against actual AWS services
- No real document processing or OCR
- No real eligibility evaluation using AWS Bedrock
- Data is not shared across browsers or devices
- Data is lost when localStorage is cleared

For production use, always deploy to AWS and disable mock mode.
