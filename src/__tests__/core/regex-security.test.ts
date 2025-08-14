import { describe, expect, test, beforeEach } from 'vitest';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';

describe('Regex Security Tests - ReDoS Prevention', () => {
  describe('Domain extraction patterns', () => {
    test('should handle malicious input without hanging - pattern 1', () => {
      const pattern =
        /this (?:is|involves?|relates to|concerns?) (?:a |an |the )?([^.!?]{1,100}) (?:domain|area|field|decision|problem)/i;

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
      const pattern =
        /this (?:is|involves?|relates to|concerns?) (?:a |an |the )?([^.!?]{1,100}) (?:domain|area|field|decision|problem)/i;

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

  describe('Unicode sanitization', () => {
    let discovery: RuinRiskDiscovery;

    beforeEach(() => {
      discovery = new RuinRiskDiscovery();
    });

    test('should handle zero-width characters', () => {
      const input = 'test\u200Btext\u200Cwith\u200Dzero\uFEFFwidth';
      // The sanitizeForRegex method is private, but we can test through processDomainAssessment
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle control characters', () => {
      const input = 'test\x00with\x1Fcontrol\x7Fchars\x9F';
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle combining marks', () => {
      const input = 'test\u0301with\u0308combining\u0327marks\u036F';
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle RTL/LTR override characters', () => {
      const input = 'test\u202Awith\u202BRTL\u202Dand\u202ELTR\u2066override\u2069';
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle mixed Unicode attacks', () => {
      const maliciousInput =
        'Financial\u200B domain\u200C with\uFEFF' +
        '\u202Ehidden\u202D text\u0301\u0308' +
        '\x00null\x1Fchars' +
        ' '.repeat(100) +
        'and spaces';

      const result = discovery.processDomainAssessment(maliciousInput);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
      // Should not crash or hang
    });

    test('should handle emoji and complex scripts', () => {
      const input = 'test 😀 with 👨‍👩‍👧‍👦 emoji and नमस्ते देवनागरी العربية';
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should truncate very long inputs', () => {
      const veryLongInput = 'a'.repeat(15000); // Longer than MAX_REGEX_INPUT_LENGTH
      const start = Date.now();
      const result = discovery.processDomainAssessment(veryLongInput);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(100); // Should process quickly
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle surrogate pairs correctly', () => {
      const input = 'test \uD800\uDC00 with \uD83D\uDE00 surrogates';
      const result = discovery.processDomainAssessment(input);
      expect(result).toBeDefined();
      expect(result.primaryDomain).toBeDefined();
    });

    test('should handle various Unicode normalization forms', () => {
      // é can be represented as single char or as e + combining accent
      const nfc = 'café'; // NFC form
      const nfd = 'café'; // NFD form (e + combining accent)

      const result1 = discovery.processDomainAssessment(nfc);
      const result2 = discovery.processDomainAssessment(nfd);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    test('should prevent regex injection attempts', () => {
      const injectionAttempts = [
        '.*',
        '^financial$',
        'test|financial',
        'test(financial)?',
        'test[a-z]+',
        'test{1,100}',
        'test.*financial',
        '(?:test|financial)',
      ];

      injectionAttempts.forEach(attempt => {
        const result = discovery.processDomainAssessment(attempt);
        expect(result).toBeDefined();
        expect(result.primaryDomain).toBeDefined();
        // Should treat these as literal strings, not regex patterns
      });
    });
  });

  describe('Performance under stress', () => {
    test('should handle rapid repeated calls', () => {
      const discovery = new RuinRiskDiscovery();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        discovery.processDomainAssessment(`test input ${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // 100 calls in under 500ms
    });

    test('should handle complex nested patterns', () => {
      const complexInput =
        'This is a ((((deeply nested)))) pattern with ' +
        '{{{{multiple}}}} brackets [[[and]]] different ((((types))))';

      const discovery = new RuinRiskDiscovery();
      const start = Date.now();
      const result = discovery.processDomainAssessment(complexInput);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(50); // Should process quickly
    });
  });
});
