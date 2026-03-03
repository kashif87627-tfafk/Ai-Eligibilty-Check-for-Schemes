/**
 * Unit Tests for CloudWatch Metrics Service
 */

import { createTimer, MetricData } from './metrics';

describe('CloudWatch Metrics Service', () => {
  describe('createTimer', () => {
    it('should measure elapsed time', async () => {
      const timer = createTimer();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const elapsed = timer.stop();
      
      expect(elapsed).toBeGreaterThanOrEqual(10);
      expect(elapsed).toBeLessThan(100); // Should be quick
    });
    
    it('should return increasing values on multiple stops', () => {
      const timer = createTimer();
      
      const time1 = timer.stop();
      const time2 = timer.stop();
      
      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });
  
  describe('MetricData interface', () => {
    it('should have correct structure', () => {
      const metric: MetricData = {
        metricName: 'APILatency',
        value: 150,
        unit: 'Milliseconds',
        dimensions: {
          Endpoint: '/api/v1/eligibility/evaluate'
        }
      };
      
      expect(metric.metricName).toBe('APILatency');
      expect(metric.value).toBe(150);
      expect(metric.unit).toBe('Milliseconds');
      expect(metric.dimensions).toBeDefined();
    });
  });
  
  // Note: Actual CloudWatch publishing tests require AWS SDK mocking
  // These are covered in integration tests
});
