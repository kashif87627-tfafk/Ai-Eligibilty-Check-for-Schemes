#  Eligibility-First Community Access Platform
## Requirements Document

---

## Executive Summary

In India, welfare scheme access fails not due to lack of initiatives, but because of the **eligibility-to-action gap**—users cannot self-assess eligibility, understand requirements, or navigate complex application processes. This platform addresses this gap through an **eligibility-first AI approach** that evaluates user profiles against scheme criteria, provides explainable confidence scores, and generates personalized roadmaps for successful application completion.

The system leverages **Amazon Bedrock for AI-powered eligibility reasoning** with transparent explanations, ensuring users understand why they are eligible or ineligible. It prioritizes **responsible AI practices** including explainability, uncertainty handling, and bias mitigation. The platform is designed as a **serverless, cost-efficient solution on AWS** using Lambda, API Gateway, DynamoDB, S3, and Cognito for scalability and reliability.

The **MVP focuses on core features**: conversational profile creation, AI-based eligibility evaluation with confidence bands, explainable why/why-not reasoning, personalized roadmaps, and document management. This hackathon-ready architecture demonstrates production viability while remaining feasible for student teams using AWS Free Tier and educational credits.

---

## 1. Project Overview

Eligibility-First community access platform is designed to bridge the gap between welfare scheme availability and successful benefit access in India. The system addresses the fundamental problem that communities face: not discovering schemes, but converting eligibility into successful applications through explainable, ethical, and inclusive technology.

The platform tackles cognitive overload, procedural complexity, and informational barriers by providing AI-powered eligibility evaluation, personalized guidance, and assisted application processes. It prioritizes voice-first interaction, offline tolerance, and explainability to serve low-literacy users in resource-constrained environments.

**High-level goals:**
- Enable accurate, explainable eligibility evaluation for government schemes and benefits
- Provide step-by-step guidance from eligibility to successful application
- Reduce dependency on exploitative intermediaries
- Support offline-first, voice-enabled, multilingual interaction
- Ensure transparency, consent, and responsible AI practices

---

## 2. Problem Statement

Access to welfare schemes, government benefits, scholarships, and public programs in India fails not due to lack of initiatives, but because of **cognitive, procedural, and informational overload** faced by communities.

**Key barriers:**
- **Eligibility criteria complexity:** Fragmented rules across schemes, unclear documentation requirements, and conditional logic that users cannot parse
- **Procedural overload:** Repetitive form filling, unclear application steps, missing deadline awareness
- **Literacy and language barriers:** Text-heavy portals assume literacy and structured data input
- **Intermediary dependency:** Offline users rely on middlemen who may misinform or exploit them
- **Discovery vs. conversion gap:** Existing portals focus on listing schemes but fail to guide users from eligibility to successful access

The core problem is **not discovery of schemes**, but **conversion from eligibility to successful access**, in a manner that is explainable, ethical, deployable, and inclusive at scale.

Discovery alone is insufficient because:
- Users cannot self-assess eligibility accurately
- They lack guidance on what documents are needed
- They do not understand why they are ineligible or how to improve eligibility
- They abandon applications due to complexity and lack of support

---

## 3. Target Users

### 3.1 Primary Users

- **Rural and backward community members:** Users in remote areas with limited digital literacy and infrastructure
- **Low-literacy and non-literate users:** Individuals who cannot read or write fluently, requiring voice-first interaction
- **First-time applicants:** Users applying for government schemes or benefits for the first time, unfamiliar with processes

### 3.2 Secondary Users

- **Students and job seekers:** Young adults seeking scholarships, skill programs, or employment schemes
- **Informal workers and daily-wage earners:** Unorganized sector workers needing welfare support
- **Women and elderly users:** Vulnerable groups accessing welfare programs, often with limited digital access

### 3.3 Institutional Users

- **NGOs and social workers:** Organizations assisting communities in accessing benefits
- **Common Service Centres (CSCs):** Government-run digital service points in rural areas
- **Panchayat and local governance bodies:** Local administrators facilitating scheme access
- **CSR and public welfare administrators:** Corporate and public sector entities managing welfare programs

### 3.4 User Constraints

- **Limited internet connectivity:** Intermittent or no internet access in rural and remote areas
- **Preference for voice-based interaction:** Users prefer speaking over typing due to literacy barriers
- **Incomplete or informal information input:** Users may provide approximate, incomplete, or colloquial data

---

## 4. Core Inputs

### 4.1 User Profile Inputs

The system must collect the following user profile information through conversational interaction:

