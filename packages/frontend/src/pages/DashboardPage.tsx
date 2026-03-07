import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import UserProfileForm from '../components/UserProfileForm';
import EligibilityEvaluation from '../components/EligibilityEvaluation';
import DocumentUpload from '../components/DocumentUpload';
import SchemeDiscovery from '../components/SchemeDiscovery';
import { profileApi, CreateProfileRequest, UserProfile, EligibilityEvaluationResponse } from '../services/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'eligibility' | 'discovery'>('eligibility');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await profileApi.getByPhone(user.username);
      setProfile(response.profile);
    } catch (error) {
      // Profile doesn't exist yet, which is fine
      console.log('No profile found, user needs to create one');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileSubmit = async (data: any) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Filter out empty string values for optional fields
      const cleanedData: CreateProfileRequest = {
        phoneNumber: data.phoneNumber,
        ageRange: data.ageRange,
        location: data.location,
        language: data.language,
        consentGiven: data.consentGiven,
        ...(data.gender && data.gender !== '' && { gender: data.gender }),
        ...(data.education && data.education !== '' && { education: data.education }),
        ...(data.occupation && { occupation: data.occupation }),
        ...(data.employmentStatus && data.employmentStatus !== '' && { employmentStatus: data.employmentStatus }),
        ...(data.incomeRange && data.incomeRange !== '' && { incomeRange: data.incomeRange }),
        ...(data.category && data.category !== '' && { category: data.category }),
        ...(data.disabilityStatus && data.disabilityStatus !== '' && { disabilityStatus: data.disabilityStatus }),
        ...(data.sensitiveDataConsent && { sensitiveDataConsent: data.sensitiveDataConsent }),
      };

      if (profile) {
        // Update existing profile
        await profileApi.update(profile.id, cleanedData);
        setSuccessMessage('Profile updated successfully!');
      } else {
        // Create new profile
        const response = await profileApi.create(cleanedData);
        setProfile(response.profile);
        setSuccessMessage('Profile created successfully!');
      }

      // Reload profile to get latest data
      await loadProfile();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Profile submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Eligibility Platform</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loading-card">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {!profile ? (
              <div className="profile-section">
                <UserProfileForm
                  onSubmit={handleProfileSubmit}
                  phoneNumber={user?.username || ''}
                />
              </div>
            ) : (
              <div className="profile-section">
                <div className="profile-summary">
                  <h2>Your Profile</h2>
                  <div className="profile-details">
                    <p><strong>Age Range:</strong> {profile.ageRange}</p>
                    <p><strong>Location:</strong> {profile.location.district}, {profile.location.state}</p>
                    <p><strong>Area:</strong> {profile.location.ruralUrban}</p>
                    {profile.education && <p><strong>Education:</strong> {profile.education}</p>}
                    {profile.employmentStatus && <p><strong>Employment:</strong> {profile.employmentStatus}</p>}
                  </div>
                  <button 
                    className="edit-profile-button"
                    onClick={() => setProfile(null)}
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="tabs-container">
                  <div className="tabs">
                    <button
                      className={`tab ${activeTab === 'eligibility' ? 'active' : ''}`}
                      onClick={() => setActiveTab('eligibility')}
                    >
                      Check Eligibility
                    </button>
                    <button
                      className={`tab ${activeTab === 'discovery' ? 'active' : ''}`}
                      onClick={() => setActiveTab('discovery')}
                    >
                      🤖 Discover Schemes
                    </button>
                  </div>
                </div>

                {activeTab === 'eligibility' ? (
                  <>
                    <div className="eligibility-section">
                      <EligibilityEvaluation 
                        userId={profile.id} 
                        onEvaluationComplete={setEvaluationResult}
                      />
                    </div>

                    <div className="documents-section">
                      <DocumentUpload 
                        userId={profile.id}
                        missingDocuments={evaluationResult?.missing_documents?.map(doc => ({
                          type: doc.document.type,
                          name: doc.document.name,
                          mandatory: doc.document.mandatory,
                          description: doc.explanation,
                        }))}
                        onUploadComplete={() => {
                          console.log('Document uploaded, consider re-evaluating eligibility');
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="discovery-section">
                    <SchemeDiscovery />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
