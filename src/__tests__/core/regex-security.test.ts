import { describe, it, expect, test } from 'vitest';

describe('Regex Security Tests - ReDoS Prevention', () => {
  describe('Domain extraction patterns', () => {
    test('should handle malicious input without hanging - pattern 1', () => {
      const pattern = /this (?:is|involves?|relates to|concerns?) (?:a |an |the )?([^.!?]{1,100}) (?:domain|area|field|decision|problem)/i;
      
      // Test with malicious input that would cause ReDoS in vulnerable regex
      const maliciousInput = 'this is ' + 'a'.repeat(1000) + ' domain';
      
      const start = Date.now();
      const result = pattern.test(maliciousInput);
      const duration = Date.now() - start;
      
      // Should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
      // Should not match due to length limit (100 chars max)
      expect(result).toBe(false);
    });

    test('should handle malicious input without hanging - cleanup pattern', () => {
      const pattern = /\s{1,5}(?:domain|area|field|decision|problem)$/i;
      
      // Test with many spaces that would cause ReDoS in vulnerable regex
      const maliciousInput = ' '.repeat(100) + 'domain';
      
      const start = Date.now();
      const result = maliciousInput.replace(pattern, '');
      const duration = Date.now() - start;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      expect(result).not.toContain('domain');
    });

    test('should handle malicious input without hanging - numbered pattern', () => {
      const pattern = /^\d{1,3}\.\s{1,3}([^:\n]{1,200}):\s{1,3}([^\n]{1,500})/gm;
      
      // Test with long input that would cause ReDoS in vulnerable regex
      const maliciousInput = '1. ' + 'a'.repeat(1000) + ': ' + 'b'.repeat(1000);
      
      const start = Date.now();
      const result = maliciousInput.match(pattern);
      const duration = Date.now() - start;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      // Should not match due to length limits
      expect(result).toBeNull();
    });
  });

  describe('Safe regex behavior', () => {
    test('domain pattern should enforce length limits', () => {
      const pattern = /this (?:is|involves?|relates to|concerns?) (?:a |an |the )?([^.!?]{1,100}) (?:domain|area|field|decision|problem)/i;
      
      // Test with content exactly at limit
      const validInput = 'this is ' + 'x'.repeat(100) + ' domain';
      expect(pattern.test(validInput)).toBe(true);
      
      // Test with content over limit
      const invalidInput = 'this is ' + 'x'.repeat(101) + ' domain';
      expect(pattern.test(invalidInput)).toBe(false);
    });

    test('numbered pattern should enforce all limits', () => {
      const pattern = /^\d{1,3}\.\s{1,3}([^:\n]{1,200}):\s{1,3}([^\n]{1,500})/;
      
      // Valid inputs
      expect(pattern.test('1. test: description')).toBe(true);
      expect(pattern.test('999. ' + 'a'.repeat(200) + ': ' + 'b'.repeat(500))).toBe(true);
      
      // Invalid inputs
      expect(pattern.test('1000. test: description')).toBe(false); // Pattern requires 1-3 digits at start
      // Note: 4 spaces work because the 4th space becomes part of the capture group
      expect(pattern.test('1.' + ' '.repeat(4) + 'test: description')).toBe(true);
      expect(pattern.test('1. ' + 'a'.repeat(201) + ': description')).toBe(false); // First capture too long
      // Note: Pattern matches first 500 chars even if there are more
      expect(pattern.test('1. test: ' + 'b'.repeat(501))).toBe(true);
    });
  });
});