/**
 * Unit Tests for Evaluation Cache Service
 */

import { 
  generateCacheKey, 
  hashUserProfile
} from './evaluation-cache';

describe('Evaluation Cache Service', () => {
  describe('hashUserProfile', () => {
    it('should generate consistent hash for same profile', () => {
      const profile = {
        ageRange: '18-25',
        location: { state: 'Maharashtra' },
        education: 'Graduate'
      };
      
      const hash1 = hashUserProfile(profile);
      const hash2 = hashUserProfile(profile);
      
      expect(hash1).toBe(hash2);
    });
    
    it('should generate different hash for different profiles', () => {
      const profile1 = { ageRange: '18-25' };
      const profile2 = { ageRange: '26-35' };
      
      const hash1 = hashUserProfile(profile1);
      const hash2 = hashUserProfile(profile2);
      
      expect(hash1).not.toBe(hash2);
    });
    
    it('should handle property order differences', () => {
      const profile1 = { age: 25, name: 'John' };
      const profile2 = { name: 'John', age: 25 };
      
      const hash1 = hashUserProfile(profile1);
      const hash2 = hashUserProfile(profile2);
      
      // Should be same because we sort keys
      expect(hash1).toBe(hash2);
    });
  });
  
  describe('generateCacheKey', () => {
    it('should generate cache key with correct format', () => {
      const key = generateCacheKey('user123', 'scheme456', 'abc123');
      
      expect(key).toBe('CACHE#user123#scheme456#abc123');
      expect(key).toContain('CACHE#');
    });
    
    it('should generate unique keys for different inputs', () => {
      const key1 = generateCacheKey('user1', 'scheme1', 'hash1');
      const key2 = generateCacheKey('user2', 'scheme1', 'hash1');
      
      expect(key1).not.toBe(key2);
    });
  });
  
  // Note: Integration tests for DynamoDB operations would require mocking
  // or actual DynamoDB connection. These are covered in integration tests.
});
