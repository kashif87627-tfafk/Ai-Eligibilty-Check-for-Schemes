import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signIn, signUp, signOut, confirmSignUp, deleteUser, resendSignUpCode } from 'aws-amplify/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock mode - set to true to bypass AWS Cognito
const MOCK_AUTH_MODE = false; // Set to true for local testing without AWS
const MOCK_USER = { username: 'test@example.com', userId: 'mock-user-id' };

// Log mock mode status
if (MOCK_AUTH_MODE) {
  console.warn('🔧 MOCK AUTH MODE ENABLED - Use email: test@example.com, password: Test@123. Set MOCK_AUTH_MODE to false in AuthContext.tsx when AWS Cognito is configured.');
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      if (MOCK_AUTH_MODE) {
        // Check if user is logged in via localStorage
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
          setUser(JSON.parse(mockUser));
        } else {
          setUser(null);
        }
      } else {
        const currentUser = await getCurrentUser();
        // Fetch user attributes to get email
        const { fetchUserAttributes } = await import('aws-amplify/auth');
        const attributes = await fetchUserAttributes();
        setUser({
          ...currentUser,
          email: attributes.email || currentUser.username
        });
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (MOCK_AUTH_MODE) {
        // Mock authentication - check credentials
        if (email === 'test@example.com' && password === 'Test@123') {
          const mockUser = { ...MOCK_USER, username: email };
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          setUser(mockUser);
          console.log('✅ Mock login successful');
        } else {
          throw new Error('Invalid credentials. Use email: test@example.com, password: Test@123');
        }
      } else {
        const { isSignedIn } = await signIn({
          username: email,
          password,
        });
        
        if (isSignedIn) {
          await checkUser();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      if (MOCK_AUTH_MODE) {
        // Mock signup - auto-confirm
        const mockUser = { ...MOCK_USER, username: email };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        setUser(mockUser);
        console.log('✅ Mock signup successful (auto-confirmed)');
      } else {
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email: email,
            },
          },
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      if (MOCK_AUTH_MODE) {
        // Mock confirmation - always succeeds
        console.log('✅ Mock confirmation successful');
      } else {
        await confirmSignUp({
          username: email,
          confirmationCode: code,
        });
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      throw error;
    }
  };

  const resendCode = async (email: string) => {
    try {
      if (MOCK_AUTH_MODE) {
        // Mock resend - always succeeds
        console.log('✅ Mock resend code successful');
      } else {
        await resendSignUpCode({
          username: email,
        });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (MOCK_AUTH_MODE) {
        localStorage.removeItem('mockUser');
        setUser(null);
        console.log('✅ Mock logout successful');
      } else {
        await signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (MOCK_AUTH_MODE) {
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockUserProfile');
        setUser(null);
        console.log('✅ Mock account deleted');
      } else {
        await deleteUser();
        setUser(null);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    confirmSignup,
    resendCode,
    logout,
    deleteAccount,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
