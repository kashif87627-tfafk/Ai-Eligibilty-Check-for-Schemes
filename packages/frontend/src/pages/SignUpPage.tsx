import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();
  const { signup, confirmSignup, resendCode } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      setNeedsVerification(true);
    } catch (err: any) {
      // Check if user already exists but is unconfirmed
      if (err.message && err.message.includes('User already exists')) {
        setError('User already exists. If you didn\'t verify your email, click "Resend" on the verification page.');
        setNeedsVerification(true);
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await confirmSignup(email, verificationCode);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resendCode(email);
      setSuccess('Verification code resent! Please check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Verify Your Email</h1>
          <p>We sent a verification code to {email}</p>
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
            Check your spam folder if you don't see it in your inbox
          </p>
          
          <form onSubmit={handleVerification} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message" style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>{success}</div>}
            
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button 
              onClick={handleResendCode}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.95em',
                padding: '5px'
              }}
            >
              Didn't receive the code? Resend
            </button>
          </div>

          <p className="auth-link">
            <button 
              onClick={() => setNeedsVerification(false)} 
              className="link-button"
            >
              Back to signup
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Eligibility Platform</h1>
        <h2>Sign Up</h2>
        
        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
