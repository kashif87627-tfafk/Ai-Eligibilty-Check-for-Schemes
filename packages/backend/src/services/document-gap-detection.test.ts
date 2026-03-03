/**
 * Unit Tests for Document Gap Detection Service
 * 
 * Tests document gap detection logic including:
 * - Missing document identification
 * - Priority assignment
 * - Alternative document handling
 * - Summary generation
 * 
 * Requirements: FR-7.2, FR-2.4
 */

import {
  detectDocumentGaps,
  generateDocumentGapSummary,
  getDocumentActionSteps,
  MissingDocument,
  DocumentGapResult
} from './document-gap-detection';
import { DocumentRequirement } from '../types/eligibility-rules';

describe('Document Gap Detection Service', () => {
  describe('detectDocumentGaps', () => {
    it('should detect all missing documents when user has none', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Government-issued identity proof'
        },
        {
          type: 'income_certificate',
          name: 'Income Certificate',
          mandatory: true,
          description: 'Certificate showing annual income'
        },
        {
          type: 'education_certificate',
          name: 'Education Certificate',
          mandatory: false,
          description: 'Highest education qualification'
        }
      ];
      
      const userDocuments: string[] = [];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.totalRequired).toBe(3);
      expect(result.documentsProvided).toBe(0);
      expect(result.missingMandatory).toBe(2);
      expect(result.missingOptional).toBe(1);
      expect(result.missingDocuments).toHaveLength(3);
      expect(result.hasAllMandatory).toBe(false);
      expect(result.completionPercentage).toBe(0);
    });
    
    it('should detect no gaps when user has all documents', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Government-issued identity proof'
        },
        {
          type: 'income_certificate',
          name: 'Income Certificate',
          mandatory: true,
          description: 'Certificate showing annual income'
        }
      ];
      
      const userDocuments = ['aadhaar', 'income_certificate'];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.totalRequired).toBe(2);
      expect(result.documentsProvided).toBe(2);
      expect(result.missingMandatory).toBe(0);
      expect(result.missingOptional).toBe(0);
      expect(result.missingDocuments).toHaveLength(0);
      expect(result.hasAllMandatory).toBe(true);
      expect(result.completionPercentage).toBe(100);
    });
    
    it('should handle alternative documents correctly', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'income_certificate',
          name: 'Income Certificate',
          mandatory: true,
          description: 'Certificate showing annual income',
          alternativeDocuments: ['salary_slip', 'bank_statement']
        }
      ];
      
      // User has alternative document
      const userDocuments = ['salary_slip'];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.missingMandatory).toBe(0);
      expect(result.hasAllMandatory).toBe(true);
      expect(result.missingDocuments).toHaveLength(0);
    });
    
    it('should not accept alternative if user has neither required nor alternative', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'income_certificate',
          name: 'Income Certificate',
          mandatory: true,
          description: 'Certificate showing annual income',
          alternativeDocuments: ['salary_slip', 'bank_statement']
        }
      ];
      
      const userDocuments = ['aadhaar'];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.missingMandatory).toBe(1);
      expect(result.hasAllMandatory).toBe(false);
      expect(result.missingDocuments).toHaveLength(1);
      expect(result.missingDocuments[0].alternativeDocuments).toEqual(['salary_slip', 'bank_statement']);
    });
    
    it('should prioritize mandatory documents over optional', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'education_certificate',
          name: 'Education Certificate',
          mandatory: false,
          description: 'Highest education qualification'
        },
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Government-issued identity proof'
        },
        {
          type: 'disability_certificate',
          name: 'Disability Certificate',
          mandatory: false,
          description: 'Certificate for disability status',
          alternativeDocuments: ['medical_certificate']
        }
      ];
      
      const userDocuments: string[] = [];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      // Check that mandatory documents come first
      expect(result.missingDocuments[0].mandatory).toBe(true);
      expect(result.missingDocuments[0].priority).toBe(1);
      
      // Optional without alternatives should have priority 2
      expect(result.missingDocuments[1].priority).toBe(2);
      
      // Optional with alternatives should have priority 3
      expect(result.missingDocuments[2].priority).toBe(3);
    });
    
    it('should handle document type variations (normalization)', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'caste_certificate',
          name: 'Caste Certificate',
          mandatory: true,
          description: 'Certificate showing caste category'
        }
      ];
      
      // User has document with different naming
      const userDocuments = ['caste'];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.missingMandatory).toBe(0);
      expect(result.hasAllMandatory).toBe(true);
    });
    
    it('should calculate completion percentage correctly', () => {
      const requirements: DocumentRequirement[] = [
        { type: 'doc1', name: 'Doc 1', mandatory: true, description: 'Doc 1' },
        { type: 'doc2', name: 'Doc 2', mandatory: true, description: 'Doc 2' },
        { type: 'doc3', name: 'Doc 3', mandatory: false, description: 'Doc 3' },
        { type: 'doc4', name: 'Doc 4', mandatory: false, description: 'Doc 4' }
      ];
      
      const userDocuments = ['doc1', 'doc3'];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.totalRequired).toBe(4);
      expect(result.documentsProvided).toBe(2);
      expect(result.completionPercentage).toBe(50);
    });
    
    it('should include obtainFrom information for known document types', () => {
      const requirements: DocumentRequirement[] = [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'Government-issued identity proof'
        }
      ];
      
      const userDocuments: string[] = [];
      
      const result = detectDocumentGaps(requirements, userDocuments);
      
      expect(result.missingDocuments[0].obtainFrom).toBeDefined();
      expect(result.missingDocuments[0].obtainFrom).toContain('UIDAI');
    });
  });
  
  describe('generateDocumentGapSummary', () => {
    it('should generate summary for no missing documents', () => {
      const gapResult: DocumentGapResult = {
        totalRequired: 3,
        documentsProvided: 3,
        missingMandatory: 0,
        missingOptional: 0,
        missingDocuments: [],
        hasAllMandatory: true,
        completionPercentage: 100
      };
      
      const summary = generateDocumentGapSummary(gapResult);
      
      expect(summary).toContain('all required documents');
    });
    
    it('should generate summary for missing mandatory documents', () => {
      const gapResult: DocumentGapResult = {
        totalRequired: 3,
        documentsProvided: 1,
        missingMandatory: 2,
        missingOptional: 0,
        missingDocuments: [
          {
            type: 'aadhaar',
            name: 'Aadhaar',
            mandatory: true,
            description: 'ID proof',
            priority: 1
          },
          {
            type: 'income',
            name: 'Income Certificate',
            mandatory: true,
            description: 'Income proof',
            priority: 1
          }
        ],
        hasAllMandatory: false,
        completionPercentage: 33
      };
      
      const summary = generateDocumentGapSummary(gapResult);
      
      expect(summary).toContain('2 mandatory document');
      expect(summary).toContain('33%');
    });
    
    it('should generate summary for missing optional documents', () => {
      const gapResult: DocumentGapResult = {
        totalRequired: 3,
        documentsProvided: 2,
        missingMandatory: 0,
        missingOptional: 1,
        missingDocuments: [
          {
            type: 'education',
            name: 'Education Certificate',
            mandatory: false,
            description: 'Education proof',
            priority: 2
          }
        ],
        hasAllMandatory: true,
        completionPercentage: 67
      };
      
      const summary = generateDocumentGapSummary(gapResult);
      
      expect(summary).toContain('1 optional document');
      expect(summary).toContain('strengthen');
    });
  });
  
  describe('getDocumentActionSteps', () => {
    it('should generate action steps for mandatory documents', () => {
      const missingDocuments: MissingDocument[] = [
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'ID proof',
          priority: 1,
          obtainFrom: 'UIDAI Enrollment Center'
        },
        {
          type: 'income_certificate',
          name: 'Income Certificate',
          mandatory: true,
          description: 'Income proof',
          priority: 1,
          obtainFrom: 'Tehsil Office'
        }
      ];
      
      const steps = getDocumentActionSteps(missingDocuments);
      
      expect(steps).toHaveLength(2);
      expect(steps[0]).toContain('Aadhaar Card');
      expect(steps[0]).toContain('UIDAI Enrollment Center');
      expect(steps[1]).toContain('Income Certificate');
      expect(steps[1]).toContain('Tehsil Office');
    });
    
    it('should prioritize mandatory over optional documents', () => {
      const missingDocuments: MissingDocument[] = [
        {
          type: 'education',
          name: 'Education Certificate',
          mandatory: false,
          description: 'Education proof',
          priority: 2,
          obtainFrom: 'School'
        },
        {
          type: 'aadhaar',
          name: 'Aadhaar Card',
          mandatory: true,
          description: 'ID proof',
          priority: 1,
          obtainFrom: 'UIDAI'
        }
      ];
      
      const steps = getDocumentActionSteps(missingDocuments, 2);
      
      expect(steps[0]).toContain('Aadhaar Card');
      expect(steps[0]).not.toContain('optional');
      expect(steps[1]).toContain('Education Certificate');
      expect(steps[1]).toContain('optional');
    });
    
    it('should respect maxSteps limit', () => {
      const missingDocuments: MissingDocument[] = [
        {
          type: 'doc1',
          name: 'Document 1',
          mandatory: true,
          description: 'Doc 1',
          priority: 1
        },
        {
          type: 'doc2',
          name: 'Document 2',
          mandatory: true,
          description: 'Doc 2',
          priority: 1
        },
        {
          type: 'doc3',
          name: 'Document 3',
          mandatory: true,
          description: 'Doc 3',
          priority: 1
        }
      ];
      
      const steps = getDocumentActionSteps(missingDocuments, 2);
      
      expect(steps).toHaveLength(2);
    });
    
    it('should handle documents without obtainFrom information', () => {
      const missingDocuments: MissingDocument[] = [
        {
          type: 'custom_doc',
          name: 'Custom Document',
          mandatory: true,
          description: 'Custom doc',
          priority: 1
        }
      ];
      
      const steps = getDocumentActionSteps(missingDocuments);
      
      expect(steps).toHaveLength(1);
      expect(steps[0]).toContain('Custom Document');
      expect(steps[0]).not.toContain('from');
    });
  });
});
