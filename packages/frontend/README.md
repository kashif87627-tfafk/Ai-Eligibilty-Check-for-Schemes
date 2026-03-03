# Eligibility Platform Frontend

React + TypeScript frontend for the Eligibility-First Community Access Platform MVP.

## Features

- AWS Amplify integration with Cognito authentication
- Phone number + OTP authentication flow
- Protected routes for authenticated users
- Responsive design with modern UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your AWS Cognito credentials from CDK deployment outputs:
   - `VITE_USER_POOL_ID`: Your Cognito User Pool ID
   - `VITE_USER_POOL_CLIENT_ID`: Your Cognito User Pool Client ID
   - `VITE_AWS_REGION`: AWS region (default: ap-south-1)
   - `VITE_API_URL`: Your API Gateway URL

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Build

Build for production:
```bash
npm run build
```

## Testing

Run tests:
```bash
npm test
```

## Project Structure

```
src/
├── components/       # Reusable components
│   └── ProtectedRoute.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   └── DashboardPage.tsx
├── App.tsx          # Main app component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Authentication Flow

1. User signs up with phone number and password
2. AWS Cognito sends OTP to phone number
3. User verifies phone with OTP code
4. User can login with phone number and password
5. Protected routes require authentication

## Next Steps

- Task 8.2: Build user profile form
- Task 8.3: Create eligibility evaluation interface
- Task 8.4: Add document upload interface
