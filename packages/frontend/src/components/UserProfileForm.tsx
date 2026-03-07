import React, { useState } from 'react';
import './UserProfileForm.css';

interface Location {
  state: string;
  district: string;
  ruralUrban: 'rural' | 'urban';
  pincode?: string;
}

interface UserProfileFormData {
  phoneNumber: string;
  email?: string;
  name?: string;
  ageRange: '18-25' | '26-35' | '36-45' | '46-60' | '60+' | '';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
  location: Location;
  education?: 'no_formal' | 'primary' | 'secondary' | 'graduate' | 'postgraduate' | '';
  occupation?: string;
  employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'student' | 'retired' | '';
  incomeRange?: 'below_50k' | '50k_1l' | '1l_2l' | '2l_5l' | 'above_5l' | '';
  category?: 'general' | 'obc' | 'sc' | 'st' | 'ews' | '';
  disabilityStatus?: 'none' | 'physical' | 'visual' | 'hearing' | 'other' | '';
  language: string;
  consentGiven: boolean;
  sensitiveDataConsent: {
    category: boolean;
    disability: boolean;
    income: boolean;
  };
}

interface UserProfileFormProps {
  onSubmit: (data: UserProfileFormData) => Promise<void>;
  initialData?: Partial<UserProfileFormData>;
  phoneNumber: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSubmit, initialData, phoneNumber }) => {
  const [formData, setFormData] = useState<UserProfileFormData>({
    phoneNumber,
    email: initialData?.email || '',
    name: initialData?.name || '',
    ageRange: initialData?.ageRange || '',
    gender: initialData?.gender || '',
    location: initialData?.location || {
      state: '',
      district: '',
      ruralUrban: 'urban',
      pincode: ''
    },
    education: initialData?.education || '',
    occupation: initialData?.occupation || '',
    employmentStatus: initialData?.employmentStatus || '',
    incomeRange: initialData?.incomeRange || '',
    category: initialData?.category || '',
    disabilityStatus: initialData?.disabilityStatus || '',
    language: initialData?.language || 'en',
    consentGiven: initialData?.consentGiven || false,
    sensitiveDataConsent: initialData?.sensitiveDataConsent || {
      category: false,
      disability: false,
      income: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.ageRange) {
      newErrors.ageRange = 'Age range is required';
    }
    if (!formData.location.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.location.district) {
      newErrors.district = 'District is required';
    }
    if (!formData.consentGiven) {
      newErrors.consentGiven = 'You must provide consent to use the platform';
    }

    // Sensitive data consent validation
    if (formData.category && !formData.sensitiveDataConsent.category) {
      newErrors.categoryConsent = 'Please provide consent to share category information';
    }
    if (formData.disabilityStatus && formData.disabilityStatus !== 'none' && !formData.sensitiveDataConsent.disability) {
      newErrors.disabilityConsent = 'Please provide consent to share disability information';
    }
    if (formData.incomeRange && !formData.sensitiveDataConsent.income) {
      newErrors.incomeConsent = 'Please provide consent to share income information';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLocationChange = (field: keyof Location, value: any) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleConsentChange = (field: keyof UserProfileFormData['sensitiveDataConsent'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      sensitiveDataConsent: {
        ...prev.sensitiveDataConsent,
        [field]: value
      }
    }));
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h2>Complete Your Profile</h2>
      <p className="form-description">
        Help us understand your eligibility for various schemes by providing your information.
      </p>

      {/* Required Fields Section */}
      <section className="form-section">
        <h3>Basic Information (Required)</h3>

        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            disabled
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          <small style={{ color: '#666', fontSize: '0.85em' }}>Email cannot be changed</small>
        </div>

        <div className="form-group">
          <label htmlFor="ageRange">Age Range *</label>
          <select
            id="ageRange"
            value={formData.ageRange}
            onChange={(e) => handleInputChange('ageRange', e.target.value)}
            className={errors.ageRange ? 'error' : ''}
          >
            <option value="">Select age range</option>
            <option value="18-25">18-25</option>
            <option value="26-35">26-35</option>
            <option value="36-45">36-45</option>
            <option value="46-60">46-60</option>
            <option value="60+">60+</option>
          </select>
          {errors.ageRange && <span className="error-message">{errors.ageRange}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="state">State *</label>
          <select
            id="state"
            value={formData.location.state}
            onChange={(e) => handleLocationChange('state', e.target.value)}
            className={errors.state ? 'error' : ''}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && <span className="error-message">{errors.state}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="district">District *</label>
          <input
            type="text"
            id="district"
            value={formData.location.district}
            onChange={(e) => handleLocationChange('district', e.target.value)}
            placeholder="Enter your district"
            className={errors.district ? 'error' : ''}
          />
          {errors.district && <span className="error-message">{errors.district}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ruralUrban">Area Type *</label>
          <select
            id="ruralUrban"
            value={formData.location.ruralUrban}
            onChange={(e) => handleLocationChange('ruralUrban', e.target.value as 'rural' | 'urban')}
          >
            <option value="urban">Urban</option>
            <option value="rural">Rural</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="pincode">Pincode (Optional)</label>
          <input
            type="text"
            id="pincode"
            value={formData.location.pincode || ''}
            onChange={(e) => handleLocationChange('pincode', e.target.value)}
            placeholder="Enter pincode"
            maxLength={6}
          />
        </div>
      </section>

      {/* Optional Fields Section */}
      <section className="form-section">
        <h3>Additional Information (Optional)</h3>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="education">Education Level</label>
          <select
            id="education"
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
          >
            <option value="">Select education level</option>
            <option value="no_formal">No formal education</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="graduate">Graduate</option>
            <option value="postgraduate">Postgraduate</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="occupation">Occupation</label>
          <input
            type="text"
            id="occupation"
            value={formData.occupation}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            placeholder="Enter your occupation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="employmentStatus">Employment Status</label>
          <select
            id="employmentStatus"
            value={formData.employmentStatus}
            onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
          >
            <option value="">Select employment status</option>
            <option value="employed">Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="self_employed">Self-employed</option>
            <option value="student">Student</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </section>

      {/* Sensitive Data Section */}
      <section className="form-section sensitive-section">
        <h3>Sensitive Information (Optional)</h3>
        <p className="section-note">
          This information helps us find more relevant schemes for you. 
          You must provide explicit consent to share this data.
        </p>

        <div className="form-group">
          <label htmlFor="incomeRange">Annual Income Range</label>
          <select
            id="incomeRange"
            value={formData.incomeRange}
            onChange={(e) => handleInputChange('incomeRange', e.target.value)}
          >
            <option value="">Select income range</option>
            <option value="below_50k">Below ₹50,000</option>
            <option value="50k_1l">₹50,000 - ₹1,00,000</option>
            <option value="1l_2l">₹1,00,000 - ₹2,00,000</option>
            <option value="2l_5l">₹2,00,000 - ₹5,00,000</option>
            <option value="above_5l">Above ₹5,00,000</option>
          </select>
          {formData.incomeRange && (
            <div className="consent-checkbox">
              <input
                type="checkbox"
                id="incomeConsent"
                checked={formData.sensitiveDataConsent.income}
                onChange={(e) => handleConsentChange('income', e.target.checked)}
              />
              <label htmlFor="incomeConsent">
                I consent to share my income information
              </label>
            </div>
          )}
          {errors.incomeConsent && <span className="error-message">{errors.incomeConsent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            <option value="">Select category</option>
            <option value="general">General</option>
            <option value="obc">OBC</option>
            <option value="sc">SC</option>
            <option value="st">ST</option>
            <option value="ews">EWS</option>
          </select>
          {formData.category && (
            <div className="consent-checkbox">
              <input
                type="checkbox"
                id="categoryConsent"
                checked={formData.sensitiveDataConsent.category}
                onChange={(e) => handleConsentChange('category', e.target.checked)}
              />
              <label htmlFor="categoryConsent">
                I consent to share my category information
              </label>
            </div>
          )}
          {errors.categoryConsent && <span className="error-message">{errors.categoryConsent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="disabilityStatus">Disability Status</label>
          <select
            id="disabilityStatus"
            value={formData.disabilityStatus}
            onChange={(e) => handleInputChange('disabilityStatus', e.target.value)}
          >
            <option value="">Select disability status</option>
            <option value="none">None</option>
            <option value="physical">Physical</option>
            <option value="visual">Visual</option>
            <option value="hearing">Hearing</option>
            <option value="other">Other</option>
          </select>
          {formData.disabilityStatus && formData.disabilityStatus !== 'none' && (
            <div className="consent-checkbox">
              <input
                type="checkbox"
                id="disabilityConsent"
                checked={formData.sensitiveDataConsent.disability}
                onChange={(e) => handleConsentChange('disability', e.target.checked)}
              />
              <label htmlFor="disabilityConsent">
                I consent to share my disability information
              </label>
            </div>
          )}
          {errors.disabilityConsent && <span className="error-message">{errors.disabilityConsent}</span>}
        </div>
      </section>

      {/* General Consent */}
      <section className="form-section consent-section">
        <div className="consent-checkbox main-consent">
          <input
            type="checkbox"
            id="consentGiven"
            checked={formData.consentGiven}
            onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
          />
          <label htmlFor="consentGiven">
            I consent to the collection and processing of my personal information 
            for the purpose of eligibility evaluation. I understand that my data 
            will be stored securely and used only for providing eligibility services. *
          </label>
        </div>
        {errors.consentGiven && <span className="error-message">{errors.consentGiven}</span>}
      </section>

      <div className="form-actions">
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;
