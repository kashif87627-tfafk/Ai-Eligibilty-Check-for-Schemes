import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

describe('ProtectedRoute', () => {
  it('should render ProtectedRoute component', () => {
    // Simple smoke test to ensure component renders without crashing
    const { container } = render(
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    );

    expect(container).toBeDefined();
  });
});