- **Age range:** Approximate age or age bracket
- **Gender:** Optional, consent-based
- **Location:** State, district, rural/urban classification
- **Education level:** Highest qualification (if applicable)
- **Occupation and employment status:** Current work status (employed, unemployed, self-employed, student, etc.)
- **Approximate income range:** Monthly or annual income bracket
- **Caste/category:** Optional, consent-based (General, OBC, SC, ST, etc.)
- **Disability status:** Optional, consent-based

### 4.2 Life Event Updates

Users may update their profile based on life events that trigger eligibility changes:

- **Graduation:** Completion of education milestones
- **Income changes:** Salary increase, job loss, new employment
- **Employment changes:** Job transitions, unemployment, self-employment
- **Family status updates:** Marriage, childbirth, dependent changes

### 4.3 Documents & Credentials

The system must support document collection and verification:

- **DigiLocker-linked documents:** Aadhaar, income certificate, caste certificate, domicile certificate, etc.
- **User-uploaded certificates:** Education certificates, skill certifications, local proofs (ration card, voter ID, etc.)

### 4.4 User Preferences

- **Language preference:** User's preferred language for interaction (Hindi, English, regional languages)
- **Voice or text interaction:** User's preferred input/output mode
- **Explanation simplicity level:** Standard explanations vs. very simple explanations

---

## 5. Functional Requirements

### 5.1 Conversational Intake

**FR-1.1:** The system must support voice-based input for user profile collection and updates.

**FR-1.2:** The system must support text-based input as an alternative to voice.

**FR-1.3:** The system must handle incomplete or informal inputs gracefully, prompting for clarification when necessary.

**FR-1.4:** The system must support multilingual interaction using Amazon Translate or equivalent translation services.

**FR-1.5:** The system must allow users to provide approximate or range-based information (e.g., "around 20,000 per month" for income).

### 5.2 Eligibility Evaluation

**FR-2.1:** The system must evaluate user eligibility for government schemes and benefits using AI-based reasoning, not purely rule-based logic.

**FR-2.2:** The system must support partial and conditional eligibility assessment.

**FR-2.3:** The system must classify eligibility into confidence bands:
- **Strongly Eligible:** User meets all criteria with high confidence
- **Conditionally Eligible:** User meets most criteria but requires verification or additional documents
- **Needs Verification:** Eligibility uncertain due to missing or ambiguous information

**FR-2.4:** The system must identify missing criteria or documents that prevent eligibility.

**FR-2.5:** The system must re-evaluate eligibility when user profile or life events are updated.

### 5.3 Explainability Engine

**FR-3.1:** The system must provide clear, localized explanations for why a user is eligible or ineligible for a scheme.

**FR-3.2:** The system must highlight missing criteria or documents in simple language.

**FR-3.3:** The system must suggest actionable steps to improve eligibility (e.g., "Obtain income certificate from Tehsil office").

**FR-3.4:** The system must adapt explanation complexity based on user preference (standard vs. very simple).

**FR-3.5:** The system must provide explanations in the user's preferred language.

### 5.4 Eligibility-Gated Opportunity Mapping

**FR-4.1:** The system must surface opportunities (schemes, benefits, programs) only after confirming user eligibility.

**FR-4.2:** The system must filter opportunities based on location (state, district, rural/urban).

**FR-4.3:** The system must indicate whether opportunities are accessible online, offline, or through intermediaries (CSCs, Panchayats).

**FR-4.4:** The system must prioritize opportunities based on eligibility confidence and user relevance.

### 5.5 Personalized Roadmap & Timeline

**FR-5.1:** The system must generate a step-by-step roadmap for each eligible scheme, including:
- Document collection steps
- Application submission steps
- Verification and follow-up steps

**FR-5.2:** The system must provide deadlines and reminders for time-sensitive schemes.

**FR-5.3:** The system must allow users to resume from the last completed step in a roadmap.

**FR-5.4:** The system must track user progress through roadmaps and update status accordingly.

### 5.6 Assisted Form Filling

**FR-6.1:** The system must reuse previously provided user data (with consent) to pre-fill application forms.

**FR-6.2:** The system must provide field-by-field guidance for form completion.

**FR-6.3:** The system must reduce repetitive data entry across multiple applications.

**FR-6.4:** The system must validate form inputs and highlight errors or missing fields.

### 5.7 Document Intelligence

**FR-7.1:** The system must integrate with DigiLocker to fetch and verify government-issued documents.

**FR-7.2:** The system must detect document gaps contextually based on scheme requirements.

**FR-7.3:** The system must remind users of certificate expiry dates and renewal requirements.

