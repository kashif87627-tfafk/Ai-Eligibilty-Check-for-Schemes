/**
 * Sample Eligibility Rules for Common Government Schemes
 * 
 * This file contains sample eligibility rules for demonstration and testing purposes.
 * These rules are based on actual government schemes but simplified for MVP.
 */

import { EligibilityRule } from '../types/eligibility-rules';

/**
 * PM Scholarship Scheme for Students
 * Target: Students from economically weaker sections
 */
export const pmScholarshipRule: EligibilityRule = {
  id: 'rule-pm-scholarship-2024',
  schemeId: 'scheme-pm-scholarship',
  schemeName: 'Prime Minister Scholarship Scheme',
  schemeNameTranslations: {
    hi: 'प्रधानमंत्री छात्रवृत्ति योजना',
    ta: 'பிரதமர் உதவித்தொகை திட்டம்',
  },
  description: 'Scholarship for meritorious students from economically weaker sections pursuing higher education',
  descriptionTranslations: {
    hi: 'उच्च शिक्षा प्राप्त करने वाले आर्थिक रूप से कमजोर वर्गों के मेधावी छात्रों के लिए छात्रवृत्ति',
    ta: 'உயர்கல்வி பயிலும் பொருளாதார ரீதியாக பின்தங்கிய பிரிவினரின் திறமையான மாணவர்களுக்கான உதவித்தொகை',
  },
  category: 'education',
  targetAudience: ['students', 'youth', 'economically-weaker-sections'],
  criteria: [
    {
      id: 'crit-age-range',
      field: 'ageRange',
      operator: 'in',
      value: ['18-25', '26-35'],
      weight: 0.15,
      description: 'Applicant must be between 18-35 years old',
      mandatory: true,
    },
    {
      id: 'crit-education',
      field: 'education',
      operator: 'in',
      value: ['secondary', 'graduate', 'postgraduate'],
      weight: 0.2,
      description: 'Must have completed secondary education or be pursuing higher education',
      mandatory: true,
    },
    {
      id: 'crit-income',
      field: 'incomeRange',
      operator: 'in',
      value: ['below_50k', '50k_1l', '1l_2l'],
      weight: 0.25,
      description: 'Annual family income must be below ₹2 lakhs',
      mandatory: true,
    },
    {
      id: 'crit-category',
      field: 'category',
      operator: 'in',
      value: ['sc', 'st', 'obc', 'ews'],
      weight: 0.2,
      description: 'Preference given to SC/ST/OBC/EWS categories',
      mandatory: false,
    },
    {
      id: 'crit-employment',
      field: 'employmentStatus',
      operator: 'eq',
      value: 'student',
      weight: 0.2,
      description: 'Must be currently enrolled as a student',
      mandatory: true,
    },
  ],
  requiredDocuments: [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Valid Aadhaar card for identity verification',
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Income certificate from competent authority (not older than 6 months)',
    },
    {
      type: 'education',
      name: 'Educational Certificates',
      mandatory: true,
      description: 'Mark sheets and certificates of previous qualifying examination',
    },
    {
      type: 'caste_certificate',
      name: 'Caste Certificate',
      mandatory: false,
      description: 'Caste certificate (if applicable for SC/ST/OBC)',
      alternativeDocuments: ['domicile_certificate'],
    },
    {
      type: 'bank_account',
      name: 'Bank Account Details',
      mandatory: true,
      description: 'Bank account passbook or cancelled cheque',
    },
  ],
  applicableStates: [], // All states
  ruralUrbanFilter: 'both',
  isOpenEnded: false,
  applicationDeadline: '2024-12-31T23:59:59Z',
  processingTime: '45-60 days',
  applicationMode: 'online',
  applicationUrl: 'https://scholarships.gov.in',
  trustLevel: 'verified',
  sourceUrl: 'https://scholarships.gov.in/public/schemeGuidelines',
  lastVerified: '2024-01-15T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

/**
 * Skill Development Employment Scheme
 * Target: Unemployed youth seeking skill training
 */
export const skillDevelopmentRule: EligibilityRule = {
  id: 'rule-skill-development-2024',
  schemeId: 'scheme-skill-development',
  schemeName: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
  schemeNameTranslations: {
    hi: 'प्रधानमंत्री कौशल विकास योजना',
    ta: 'பிரதமர் திறன் மேம்பாட்டு திட்டம்',
  },
  description: 'Skill development and training program for unemployed youth to enhance employability',
  descriptionTranslations: {
    hi: 'बेरोजगार युवाओं के लिए रोजगार क्षमता बढ़ाने के लिए कौशल विकास और प्रशिक्षण कार्यक्रम',
    ta: 'வேலைவாய்ப்பை மேம்படுத்த வேலையில்லாத இளைஞர்களுக்கான திறன் மேம்பாடு மற்றும் பயிற்சி திட்டம்',
  },
  category: 'employment',
  targetAudience: ['youth', 'unemployed', 'job-seekers'],
  criteria: [
    {
      id: 'crit-age-range',
      field: 'ageRange',
      operator: 'in',
      value: ['18-25', '26-35', '36-45'],
      weight: 0.2,
      description: 'Applicant must be between 18-45 years old',
      mandatory: true,
    },
    {
      id: 'crit-employment',
      field: 'employmentStatus',
      operator: 'in',
      value: ['unemployed', 'self_employed'],
      weight: 0.3,
      description: 'Must be unemployed or seeking better employment',
      mandatory: true,
    },
    {
      id: 'crit-education',
      field: 'education',
      operator: 'in',
      value: ['no_formal', 'primary', 'secondary', 'graduate'],
      weight: 0.15,
      description: 'Open to all education levels',
      mandatory: false,
    },
    {
      id: 'crit-income',
      field: 'incomeRange',
      operator: 'in',
      value: ['below_50k', '50k_1l', '1l_2l', '2l_5l'],
      weight: 0.2,
      description: 'Priority given to lower income groups',
      mandatory: false,
    },
    {
      id: 'crit-location-rural',
      field: 'location.ruralUrban',
      operator: 'eq',
      value: 'rural',
      weight: 0.15,
      description: 'Special focus on rural youth',
      mandatory: false,
    },
  ],
  requiredDocuments: [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Valid Aadhaar card for identity verification',
    },
    {
      type: 'education',
      name: 'Educational Certificates',
      mandatory: false,
      description: 'Educational qualification certificates (if any)',
    },
    {
      type: 'bank_account',
      name: 'Bank Account Details',
      mandatory: true,
      description: 'Bank account for stipend disbursement',
    },
    {
      type: 'photo',
      name: 'Passport Size Photograph',
      mandatory: true,
      description: 'Recent passport size photograph',
    },
  ],
  applicableStates: [], // All states
  ruralUrbanFilter: 'both',
  isOpenEnded: true,
  processingTime: '15-30 days',
  applicationMode: 'both',
  applicationUrl: 'https://www.pmkvyofficial.org',
  officeLocations: [
    {
      name: 'District Skill Development Centre',
      address: 'Contact your local District Employment Office',
      district: 'All Districts',
    },
  ],
  trustLevel: 'verified',
  sourceUrl: 'https://www.pmkvyofficial.org',
  lastVerified: '2024-01-20T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-20T00:00:00Z',
};

