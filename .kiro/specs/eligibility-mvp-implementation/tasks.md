# Implementation Plan: Eligibility MVP

## Overview

This implementation plan focuses on building a practical MVP for the Eligibility-First Community Access Platform. The MVP demonstrates core eligibility evaluation functionality using AWS serverless services (Lambda, API Gateway, DynamoDB, Bedrock) with a simple React frontend. The implementation prioritizes the essential eligibility evaluation flow with hybrid rule-based and LLM-powered reasoning, structured JSON responses, and basic document management.

The architecture uses Node.js/TypeScript for Lambda functions, Amazon Bedrock (Claude 3 Sonnet) for contextual reasoning, DynamoDB single-table design for data storage, and Amazon Cognito for basic authentication. All tasks include starter code structure and skeleton implementations to accelerate development.

## Tasks

- [x] 1. Set up project structure and AWS infrastructure foundation
  - Create monorepo structure with separate folders for frontend, backend Lambda functions, and infrastructure
  - Initialize TypeScript configuration for Lambda functions
  - Set up AWS CDK or CloudFormation templates for infrastructure as code
  - Configure DynamoDB single-table design schema
  - Set up Amazon Cognito user pool for basic authentication
  - Create S3 bucket for document uploads with encryption enabled
  - Configure API Gateway with Cognito authorizer
  - Set up CloudWatch log groups with 7-day retention
  - _Requirements: NFR-7 (AWS Cloud Platform), NFR-4 (Security)_

- [ ] 2. Implement user profile management
  - [x] 2.1 Create user profile data model and DynamoDB access patterns
    - Define TypeScript interfaces for UserProfile (age range, location, education, income, category, disability)
    - Implement DynamoDB single-table design with PK/SK patterns for user profiles
    - Create Lambda function for profile CRUD operations
    - Add data validation for required fields and consent tracking
    - _Requirements: FR-1.1, FR-1.2, FR-1.3, 4.1 (User Profile Inputs), NFR-4 (Privacy)_
  
  - [x] 2.2 Write unit tests for profile validation
    - Test age range validation
    - Test location validation (state, district, rural/urban)
    - Test consent requirement enforcement
    - Test optional field handling (category, disability)
    - _Requirements: 4.1 (User Profile Inputs)_

- [ ] 3. Create eligibility rule engine and configuration
  - [x] 3.1 Design eligibility rule configuration format (JSON)
    - Create JSON schema for eligibility rules with criteria, operators, and weights
    - Implement sample eligibility rules for 2-3 common schemes (education scholarship, employment scheme)
    - Define rule operators (eq, lt, gt, in, range) and matching logic
    - Store rules in DynamoDB with scheme metadata
    - _Requirements: FR-2.1, FR-2.2, FR-2.3, 5.1 (Scheme Data Model)_
  
  - [x] 3.2 Implement deterministic rule evaluation engine
    - Create Lambda function for rule-based eligibility checking
    - Implement criterion matching logic (exact, range, approximate)
    - Calculate confidence scores based on matched/missing criteria
    - Identify missing criteria and required documents
    - Return structured evaluation result with confidence band
    - _Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.4_
  
  - [x] 3.3 Write unit tests for rule evaluation
    - Test exact match scenarios (age, location, category)
    - Test range matching (income ranges)
    - Test confidence score calculation
    - Test missing criteria identification
    - _Requirements: FR-2.1, FR-2.2, FR-2.3_

- [ ] 4. Integrate Amazon Bedrock for contextual reasoning
  - [x] 4.1 Create Bedrock integration module
    - Set up AWS SDK for Bedrock with Claude 3 Sonnet model
    - Implement prompt template for eligibility reasoning
    - Create function to format user profile and scheme criteria for LLM
    - Parse LLM response and extract structured eligibility assessment
    - Implement error handling and fallback to rule-based evaluation
    - _Requirements: FR-2.1, FR-3.1, FR-3.2, NFR-7 (Amazon Bedrock)_
  
  - [x] 4.2 Implement hybrid eligibility evaluation flow
    - Create orchestration Lambda that combines rule-based and LLM evaluation
    - Apply deterministic rules first for clear-cut cases
    - Call Bedrock only when contextual reasoning is needed (ambiguous cases)
    - Merge rule-based and LLM results into unified confidence score
    - Generate why/why-not explanation using LLM
    - Return structured JSON response with eligibility status, confidence, explanation, missing criteria
    - _Requirements: FR-2.1, FR-2.3, FR-3.1, FR-3.2, FR-3.3_
  
  - [x] 4.3 Write integration tests for Bedrock calls
    - Test prompt formatting with sample user profiles
    - Test LLM response parsing
    - Test fallback behavior when Bedrock is unavailable
    - Test cost optimization (caching, minimal calls)
    - _Requirements: FR-2.1, FR-3.1_

