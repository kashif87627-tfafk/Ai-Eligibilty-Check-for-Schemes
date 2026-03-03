# Rule Evaluation Engine

The Rule Evaluation Engine is the core component for evaluating user eligibility against government scheme rules using deterministic logic.

## Overview

The engine evaluates user profiles against eligibility criteria defined in scheme rules, calculating confidence scores and identifying missing information.

## Key Features

- **Deterministic Evaluation**: Uses rule-based logic with multiple operators (eq, lt, gt, in, range, contains)
- **Confidence Scoring**: Calculates weighted confidence scores (0-100%)
- **Status Classification**: Classifies eligibility into 4 bands (strongly_eligible, conditionally_eligible, needs_verification, not_eligible)
- **Missing Criteria Detection**: Identifies missing profile information
- **Document Gap Analysis**: Detects missing required documents
- **Batch Evaluation**: Evaluate multiple schemes at once
- **Nested Field Support**: Handles nested profile fields (e.g., location.state)

## Usage

### Single Scheme Evaluation

```typescript
import { evaluateEligibility } from './rule-evaluation-engine';

const result = evaluateEligibility(
  userId,
  userProfile,
  eligibilityRule,
  userDocuments
);
```

### Batch Evaluation

```typescript
import { batchEvaluateEligibility, sortByConfidence } from './rule-evaluation-engine';

const results = batchEvaluateEligibility(userId, userProfile, rules, userDocuments);
const sorted = sortByConfidence(results);
```

## API Reference

See `rule-evaluation-engine.ts` for detailed function signatures and documentation.

## Testing

Run tests with: `npm test -- rule-evaluation-engine.test.ts`
