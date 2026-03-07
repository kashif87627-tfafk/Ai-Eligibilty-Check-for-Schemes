import { useState, useEffect } from 'react';
import { eligibilityApi, schemeApi, EligibilityEvaluationResponse } from '../services/api';
import AIReasoningBox from './AIReasoningBox';
import './EligibilityEvaluation.css';

interface EligibilityEvaluationProps {
  userId: string;
  onEvaluationComplete?: (result: EligibilityEvaluationResponse | null) => void;
}

const EligibilityEvaluation = ({ userId, onEvaluationComplete }: EligibilityEvaluationProps) => {
  const [schemes, setSchemes] = useState<Array<{ id: string; name: string; createdAt?: string }>>([]);
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EligibilityEvaluationResponse | null>(null);
  const [visitedSchemes, setVisitedSchemes] = useState<Set<string>>(new Set());

  // Load visited schemes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`visitedSchemes_${userId}`);
    if (stored) {
      setVisitedSchemes(new Set(JSON.parse(stored)));
    }
  }, [userId]);

  // Load schemes dynamically from API
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoadingSchemes(true);
        const schemeList = await schemeApi.list();
        setSchemes(schemeList.map(s => ({ 
          id: s.id, 
          name: s.name,
          createdAt: s.createdAt 
        })));
      } catch (err) {
        console.error('Failed to load schemes:', err);
        // Fallback to hardcoded schemes if API fails
        setSchemes([
          { id: 'scheme-pm-scholarship', name: 'Prime Minister Scholarship Scheme' },
          { id: 'scheme-skill-development', name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)' },
          { id: 'scheme-widow-pension-karnataka', name: 'Karnataka Widow Pension Scheme' },
        ]);
      } finally {
        setLoadingSchemes(false);
      }
    };

    loadSchemes();
  }, []);

  // Helper function to check if scheme is new (created within last 7 days)
  const isNewScheme = (createdAt?: string) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  // Helper function to get scheme badge
  const getSchemeBadge = (schemeId: string, createdAt?: string) => {
    if (visitedSchemes.has(schemeId)) {
      return ' [Visited]';
    }
    if (isNewScheme(createdAt)) {
      return ' [New]';
    }
    return '';
  };

  // Get selected scheme details for badge display
  const getSelectedSchemeBadge = () => {
    if (!selectedScheme) return null;
    const scheme = schemes.find(s => s.id === selectedScheme);
    if (!scheme) return null;

    if (visitedSchemes.has(selectedScheme)) {
      return { text: 'VISITED', color: '#10b981' }; // green
    }
    if (isNewScheme(scheme.createdAt)) {
      return { text: 'NEW', color: '#10b981' }; // green
    }
    return null;
  };

  // Filter schemes based on search query
  const filteredSchemes = schemes.filter(scheme =>
    scheme.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckEligibility = async () => {
    if (!selectedScheme) {
      setError('Please select a scheme');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await eligibilityApi.evaluate(userId, selectedScheme);
      setResult(response);
      
      // Mark scheme as visited
      const newVisited = new Set(visitedSchemes);
      newVisited.add(selectedScheme);
      setVisitedSchemes(newVisited);
      localStorage.setItem(`visitedSchemes_${userId}`, JSON.stringify(Array.from(newVisited)));
      
      // Notify parent component of evaluation result
      if (onEvaluationComplete) {
        onEvaluationComplete(response);
      }
    } catch (err) {
      console.error('Eligibility evaluation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate eligibility');
      
      // Clear evaluation result on error
      if (onEvaluationComplete) {
        onEvaluationComplete(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'strongly_eligible':
        return 'status-badge status-strongly-eligible';
      case 'conditionally_eligible':
        return 'status-badge status-conditionally-eligible';
      case 'needs_verification':
        return 'status-badge status-needs-verification';
      case 'not_eligible':
        return 'status-badge status-not-eligible';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'strongly_eligible':
        return 'Strongly Eligible';
      case 'conditionally_eligible':
        return 'Conditionally Eligible';
      case 'needs_verification':
        return 'Needs Verification';
      case 'not_eligible':
        return 'Not Eligible';
      default:
        return status;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="eligibility-evaluation">
      <h2>Check Your Eligibility</h2>

      <div className="scheme-selection">
        <label htmlFor="scheme-search">Search Schemes:</label>
        <input
          id="scheme-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search schemes..."
          disabled={loading || loadingSchemes}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        
        <label htmlFor="scheme-select">Select a Scheme:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            id="scheme-select"
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            disabled={loading || loadingSchemes}
            style={{ flex: 1 }}
          >
            <option value="">
              {loadingSchemes ? '-- Loading schemes...' : filteredSchemes.length === 0 ? '-- No schemes found --' : '-- Choose a scheme --'}
            </option>
            {filteredSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}{getSchemeBadge(scheme.id, scheme.createdAt)}
              </option>
            ))}
          </select>
          
          {getSelectedSchemeBadge() && (
            <span
              style={{
                backgroundColor: getSelectedSchemeBadge()!.color,
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {getSelectedSchemeBadge()!.text}
            </span>
          )}
        </div>
        
        {searchQuery && (
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
            Showing {filteredSchemes.length} of {schemes.length} schemes
          </p>
        )}
      </div>

      <button
        className="check-eligibility-button"
        onClick={handleCheckEligibility}
        disabled={loading || !selectedScheme}
      >
        {loading ? 'Checking...' : 'Check Eligibility'}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {result && (
        <div className="evaluation-result">
          <div className="result-header">
            <h3>{result.scheme_name}</h3>
            <span className={getStatusBadgeClass(result.status)}>
              {getStatusLabel(result.status)}
            </span>
          </div>

          <div className="confidence-section">
            <div className="confidence-label">
              <span>Confidence Score</span>
              <span className="confidence-value">{result.confidence_score}%</span>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${result.confidence_score}%`,
                  backgroundColor: getConfidenceColor(result.confidence_score),
                }}
              />
            </div>
          </div>

          {/* AI Reasoning Box */}
          <AIReasoningBox
            reasoning={result.reasoning}
            scenarios={result.ai_scenarios}
            suggestions={result.ai_suggestions}
            confidenceScore={result.confidence_score}
            usedLLM={true}
          />

          {result.reasoning && !result.ai_scenarios && (
            <div className="reasoning-section">
              <h4>Why/Why Not</h4>
              <p>{result.reasoning}</p>
            </div>
          )}

          {result.missing_criteria && result.missing_criteria.length > 0 && (
            <div className="missing-criteria-section">
              <h4>Missing Criteria</h4>
              <ul>
                {result.missing_criteria.map((criterion, index) => (
                  <li key={index}>
                    <strong>{criterion.criterion.description}</strong>
                    <p>{criterion.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.missing_documents && result.missing_documents.length > 0 && (
            <div className="missing-documents-section">
              <h4>Required Documents</h4>
              <ul>
                {result.missing_documents.map((doc, index) => (
                  <li key={index}>
                    <strong>{doc.document.name}</strong>
                    {doc.document.mandatory && <span className="mandatory-badge">Required</span>}
                    <p>{doc.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggested_next_steps && result.suggested_next_steps.length > 0 && (
            <div className="next-steps-section">
              <h4>Suggested Next Steps</h4>
              <ol>
                {result.suggested_next_steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {result.matched_criteria && result.matched_criteria.length > 0 && (
            <div className="matched-criteria-section">
              <h4>Matched Criteria ({result.matched_criteria.length})</h4>
              <ul>
                {result.matched_criteria.map((criterion, index) => (
                  <li key={index} className="matched-item">
                    <span className="check-icon">✓</span>
                    {criterion.criterion.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.unmatched_criteria && result.unmatched_criteria.length > 0 && (
            <div className="unmatched-criteria-section">
              <h4>Unmatched Criteria ({result.unmatched_criteria.length})</h4>
              <ul>
                {result.unmatched_criteria.map((criterion, index) => (
                  <li key={index} className="unmatched-item">
                    <span className="cross-icon">✗</span>
                    <div>
                      <strong>{criterion.criterion.description}</strong>
                      <p>{criterion.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EligibilityEvaluation;
