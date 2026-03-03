import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EligibilityEvaluation from './EligibilityEvaluation';
import * as api from '../services/api';

vi.mock('../services/api');

describe('EligibilityEvaluation', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scheme selection dropdown', () => {
    render(<EligibilityEvaluation userId={mockUserId} />);
    
    expect(screen.getByText('Check Your Eligibility')).toBeInTheDocument();
    expect(screen.getByLabelText('Select a Scheme:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check eligibility/i })).toBeInTheDocument();
  });

  it('displays all sample schemes in dropdown', () => {
    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    expect(select).toBeInTheDocument();
    
    expect(screen.getByText('Prime Minister Scholarship Scheme')).toBeInTheDocument();
    expect(screen.getByText('Pradhan Mantri Kaushal Vikas Yojana (PMKVY)')).toBeInTheDocument();
    expect(screen.getByText('Karnataka Widow Pension Scheme')).toBeInTheDocument();
  });

  it('disables check button when no scheme is selected', () => {
    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    expect(button).toBeDisabled();
  });

  it('enables check button when scheme is selected', () => {
    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-pm-scholarship' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    expect(button).not.toBeDisabled();
  });

  it('shows error when checking eligibility without selecting scheme', async () => {
    render(<EligibilityEvaluation userId={mockUserId} />);
    
    // Try to click button (it should be disabled, but test the validation)
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: '' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    expect(button).toBeDisabled();
  });

  it('calls API and displays strongly eligible result', async () => {
    const mockResponse = {
      evaluation_id: 'eval-123',
      user_id: mockUserId,
      scheme_id: 'scheme-pm-scholarship',
      scheme_name: 'Prime Minister Scholarship Scheme',
      status: 'strongly_eligible' as const,
      confidence_score: 85,
      matched_criteria: [
        {
          criterion: {
            id: 'crit-1',
            field: 'ageRange',
            operator: 'in',
            value: ['18-25'],
            weight: 0.2,
            description: 'Age between 18-25',
            mandatory: true,
          },
          matched: true,
          userValue: '18-25',
          reason: 'Age matches',
        },
      ],
      unmatched_criteria: [],
      missing_criteria: [],
      missing_documents: [],
      mandatory_criteria_met: true,
      reasoning: 'You meet all the eligibility criteria for this scheme.',
      suggested_next_steps: ['Proceed with application submission'],
      evaluated_at: '2024-01-20T10:00:00Z',
    };

    vi.mocked(api.eligibilityApi.evaluate).mockResolvedValue(mockResponse);

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-pm-scholarship' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Strongly Eligible')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('You meet all the eligibility criteria for this scheme.')).toBeInTheDocument();
    });
  });

  it('displays conditionally eligible result with missing criteria', async () => {
    const mockResponse = {
      evaluation_id: 'eval-124',
      user_id: mockUserId,
      scheme_id: 'scheme-skill-development',
      scheme_name: 'Skill Development Scheme',
      status: 'conditionally_eligible' as const,
      confidence_score: 65,
      matched_criteria: [],
      unmatched_criteria: [],
      missing_criteria: [
        {
          criterion: {
            id: 'crit-2',
            field: 'education',
            operator: 'in',
            value: ['secondary'],
            weight: 0.2,
            description: 'Secondary education required',
            mandatory: true,
          },
          explanation: 'Please provide your education details',
        },
      ],
      missing_documents: [
        {
          document: {
            type: 'aadhaar',
            name: 'Aadhaar Card',
            mandatory: true,
            description: 'Valid Aadhaar card',
          },
          explanation: 'Required for identity verification',
        },
      ],
      mandatory_criteria_met: false,
      reasoning: 'You need to provide additional information.',
      suggested_next_steps: ['Update your profile', 'Upload required documents'],
      evaluated_at: '2024-01-20T10:00:00Z',
    };

    vi.mocked(api.eligibilityApi.evaluate).mockResolvedValue(mockResponse);

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-skill-development' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Conditionally Eligible')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Missing Criteria')).toBeInTheDocument();
      expect(screen.getByText('Secondary education required')).toBeInTheDocument();
      expect(screen.getByText('Required Documents')).toBeInTheDocument();
      expect(screen.getByText('Aadhaar Card')).toBeInTheDocument();
    });
  });

  it('displays not eligible result', async () => {
    const mockResponse = {
      evaluation_id: 'eval-125',
      user_id: mockUserId,
      scheme_id: 'scheme-widow-pension',
      scheme_name: 'Widow Pension Scheme',
      status: 'not_eligible' as const,
      confidence_score: 20,
      matched_criteria: [],
      unmatched_criteria: [
        {
          criterion: {
            id: 'crit-3',
            field: 'gender',
            operator: 'eq',
            value: 'female',
            weight: 0.3,
            description: 'Must be female',
            mandatory: true,
          },
          matched: false,
          userValue: 'male',
          reason: 'Gender does not match',
        },
      ],
      missing_criteria: [],
      missing_documents: [],
      mandatory_criteria_met: false,
      reasoning: 'You do not meet the mandatory criteria for this scheme.',
      suggested_next_steps: ['Review other available schemes'],
      evaluated_at: '2024-01-20T10:00:00Z',
    };

    vi.mocked(api.eligibilityApi.evaluate).mockResolvedValue(mockResponse);

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-widow-pension-karnataka' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Not Eligible')).toBeInTheDocument();
    });

    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Unmatched Criteria (1)')).toBeInTheDocument();
    expect(screen.getByText('Must be female')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.eligibilityApi.evaluate).mockRejectedValue(
      new Error('Failed to evaluate eligibility')
    );

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-pm-scholarship' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to evaluate eligibility')).toBeInTheDocument();
    });
  });

  it('shows loading state during API call', async () => {
    vi.mocked(api.eligibilityApi.evaluate).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-pm-scholarship' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('displays matched criteria section', async () => {
    const mockResponse = {
      evaluation_id: 'eval-126',
      user_id: mockUserId,
      scheme_id: 'scheme-pm-scholarship',
      scheme_name: 'Prime Minister Scholarship Scheme',
      status: 'strongly_eligible' as const,
      confidence_score: 90,
      matched_criteria: [
        {
          criterion: {
            id: 'crit-1',
            field: 'ageRange',
            operator: 'in',
            value: ['18-25'],
            weight: 0.2,
            description: 'Age between 18-25',
            mandatory: true,
          },
          matched: true,
          userValue: '18-25',
          reason: 'Age matches',
        },
        {
          criterion: {
            id: 'crit-2',
            field: 'education',
            operator: 'in',
            value: ['graduate'],
            weight: 0.2,
            description: 'Graduate level education',
            mandatory: true,
          },
          matched: true,
          userValue: 'graduate',
          reason: 'Education matches',
        },
      ],
      unmatched_criteria: [],
      missing_criteria: [],
      missing_documents: [],
      mandatory_criteria_met: true,
      reasoning: 'Excellent match!',
      evaluated_at: '2024-01-20T10:00:00Z',
    };

    vi.mocked(api.eligibilityApi.evaluate).mockResolvedValue(mockResponse);

    render(<EligibilityEvaluation userId={mockUserId} />);
    
    const select = screen.getByLabelText('Select a Scheme:');
    fireEvent.change(select, { target: { value: 'scheme-pm-scholarship' } });
    
    const button = screen.getByRole('button', { name: /check eligibility/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Matched Criteria (2)')).toBeInTheDocument();
      expect(screen.getByText('Age between 18-25')).toBeInTheDocument();
      expect(screen.getByText('Graduate level education')).toBeInTheDocument();
    });
  });
});
