import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileForm from './UserProfileForm';

describe('UserProfileForm', () => {
  const mockOnSubmit = vi.fn();
  const testPhoneNumber = '+919876543210';

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders the form with all required fields', () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/Age Range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/District/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Area Type/i)).toBeInTheDocument();
  });

  it('shows validation errors when required fields are missing', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Age range is required')).toBeInTheDocument();
      expect(screen.getByText('State is required')).toBeInTheDocument();
      expect(screen.getByText('District is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('requires consent checkbox to be checked', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Age Range/i), { target: { value: '26-35' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText(/District/i), { target: { value: 'Bangalore' } });

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You must provide consent/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid required fields', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Age Range/i), { target: { value: '26-35' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText(/District/i), { target: { value: 'Bangalore' } });
    
    // Check consent
    const consentCheckbox = screen.getByRole('checkbox', { name: /I consent to the collection/i });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: testPhoneNumber,
          ageRange: '26-35',
          location: expect.objectContaining({
            state: 'Karnataka',
            district: 'Bangalore',
            ruralUrban: 'urban'
          }),
          consentGiven: true
        })
      );
    });
  });

  it('requires consent for sensitive data when provided', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Age Range/i), { target: { value: '26-35' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText(/District/i), { target: { value: 'Bangalore' } });
    
    // Fill sensitive field without consent
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'obc' } });
    
    // Check main consent
    const consentCheckbox = screen.getByRole('checkbox', { name: /I consent to the collection/i });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please provide consent to share category information/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with sensitive data when consent is given', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Age Range/i), { target: { value: '26-35' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText(/District/i), { target: { value: 'Bangalore' } });
    
    // Fill sensitive field
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'obc' } });
    
    // Check category consent
    const categoryConsent = screen.getByRole('checkbox', { name: /I consent to share my category information/i });
    fireEvent.click(categoryConsent);
    
    // Check main consent
    const mainConsent = screen.getByRole('checkbox', { name: /I consent to the collection/i });
    fireEvent.click(mainConsent);

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'obc',
          sensitiveDataConsent: expect.objectContaining({
            category: true
          })
        })
      );
    });
  });

  it('includes optional fields when provided', async () => {
    render(<UserProfileForm onSubmit={mockOnSubmit} phoneNumber={testPhoneNumber} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Age Range/i), { target: { value: '26-35' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText(/District/i), { target: { value: 'Bangalore' } });
    
    // Fill optional fields
    fireEvent.change(screen.getByLabelText(/Gender/i), { target: { value: 'male' } });
    fireEvent.change(screen.getByLabelText(/Education Level/i), { target: { value: 'graduate' } });
    fireEvent.change(screen.getByLabelText(/Occupation/i), { target: { value: 'Software Engineer' } });
    
    // Check consent
    const consentCheckbox = screen.getByRole('checkbox', { name: /I consent to the collection/i });
    fireEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /Save Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: 'male',
          education: 'graduate',
          occupation: 'Software Engineer'
        })
      );
    });
  });

  it('populates form with initial data when provided', () => {
    const initialData = {
      ageRange: '26-35' as const,
      location: {
        state: 'Karnataka',
        district: 'Bangalore',
        ruralUrban: 'urban' as const
      },
      education: 'graduate' as const,
      consentGiven: true
    };

    render(
      <UserProfileForm 
        onSubmit={mockOnSubmit} 
        phoneNumber={testPhoneNumber}
        initialData={initialData}
      />
    );

    expect(screen.getByLabelText(/Age Range/i)).toHaveValue('26-35');
    expect(screen.getByLabelText(/State/i)).toHaveValue('Karnataka');
    expect(screen.getByLabelText(/District/i)).toHaveValue('Bangalore');
    expect(screen.getByLabelText(/Education Level/i)).toHaveValue('graduate');
  });
});