**FR-7.4:** The system must support user-uploaded documents when DigiLocker integration is unavailable.

### 5.8 Offline-Tolerant Support

**FR-8.1:** The system must cache user profiles, eligibility results, and roadmaps locally for offline access.

**FR-8.2:** The system must support delayed synchronization when connectivity is restored.

**FR-8.3:** The system must provide SMS-based reminders and updates for users without internet access.

**FR-8.4:** The system must support IVR (Interactive Voice Response) fallback for voice-based reminders and updates.

**FR-8.5:** The system must allow users to record voice inputs offline and sync them later.

### 5.9 Trust & Reliability Indicators

**FR-9.1:** The system must classify information sources using a trust gradient:
- **Verified:** Information from official government sources
- **Partially Correct:** Information from semi-official or community sources
- **Misleading:** Information flagged as potentially incorrect
- **Unverifiable:** Information without clear source attribution

**FR-9.2:** The system must display confidence levels for eligibility assessments.

**FR-9.3:** The system must explicitly indicate uncertainty when eligibility cannot be determined with confidence.

### 5.10 Life-Event Triggered Re-Evaluation

**FR-10.1:** The system must automatically re-check eligibility when users update their profile with life events.

**FR-10.2:** The system must notify users of newly eligible schemes after profile updates.

**FR-10.3:** The system must archive outdated eligibility results and maintain a history of changes.

---

## 6. Non-Functional Requirements

**NFR-1: Accessibility and Inclusivity**
- The system must be usable by low-literacy and non-literate users.
- The system must support screen readers and assistive technologies.
- The system must provide high-contrast and large-text modes for visually impaired users.

**NFR-2: Multilingual and Voice-First Usability**
- The system must support at least 10 Indian languages (Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi).
- The system must prioritize voice interaction over text input.
- The system must achieve >85% accuracy in voice recognition for supported languages.

**NFR-3: Explainability and Transparency**
- All AI-driven decisions must be explainable in simple language.
- The system must provide reasoning traces for eligibility assessments.
- The system must avoid black-box decision-making.

**NFR-4: Privacy, Consent, and Data Security**
- The system must obtain explicit user consent before collecting sensitive data (caste, disability status, income).
- The system must encrypt user data at rest and in transit using industry-standard encryption (AWS KMS for key management).
- The system must comply with India's Digital Personal Data Protection Act (DPDPA).
- The system must allow users to delete their data on request (right to erasure).
- The system must maintain comprehensive audit logs for all data access and modifications (AWS CloudTrail).
- The system must implement role-based access control (RBAC) for data access (AWS Cognito and IAM).

**NFR-5: Scalability and Performance**
- The system must support at least 10,000 concurrent users.
- Eligibility evaluation must complete within 5 seconds for 95% of requests.
- The system must handle peak loads during scheme announcement periods.

**NFR-6: Reliability in Low-Connectivity Environments**
- The system must function with intermittent connectivity (offline-first architecture).
- The system must gracefully degrade functionality when services are unavailable.
- The system must sync data within 30 seconds of connectivity restoration.

**NFR-7: Cloud & Platform Requirements**
- The system must be deployed on AWS cloud infrastructure using managed services.
- The system must use Amazon Bedrock for AI-powered eligibility reasoning and explanation generation.
- The system must leverage serverless architecture with AWS Lambda for event-driven functions.
- The system must use AWS API Gateway for unified API management with authentication and rate limiting.
- The system must use Amazon DynamoDB for high-speed analytics and event storage.
- The system must use Amazon S3 for secure document storage with encryption.
- The system must use Amazon Cognito for user authentication and authorization.
- The system must use Amazon SNS for SMS notifications and messaging.
- The system must use Amazon RDS (PostgreSQL) for structured data storage.
- The system must use Amazon ElastiCache (Redis) for caching and session management.
- The system must emphasize scalability through auto-scaling and managed services.
- The system must prioritize cost-efficiency using AWS Free Tier and pay-per-use pricing models.
- The system must ensure reliability through Multi-AZ deployments and automated backups.

---

## 7. Responsible AI Requirements

**RAI-1: Explainable AI Decisions**
- All eligibility assessments must include human-readable explanations.
- The system must avoid opaque or unexplainable AI models.

**RAI-2: No Automated Denial Without Explanation**
- The system must never reject a user without providing a clear reason.
- The system must suggest corrective actions for ineligible users.

**RAI-3: Explicit Uncertainty Handling**
- The system must indicate when eligibility cannot be determined with confidence.
- The system must avoid false positives or false negatives by acknowledging uncertainty.