/**
 * Widow Pension Scheme
 * Target: Widows from economically weaker sections
 */
export const widowPensionRule: EligibilityRule = {
  id: 'rule-widow-pension-karnataka-2024',
  schemeId: 'scheme-widow-pension-karnataka',
  schemeName: 'Karnataka Widow Pension Scheme',
  schemeNameTranslations: {
    hi: 'कर्नाटक विधवा पेंशन योजना',
    kn: 'ಕರ್ನಾಟಕ ವಿಧವೆ ಪಿಂಚಣಿ ಯೋಜನೆ',
  },
  description: 'Monthly pension for widows from economically weaker sections in Karnataka',
  descriptionTranslations: {
    hi: 'कर्नाटक में आर्थिक रूप से कमजोर वर्गों की विधवाओं के लिए मासिक पेंशन',
    kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಆರ್ಥಿಕವಾಗಿ ದುರ್ಬಲ ವರ್ಗಗಳ ವಿಧವೆಯರಿಗೆ ಮಾಸಿಕ ಪಿಂಚಣಿ',
  },
  category: 'welfare',
  targetAudience: ['women', 'widows', 'economically-weaker-sections'],
  criteria: [
    {
      id: 'crit-age-range',
      field: 'ageRange',
      operator: 'in',
      value: ['18-25', '26-35', '36-45', '46-60', '60+'],
      weight: 0.15,
      description: 'Applicant must be 18 years or older',
      mandatory: true,
    },
    {
      id: 'crit-gender',
      field: 'gender',
      operator: 'eq',
      value: 'female',
      weight: 0.25,
      description: 'Scheme is for women only',
      mandatory: true,
    },
    {
      id: 'crit-state',
      field: 'location.state',
      operator: 'eq',
      value: 'Karnataka',
      weight: 0.2,
      description: 'Must be a resident of Karnataka',
      mandatory: true,
    },
    {
      id: 'crit-income',
      field: 'incomeRange',
      operator: 'in',
      value: ['below_50k', '50k_1l'],
      weight: 0.25,
      description: 'Annual family income must be below ₹1 lakh',
      mandatory: true,
    },
    {
      id: 'crit-category',
      field: 'category',
      operator: 'in',
      value: ['sc', 'st', 'obc', 'ews', 'general'],
      weight: 0.15,
      description: 'Open to all categories',
      mandatory: false,
    },
  ],
  requiredDocuments: [
    {
      type: 'aadhaar',
      name: 'Aadhaar Card',
      mandatory: true,
      description: 'Valid Aadhaar card for identity verification',
    },
    {
      type: 'death_certificate',
      name: 'Husband\'s Death Certificate',
      mandatory: true,
      description: 'Death certificate of deceased husband',
    },
    {
      type: 'income_certificate',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Income certificate from competent authority',
    },
    {
      type: 'domicile_certificate',
      name: 'Domicile Certificate',
      mandatory: true,
      description: 'Proof of Karnataka residence',
      alternativeDocuments: ['ration_card', 'voter_id'],
    },
    {
      type: 'bank_account',
      name: 'Bank Account Details',
      mandatory: true,
      description: 'Bank account for pension disbursement',
    },
    {
      type: 'caste_certificate',
      name: 'Caste Certificate',
      mandatory: false,
      description: 'Caste certificate (if applicable)',
    },
  ],
  applicableStates: ['Karnataka'],
  applicableDistricts: [], // All districts in Karnataka
  ruralUrbanFilter: 'both',
  isOpenEnded: true,
  processingTime: '30-45 days',
  applicationMode: 'both',
  applicationUrl: 'https://sevasindhu.karnataka.gov.in',
  officeLocations: [
    {
      name: 'Taluk Office',
      address: 'Contact your local Taluk Office or Gram Panchayat',
      district: 'All Districts',
      contactNumber: '1800-425-9339',
    },
  ],
  trustLevel: 'verified',
  sourceUrl: 'https://sevasindhu.karnataka.gov.in',
  lastVerified: '2024-01-18T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-18T00:00:00Z',
};

/**
 * All sample eligibility rules
 */
export const sampleEligibilityRules: EligibilityRule[] = [
  pmScholarshipRule,
  skillDevelopmentRule,
  widowPensionRule,
];