- [ ] 5. Build eligibility evaluation API
  - [x] 5.1 Create API Gateway endpoints and Lambda handlers
    - POST /api/v1/eligibility/evaluate - Main eligibility evaluation endpoint
    - GET /api/v1/eligibility/user/:userId - Retrieve past evaluations
    - POST /api/v1/eligibility/re-evaluate - Re-evaluate after profile update
    - Implement request validation and error handling
    - Add Cognito authorization to all endpoints
    - _Requirements: FR-2.1, FR-2.5_
  
  - [x] 5.2 Implement response formatting and caching
    - Format eligibility response as structured JSON (status, confidence, explanation, missing_criteria, suggested_next_steps)
    - Implement DynamoDB caching for evaluation results (15-minute TTL)
    - Add CloudWatch metrics for API latency and error rates
    - Implement rate limiting to prevent cost overruns
    - _Requirements: FR-2.3, FR-3.1, NFR-5 (Performance)_
  
  - [x] 5.3 Write API integration tests
    - Test complete eligibility evaluation flow
    - Test caching behavior
    - Test error responses (invalid input, missing data)
    - Test authorization enforcement
    - _Requirements: FR-2.1, FR-2.3_

- [x] 6. Checkpoint - Ensure core eligibility evaluation works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement basic document management
  - [x] 7.1 Create document upload and storage functionality
    - Create Lambda function for generating S3 pre-signed upload URLs
    - Implement document metadata storage in DynamoDB (type, source, verified status)
    - Add S3 event trigger for document processing (validation, metadata extraction)
    - Support document types: Aadhaar, income certificate, caste certificate, education certificates
    - _Requirements: FR-7.1, FR-7.4, 4.3 (Documents & Credentials)_
  
  - [x] 7.2 Implement document gap detection
    - Create function to compare user documents against scheme requirements
    - Identify missing required documents
    - Return prioritized list of missing documents with descriptions
    - Include document gap information in eligibility response
    - _Requirements: FR-7.2, FR-2.4_
  
  - [x] 7.3 Write tests for document management
    - Test pre-signed URL generation
    - Test document metadata storage
    - Test document gap detection logic
    - _Requirements: FR-7.2, FR-7.4_

- [ ] 8. Build React frontend for eligibility evaluation
  - [x] 8.1 Create basic frontend structure and authentication
    - Initialize React app with TypeScript
    - Set up AWS Amplify for Cognito authentication
    - Create login/signup pages with phone number + OTP
    - Implement protected routes for authenticated users
    - _Requirements: FR-1.2, NFR-7 (Cognito)_
  
  - [x] 8.2 Build user profile form
    - Create structured form for user profile input (age, location, education, income, category, disability)
    - Implement form validation and error handling
    - Add consent checkboxes for sensitive data (category, disability, income)
    - Submit profile data to backend API
    - _Requirements: FR-1.2, FR-1.3, 4.1 (User Profile Inputs), NFR-4 (Consent)_
  
  - [x] 8.3 Create eligibility evaluation interface
    - Build scheme selection dropdown (2-3 sample schemes)
    - Create "Check Eligibility" button to trigger evaluation
    - Display eligibility result with status badge (Strongly Eligible, Conditionally Eligible, Low Confidence)
    - Show confidence score as percentage or visual indicator
    - Display why/why-not explanation in readable format
    - Show missing criteria and required documents
    - Display suggested next steps
    - _Requirements: FR-2.3, FR-3.1, FR-3.2, FR-3.3_
  
  - [x] 8.4 Add document upload interface
    - Create document upload component with drag-and-drop
    - Display list of uploaded documents with status
    - Show missing documents highlighted
    - Implement file validation (size, type)
    - _Requirements: FR-7.4, 4.3 (Documents)_

