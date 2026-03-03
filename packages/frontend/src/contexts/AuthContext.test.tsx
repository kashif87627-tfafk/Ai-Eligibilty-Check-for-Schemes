import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';

describe('AuthContext', () => {
  it('should render children within AuthProvider', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test Content')).toBeDefined();
  });
});
