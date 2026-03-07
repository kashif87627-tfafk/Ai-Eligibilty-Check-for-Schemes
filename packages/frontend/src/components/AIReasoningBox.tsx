import './AIReasoningBox.css';

interface AIScenario {
  icon: string;
  text: string;
  impact: string;
}

interface AIReasoningBoxProps {
  reasoning: string;
  scenarios?: AIScenario[];
  suggestions?: string[];
  confidenceScore: number;
  usedLLM?: boolean;
}

const AIReasoningBox = ({ 
  reasoning, 
  scenarios = [], 
  suggestions = [], 
  confidenceScore,
  usedLLM = false 
}: AIReasoningBoxProps) => {
  if (!usedLLM) {
    return null; // Don't show if AI wasn't used
  }

  return (
    <div className="ai-reasoning-box">
      <div className="ai-header">
        <span className="ai-icon">🤖</span>
        <span className="ai-title">AI Analysis</span>
        <span className="ai-badge">Powered by Claude</span>
      </div>

      <div className="ai-reasoning">
        <p>{reasoning}</p>
      </div>

      {scenarios && scenarios.length > 0 && (
        <div className="ai-scenarios">
          <h4>Scenarios Considered:</h4>
          <div className="scenarios-list">
            {scenarios.map((scenario, index) => (
              <div 
                key={index} 
                className={`scenario scenario-${scenario.impact}`}
              >
                <span className="scenario-icon">{scenario.icon}</span>
                <span className="scenario-text">{scenario.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="ai-suggestions">
          <h4>💡 AI Suggestions:</h4>
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ai-confidence">
        <div className="confidence-label">
          <span>AI Confidence</span>
          <span className="confidence-value">{confidenceScore}%</span>
        </div>
        <div className="confidence-bar-small">
          <div 
            className="confidence-fill-small"
            style={{ 
              width: `${confidenceScore}%`,
              backgroundColor: confidenceScore >= 70 ? '#10b981' : confidenceScore >= 50 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIReasoningBox;
