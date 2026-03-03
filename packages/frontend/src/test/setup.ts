// Mock AWS Amplify for tests
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  confirmSignUp: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

// Mock environment variables
process.env.VITE_USER_POOL_ID = 'test-pool-id';
process.env.VITE_USER_POOL_CLIENT_ID = 'test-client-id';
process.env.VITE_AWS_REGION = 'ap-south-1';
