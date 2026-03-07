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
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'eligibility' | 'discovery'>('eligibility');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete your account and all associated data.\n\n' +
      'This includes:\n' +
      '• Your profile information\n' +
      '• Eligibility evaluation history\n' +
      '• Uploaded documents\n' +
      '• Your Cognito user account\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Are you sure you want to delete your account?'
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = window.confirm(
      'Are you ABSOLUTELY sure? Type "DELETE" in the next prompt to confirm.'
    );

    if (!doubleConfirmed) {
      return;
    }

    const finalConfirmation = window.prompt(
      'Type DELETE (in capital letters) to permanently delete your account:'
    );

    if (finalConfirmation !== 'DELETE') {
      setError('Account deletion cancelled. You must type DELETE exactly.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete profile from DynamoDB
      if (profile) {
        await profileApi.delete(profile.id);
      }

      // Delete Cognito user
      await deleteAccount();

      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Account deletion failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      setLoading(false);
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
        ...(data.email && data.email !== '' && { email: data.email }),
        ...(data.name && data.name !== '' && { name: data.name }),
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
        setIsEditingProfile(false);
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
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          <button onClick={handleDeleteAccount} className="delete-account-button">
            Delete Account
          </button>
        </div>
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

            {!profile || isEditingProfile ? (
              <div className="profile-section">
                <UserProfileForm
                  onSubmit={handleProfileSubmit}
                  phoneNumber={user?.username || ''}
                  initialData={profile ? {
                    phoneNumber: profile.phoneNumber,
                    email: user?.email || '',
                    name: profile.name,
                    ageRange: profile.ageRange,
                    gender: profile.gender,
                    location: profile.location,
                    education: profile.education,
                    occupation: profile.occupation,
                    employmentStatus: profile.employmentStatus,
                    incomeRange: profile.incomeRange,
                    category: profile.category,
                    disabilityStatus: profile.disabilityStatus,
                    language: profile.language,
                    consentGiven: profile.consentGiven,
                    sensitiveDataConsent: profile.sensitiveDataConsent
                  } : {
                    email: user?.email || ''
                  }}
                />
                {profile && (
                  <button 
                    className="cancel-edit-button"
                    onClick={() => setIsEditingProfile(false)}
                    style={{ marginTop: '1rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="profile-section">
                <div className="profile-summary">
                  <h2>{profile.name || 'Your Profile'}</h2>
                  {user?.email && (
                    <p style={{ fontSize: '0.9em', color: '#666', marginTop: '-10px', marginBottom: '15px' }}>
                      {user.email}
                    </p>
                  )}
                  <div className="profile-details">
                    <p><strong>Age Range:</strong> {profile.ageRange}</p>
                    <p><strong>Location:</strong> {profile.location.district}, {profile.location.state}</p>
                    <p><strong>Area:</strong> {profile.location.ruralUrban}</p>
                    {profile.education && <p><strong>Education:</strong> {profile.education}</p>}
                    {profile.employmentStatus && <p><strong>Employment:</strong> {profile.employmentStatus}</p>}
                  </div>
                  <button 
                    className="edit-profile-button"
                    onClick={() => setIsEditingProfile(true)}
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
