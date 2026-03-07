import { useState } from 'react';
import { schemeApi, DiscoveredScheme } from '../services/api';
import './SchemeDiscovery.css';

const SchemeDiscovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<DiscoveredScheme[]>([]);
  const [addingScheme, setAddingScheme] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSchemes([]);

      const discovered = await schemeApi.discover(query);
      setSchemes(discovered);

      if (discovered.length === 0) {
        setError('No schemes found. Try a different search query.');
      }
    } catch (err) {
      console.error('Scheme discovery error:', err);
      setError(err instanceof Error ? err.message : 'Failed to discover schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheme = async (scheme: DiscoveredScheme) => {
    try {
      setAddingScheme(scheme.name);
      setError(null);

      await schemeApi.add(scheme);
      
      // Remove from list after adding
      setSchemes(schemes.filter(s => s.name !== scheme.name));
      
      alert(`✅ Scheme "${scheme.name}" added successfully!`);
    } catch (err) {
      console.error('Add scheme error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add scheme');
    } finally {
      setAddingScheme(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="scheme-discovery">
      <div className="discovery-header">
        <h2>🤖 AI-Powered Scheme Discovery</h2>
        <p>Ask Claude to find government schemes for you</p>
      </div>

      <div className="search-section">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder="e.g., Find education schemes for students in Karnataka"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>

        <div className="search-examples">
          <span>Try:</span>
          <button onClick={() => setQuery('Find scholarship schemes for students')}>
            Scholarships
          </button>
          <button onClick={() => setQuery('Find pension schemes for senior citizens')}>
            Pensions
          </button>
          <button onClick={() => setQuery('Find employment schemes for youth')}>
            Employment
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {schemes.length > 0 && (
        <div className="schemes-results">
          <h3>Found {schemes.length} scheme{schemes.length !== 1 ? 's' : ''}</h3>
          <div className="schemes-grid">
            {schemes.map((scheme, index) => (
              <div key={index} className="scheme-card">
                <div className="scheme-header">
                  <h4>{scheme.name}</h4>
                  <span className="confidence-badge">
                    {scheme.confidence}% confident
                  </span>
                </div>

                <p className="scheme-description">{scheme.description}</p>

                <div className="scheme-meta">
                  <span className="scheme-category">📁 {scheme.category}</span>
                  <span className="scheme-mode">
                    {scheme.applicationMode === 'online' ? '💻' : '📄'} {scheme.applicationMode}
                  </span>
                </div>

                {scheme.eligibility.states && scheme.eligibility.states.length > 0 && (
                  <div className="scheme-states">
                    <strong>States:</strong> {scheme.eligibility.states.join(', ')}
                  </div>
                )}

                <div className="scheme-documents">
                  <strong>Required Documents:</strong>
                  <ul>
                    {scheme.documents.slice(0, 3).map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                    {scheme.documents.length > 3 && (
                      <li>+ {scheme.documents.length - 3} more</li>
                    )}
                  </ul>
                </div>

                <div className="scheme-source">
                  <a href={scheme.sourceUrl} target="_blank" rel="noopener noreferrer">
                    View Official Source →
                  </a>
                </div>

                <button
                  className="add-scheme-button"
                  onClick={() => handleAddScheme(scheme)}
                  disabled={addingScheme === scheme.name}
                >
                  {addingScheme === scheme.name ? '⏳ Adding...' : '✅ Add to Database'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeDiscovery;
