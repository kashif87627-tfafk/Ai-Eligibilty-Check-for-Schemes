import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

// Configure Amplify with Cognito settings
// These values should come from environment variables in production
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        phone: true,
        email: true,
      },
    },
  },
};

Amplify.configure(awsConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