**RAI-4: Bias Awareness and Mitigation**
- The system must be tested for bias across caste, gender, location, and income groups.
- The system must not disadvantage any user group systematically.

**RAI-5: No Advertisements, Sponsored Content, or Data Selling**
- The system must not display advertisements or sponsored scheme listings.
- The system must not sell or share user data with third parties.
- The system must not prioritize schemes based on commercial interests.

---

## 8. Institutional & Admin Requirements

**INST-1: Eligibility Drop-Off Analytics**
- The system must track where users abandon the application process.
- The system must identify common document or eligibility blockers.
- The system must provide aggregated, privacy-preserving reports.

**INST-2: Community Readiness Insights**
- The system must analyze awareness vs. eligibility gaps by region.
- The system must identify common failure patterns across schemes.
- The system must provide insights to NGOs, CSCs, and governance bodies.

**INST-3: Aggregated, Privacy-Preserving Reporting**
- All analytics must be aggregated and anonymized.
- The system must not expose individual user data in reports.

**INST-4: Explainability and Audit Logs**
- The system must maintain high-level reasoning traces for eligibility decisions.
- The system must log confidence levels and uncertainty indicators.
- The system must provide audit trails for institutional users.

---

## 9. Constraints and Assumptions

**Constraints:**
- **Changing scheme eligibility rules:** Government schemes frequently update eligibility criteria, requiring dynamic rule management.
- **Partial data availability:** Users may not have all required documents or information at the time of assessment.
- **Voice recognition accuracy variability:** Accuracy may vary based on accent, dialect, and background noise.
- **Dependence on external integrations:** The system relies on Amazon Transcribe (speech-to-text), Amazon Polly (text-to-speech), Amazon Translate (translation), DigiLocker (documents), and government APIs (scheme data).

**Assumptions:**
- Users have access to a smartphone or feature phone with basic internet connectivity (even if intermittent).
- Government schemes provide publicly accessible eligibility criteria and application processes.
- DigiLocker adoption will increase, enabling document verification at scale.
- NGOs, CSCs, and local governance bodies will act as facilitators for offline users.

---

## 10. Success Metrics

**SM-1: Reduction in Abandoned or Failed Applications**
- Target: 30% reduction in application abandonment rate within 6 months.

**SM-2: Percentage of Eligible Users Completing Roadmaps**
- Target: 70% of eligible users complete at least one roadmap within 3 months.

**SM-3: Improved Scheme Uptake**
- Target: 20% increase in successful scheme applications through guided access.

**SM-4: User Satisfaction and Trust Indicators**
- Target: >80% user satisfaction score (measured via post-interaction surveys).
- Target: >75% trust score for eligibility explanations.

**SM-5: Reduced Dependency on Intermediaries**
- Target: 40% of users complete applications without intermediary assistance.

---

## 12. Technology Implementation Notes

### 12.1 Cloud Infrastructure (AWS)

The system will be deployed on Amazon Web Services (AWS) to leverage managed services, scalability, and cost-efficiency:

**Compute & Hosting:**
- Amazon ECS (Fargate) for containerized microservices with serverless compute
- AWS Lambda for event-driven functions (reminders, notifications, data processing)
- AWS Amplify for Progressive Web App hosting with automatic CI/CD

**Data Storage:**
- Amazon RDS (PostgreSQL) for structured data with Multi-AZ deployment for high availability
- Amazon DocumentDB for semi-structured scheme data (MongoDB-compatible)
- Amazon ElastiCache (Redis) for caching and session management
- Amazon S3 for document storage with server-side encryption (SSE-KMS)
- Amazon DynamoDB for high-speed analytics event storage

**AI/ML Services:**
- Amazon Bedrock for eligibility reasoning using Claude/Llama models
- Amazon SageMaker for custom model training and inference
- Amazon Comprehend for entity extraction and text analysis

**Integration & Messaging:**
- AWS API Gateway for unified API management with authentication and rate limiting
- Amazon SNS for SMS notifications and pub/sub messaging
- Amazon SQS for asynchronous task queuing
- Amazon Connect for IVR functionality

**Security & Identity:**
- Amazon Cognito for user authentication and authorization
- AWS KMS for encryption key management
- AWS WAF for web application firewall protection
- AWS Secrets Manager for secure credential storage

**Monitoring & Analytics:**
- Amazon CloudWatch for logging, metrics, and alarms
- AWS X-Ray for distributed tracing
- Amazon QuickSight for institutional analytics dashboards
- Amazon Athena for ad-hoc analytics queries

**Content Delivery:**
- Amazon CloudFront for global CDN and edge caching
- AWS Certificate Manager for SSL/TLS certificate management

