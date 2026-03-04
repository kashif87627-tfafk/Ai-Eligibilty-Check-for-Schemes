# Local Testing Guide

## Current Configuration

The application is now configured for **LOCAL TESTING** with mock authentication and mock APIs.

## How to Run Locally

### 1. Start the Frontend

```powershell
cd packages/frontend
npm run dev
```

The app will open at `http://localhost:5173`

### 2. Login Credentials (Mock Mode)

- **Email**: `test@example.com`
- **Password**: `Test@123`

## What Works in Mock Mode

✅ **Authentication**
- Login with mock credentials
- Signup (auto-confirmed, no OTP needed)
- Logout

✅ **Profile Management**
- Create user profile with KYC details
- Update profile
- View profile summary

✅ **Eligibility Evaluation**
- Check eligibility for schemes (returns mock data)
- View eligibility results
- See suggested next steps

✅ **Document Upload**
- Upload documents (stored in browser localStorage)
- View uploaded documents

## What Doesn't Work in Mock Mode

❌ **Real OTP/Email Verification** - Mock mode bypasses this
❌ **Real Backend API Calls** - All data is stored in browser localStorage
❌ **Real AWS Services** - No S3, Cognito, DynamoDB, or Bedrock integration
❌ **Real Eligibility Evaluation** - Returns mock eligibility results

## Known Issues Fixed

### Issue 1: OTP Not Coming
**Problem**: OTP emails/SMS not being received
**Cause**: `MOCK_AUTH_MODE` was set to `false`, trying to use real AWS Cognito
**Fix**: Set `MOCK_AUTH_MODE = true` in `packages/frontend/src/contexts/AuthContext.tsx`

### Issue 2: Error After KYC Details
**Problem**: "An error occurred" after submitting KYC form
**Cause**: `MOCK_API_MODE` was set to `false`, trying to call real backend APIs
**Fix**: Set `MOCK_API_MODE = true` in `packages/frontend/src/services/api.ts`

### Issue 3: TypeScript Errors in Infrastructure
**Problem**: Cannot find type definitions for 'jest' and 'node'
**Fix**: 
- Updated `tsconfig.json` to include workspace root's `node_modules/@types`
- Removed explicit `types` array from `jest.config.js`

## Switching to Production Mode

When you're ready to deploy to AWS and use real services:

### 1. Deploy Infrastructure

```powershell
cd packages/infrastructure
npx cdk bootstrap
npx cdk deploy --all
```

### 2. Update Frontend Environment Variables

Copy the outputs from CDK deployment to `packages/frontend/.env`:

```env
VITE_API_BASE_URL=<your-api-gateway-url>
VITE_USER_POOL_ID=<your-user-pool-id>
VITE_USER_POOL_CLIENT_ID=<your-user-pool-client-id>
VITE_AWS_REGION=ap-south-1
```

### 3. Disable Mock Modes

**In `packages/frontend/src/contexts/AuthContext.tsx`:**
```typescript
const MOCK_AUTH_MODE = false; // Disable mock auth
```

**In `packages/frontend/src/services/api.ts`:**
```typescript
const MOCK_API_MODE = false; // Disable mock API
```

### 4. Rebuild and Deploy Frontend

```powershell
cd packages/frontend
npm run build
# Deploy the dist folder to your hosting service
```

## Testing Checklist

- [ ] Login with mock credentials works
- [ ] Can create profile with KYC details
- [ ] Profile is saved and displayed correctly
- [ ] Can check eligibility (shows mock results)
- [ ] Can upload documents (stored in localStorage)
- [ ] Can logout and login again
- [ ] Profile persists after logout/login

## Troubleshooting

### Browser Console Shows Errors
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for warnings about mock mode (these are normal)

### Profile Not Saving
- Check browser localStorage (DevTools → Application → Local Storage)
- Clear localStorage and try again: `localStorage.clear()`

### Can't Login
- Make sure you're using exact credentials: `test@example.com` / `Test@123`
- Check that `MOCK_AUTH_MODE = true` in AuthContext.tsx

### TypeScript Errors in VS Code
- Restart TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
- Close and reopen VS Code

## Data Storage (Mock Mode)

All data is stored in browser localStorage:
- `mockUser` - Current logged-in user
- `mockUserProfile` - User profile data
- `mockUserDocuments` - Uploaded documents metadata

To reset all data:
```javascript
localStorage.clear()
```

## Next Steps

1. Test the application locally with mock mode
2. When ready, follow the deployment guide in `EMAIL_AUTH_IMPLEMENTATION.md`
3. Deploy infrastructure to AWS
4. Update environment variables
5. Disable mock modes
6. Test with real AWS services