- [ ] 9. Implement sample eligibility rules and test data
  - [x] 9.1 Create sample scheme configurations
    - Define 2-3 realistic schemes (e.g., PM Scholarship, Skill Development Program, Employment Scheme)
    - Write eligibility rules for each scheme in JSON format
    - Include required documents for each scheme
    - Store schemes in DynamoDB
    - _Requirements: FR-2.1, 5.1 (Scheme Data Model)_
  
  - [x] 9.2 Create sample user profiles for testing
    - Generate 5-10 test user profiles with varying eligibility scenarios
    - Include profiles that are strongly eligible, conditionally eligible, and not eligible
    - Test edge cases (missing data, ambiguous criteria)
    - _Requirements: FR-2.1, FR-2.2, FR-2.3_

- [ ] 10. Add basic monitoring and cost controls
  - [x] 10.1 Set up CloudWatch dashboards and alarms
    - Create dashboard for API latency, error rates, and invocation counts
    - Set up alarms for high error rates (>5%)
    - Set up alarms for high API latency (>5s)
    - Monitor Bedrock API call frequency and costs
    - _Requirements: NFR-5 (Performance), NFR-7 (CloudWatch)_
  
  - [x] 10.2 Implement cost optimization measures
    - Add caching for Bedrock responses (identical inputs)
    - Implement rate limiting on API Gateway
    - Set DynamoDB to on-demand capacity mode
    - Configure CloudWatch log retention to 7 days
    - Set up AWS Budget alerts at ₹1,000, ₹3,000, ₹5,000
    - _Requirements: NFR-7 (Cost Efficiency)_

- [ ] 11. Create deployment scripts and documentation
  - [x] 11.1 Write deployment automation
    - Create deployment script for AWS CDK/CloudFormation stack
    - Add environment configuration (dev, staging, prod)
    - Document AWS credentials setup
    - Create script to seed sample schemes and test data
    - _Requirements: NFR-7 (Infrastructure)_
  
  - [x] 11.2 Write API documentation and usage examples
    - Document all API endpoints with request/response examples
    - Create README with setup instructions
    - Document environment variables and configuration
    - Include sample curl commands for testing
    - Add architecture diagram showing AWS services
    - _Requirements: All functional requirements_

- [x] 12. Final checkpoint - End-to-end testing and demo preparation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Focus is on demonstrable MVP functionality, not production-scale features
- All code should be skeleton implementations that can be extended later
- Prioritize working end-to-end flow over comprehensive feature coverage
- Use AWS Free Tier services where possible to minimize costs
- Bedrock calls should be minimized through caching and hybrid evaluation approach

## MVP Scope Boundaries

**Included in MVP:**
- User profile submission via structured form
- Rule-based eligibility evaluation with confidence scoring
- LLM-based contextual reasoning for ambiguous cases (Bedrock)
- Hybrid evaluation flow (rules first, LLM when needed)
- Why/why-not explanation generation
- Confidence band classification (Strong/Conditional/Low)
- Missing criteria and document identification
- Basic document upload to S3
- Structured JSON API responses
- Simple React frontend with authentication
- Sample eligibility rules for 2-3 schemes
- Basic monitoring and cost controls

**Explicitly Excluded from MVP (Future Phases):**
- Voice input/output (Amazon Transcribe/Polly)
- Multilingual support (Amazon Translate)
- DigiLocker integration
- SMS/IVR notifications
- Offline PWA capabilities
- Personalized roadmap generation
- Form filling assistance
- Advanced analytics dashboard
- Multi-region deployment
- Production-scale security hardening
- Comprehensive test coverage
- Life event triggered re-evaluation
- Community features or gamification

## Architecture Summary

**Frontend:** React + TypeScript + AWS Amplify (Cognito auth)
**Backend:** AWS Lambda (Node.js/TypeScript) + API Gateway
**Database:** Amazon DynamoDB (single-table design)
**AI/ML:** Amazon Bedrock (Claude 3 Sonnet)
**Storage:** Amazon S3 (documents)
**Auth:** Amazon Cognito (user pool)
**Monitoring:** Amazon CloudWatch (logs, metrics, alarms)
**Region:** ap-south-1 (Mumbai)

**Estimated Cost:** ₹3,000-5,000/month with AWS Free Tier