### 12.2 Cost Optimization Strategy

- Use AWS Free Tier for initial development and testing
- Implement auto-scaling to match demand and avoid over-provisioning
- Use Savings Plans and Reserved Instances for predictable workloads (40-60% savings)
- Leverage serverless services (Lambda, Bedrock) for pay-per-use pricing
- Enable S3 Intelligent-Tiering for automatic storage cost optimization
- Use CloudFront caching to reduce origin requests and data transfer costs
- Monitor costs using AWS Cost Explorer and set up budget alerts

**Estimated Cost:** ~$3,125/month for 10,000 users (~$0.31 per user per month)

### 12.3 Deployment & Operations

**CI/CD Pipeline:**
- AWS CodePipeline for orchestrating build, test, and deployment
- AWS CodeBuild for compiling code and running tests
- AWS CodeDeploy for automated deployment with blue-green strategy
- Amazon ECR for container image storage

**Disaster Recovery:**
- Multi-AZ deployments for databases and caching layers
- Automated backups with point-in-time recovery (RDS, DocumentDB)
- S3 cross-region replication for critical documents
- RTO: 4 hours, RPO: 1 hour

**Compliance:**
- AWS compliance certifications (ISO 27001, SOC 2)
- DPDPA compliance through encryption, access controls, and audit logging
- Data residency in India (AWS Asia Pacific Mumbai region)

---

## 11. Out of Scope (v1)

The following features are explicitly out of scope for the initial version:

- **Advertisements or sponsored listings:** No commercial content or paid promotions.
- **Paid or premium features:** All features must be free for end users.
- **Full automation of government submission portals:** The system guides users but does not replace official submission systems.
- **Replacement of existing public systems:** The system complements, not replaces, government portals and services.
- **Real-time scheme data scraping:** The system relies on curated or API-provided scheme data, not web scraping.
- **Financial transactions or payment processing:** The system does not handle money transfers or payments.

---

## 13. Requirements to Service Traceability Mapping

This section maps functional requirements to their corresponding system services and components for implementation traceability.

| Requirement ID | Requirement Name | Mapped Service/Component | Implementation Notes |
|----------------|------------------|--------------------------|---------------------|
| FR-1 | Conversational Intake | Conversation Service | Voice/text input handling, Amazon Transcribe/Polly integration |
| FR-2 | Eligibility Evaluation | Eligibility Service | AI-based reasoning using Amazon Bedrock, confidence scoring |
| FR-3 | Explainability Engine | Explainability Service | Why/why-not explanation generation, multilingual support |
| FR-4 | Eligibility-Gated Opportunity Mapping | Opportunity Mapping Service | Location-aware filtering, eligibility-based surfacing |
| FR-5 | Personalized Roadmap & Timeline | Roadmap Service | Step-by-step guidance, progress tracking, reminders |
| FR-6 | Assisted Form Filling | Form Filling Service | Data reuse, field-by-field guidance, validation |
| FR-7 | Document Intelligence | Document Service | DigiLocker integration, S3 storage, gap detection |
| FR-8 | Offline-Tolerant Support | Sync Service + PWA | Local caching, background sync, SMS/IVR fallback |
| FR-9 | Trust & Reliability Indicators | Trust Classification Logic | Source verification, confidence display, uncertainty handling |
| FR-10 | Life-Event Triggered Re-Evaluation | Profile Update & Re-evaluation Service | Event detection, automatic re-assessment, notifications |

**Service Dependencies:**
- All services depend on Amazon Cognito for authentication
- All services use Amazon CloudWatch for logging and monitoring
- Eligibility and Explainability services share Amazon Bedrock integration
- Document and Form Filling services share Amazon S3 storage
- Roadmap and Notification services share Amazon SNS integration

**AWS Service Mapping:**
- **Compute:** AWS Lambda (serverless functions), Amazon ECS (containerized services)
- **Storage:** Amazon S3 (documents), Amazon RDS (structured data), Amazon DynamoDB (analytics)
- **AI/ML:** Amazon Bedrock (eligibility reasoning), Amazon Comprehend (entity extraction)
- **Integration:** AWS API Gateway (API management), Amazon SNS (notifications), Amazon SQS (queuing)
- **Security:** Amazon Cognito (authentication), AWS KMS (encryption), AWS WAF (firewall)
- **Monitoring:** Amazon CloudWatch (logs/metrics), AWS X-Ray (tracing)

---

**Document Version:** 1.1  
**Last Updated:** February 11, 2026  
**Status:** AWS Integration Complete - Ready for Review


