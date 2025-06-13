import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateDescriptionLines,
  resolvePageSize,
  validatePageSizeConfig,
  type PageSizeConfig,
  type PageSize,
} from '../index.js';
import type { NormalizedChoice } from '../index.js';
import { Separator } from '@inquirer/core';

// Mock process.stdout.rows for testing
const mockStdout = (rows: number | undefined) => {
  Object.defineProperty(process.stdout, 'rows', {
    value: rows,
    configurable: true,
  });
  Object.defineProperty(process.stdout, 'columns', {
    value: 80, // Standard terminal width
    configurable: true,
  });
};

describe('PageSize Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStdout(24); // Default terminal height
  });

  describe('Type validation', () => {
    it('should accept number as PageSize', () => {
      const pageSize: PageSize = 10;
      expect(typeof pageSize).toBe('number');
    });

    it('should accept PageSizeConfig object as PageSize', () => {
      const pageSize: PageSize = {
        base: 10,
        max: 20,
        min: 5,
        autoBufferDescriptions: true,
        buffer: 2,
        minBuffer: 1,
        autoBufferCountsLineWidth: false,
      };
      expect(typeof pageSize).toBe('object');
    });
  });

  describe('validatePageSizeConfig', () => {
    it('should validate min <= max constraint', () => {
      expect(() => validatePageSizeConfig({ min: 10, max: 5 })).toThrow(
        'PageSize min (10) cannot be greater than max (5)',
      );
    });

    it('should validate min >= 1 constraint', () => {
      expect(() => validatePageSizeConfig({ min: 0 })).toThrow(
        'PageSize min cannot be less than 1',
      );
    });

    it('should validate minBuffer >= 0 constraint', () => {
      expect(() => validatePageSizeConfig({ minBuffer: -1 })).toThrow(
        'PageSize minBuffer cannot be negative',
      );
    });

    it('should validate buffer >= 0 constraint', () => {
      expect(() => validatePageSizeConfig({ buffer: -2 })).toThrow(
        'PageSize buffer cannot be negative',
      );
    });

    it('should validate base >= 1 constraint', () => {
      expect(() => validatePageSizeConfig({ base: 0 })).toThrow(
        'PageSize base cannot be less than 1',
      );
    });

    it('should pass validation for valid config', () => {
      expect(() =>
        validatePageSizeConfig({
          base: 10,
          min: 5,
          max: 20,
          buffer: 2,
          minBuffer: 1,
        }),
      ).not.toThrow();
    });

    it('should pass validation for empty config', () => {
      expect(() => validatePageSizeConfig({})).not.toThrow();
    });
  });

  describe('calculateDescriptionLines', () => {
    const createChoice = (description?: string): NormalizedChoice<string> => ({
      value: 'test',
      name: 'Test',
      description,
      short: 'Test',
      disabled: false,
      checked: false,
    });

    it('should return 0 when no items have descriptions', () => {
      const items = [createChoice(), createChoice(), new Separator()];

      expect(calculateDescriptionLines(items, false)).toBe(0);
    });

    it('should return 1 for single-line descriptions', () => {
      const items = [
        createChoice('Short description'),
        createChoice('Another short one'),
      ];

      expect(calculateDescriptionLines(items, false)).toBe(1);
    });

    it('should return max lines from multi-line descriptions', () => {
      const items = [
        createChoice('Single line'),
        createChoice('Line 1\nLine 2\nLine 3'), // 3 lines
        createChoice('Line 1\nLine 2'), // 2 lines
      ];

      expect(calculateDescriptionLines(items, false)).toBe(3);
    });

    it('should handle empty descriptions', () => {
      const items = [
        createChoice(''),
        createChoice('Valid description'),
        createChoice(),
      ];

      expect(calculateDescriptionLines(items, false)).toBe(1);
    });

    it('should ignore separators', () => {
      const items = [
        createChoice('Description'),
        new Separator(),
        createChoice('Line 1\nLine 2'),
      ];

      expect(calculateDescriptionLines(items, false)).toBe(2);
    });

    describe('with line width counting', () => {
      it('should account for terminal width wrapping when autoBufferCountsLineWidth=true', () => {
        const longDescription =
          'This is a very long description that should wrap across multiple lines when considering terminal width of 80 characters total length';
        const items = [createChoice(longDescription)];

        // Should be more than 1 line due to wrapping
        expect(calculateDescriptionLines(items, true)).toBeGreaterThan(1);
      });

      it('should not wrap when autoBufferCountsLineWidth=false', () => {
        const longDescription =
          'This is a very long description that should wrap across multiple lines when considering terminal width';
        const items = [createChoice(longDescription)];

        // Should be exactly 1 line when not counting width
        expect(calculateDescriptionLines(items, false)).toBe(1);
      });

      it('should correctly count multiple empty lines with line-width counting', () => {
        const items = [createChoice('\n\n\n')]; // 4 lines: empty, empty, empty, empty

        // Should count all 4 empty lines even with line-width counting
        expect(calculateDescriptionLines(items, true)).toBe(4);
      });

      it('should handle mixed empty and short lines correctly', () => {
        const items = [createChoice('short\n\nother\n')]; // 4 lines: "short", empty, "other", empty

        // Should count all 4 lines
        expect(calculateDescriptionLines(items, true)).toBe(4);
      });
    });
  });

  describe('resolvePageSize', () => {
    const createChoice = (description?: string): NormalizedChoice<string> => ({
      value: 'test',
      name: 'Test',
      description,
      short: 'Test',
      disabled: false,
      checked: false,
    });

    describe('with number pageSize (backward compatibility)', () => {
      it('should return the number directly', () => {
        const items = [createChoice()];
        expect(resolvePageSize(10, items)).toBe(10);
      });

      it('should work with any number value', () => {
        const items = [createChoice()];
        expect(resolvePageSize(25, items)).toBe(25);
      });
    });

    describe('with PageSizeConfig object', () => {
      it('should use base when provided', () => {
        const config: PageSizeConfig = { base: 15 };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(15);
      });

      it('should auto-calculate base when not provided', () => {
        mockStdout(24); // 24 lines terminal
        const config: PageSizeConfig = {};
        const items = [createChoice()];

        // Should use calculateDynamicPageSize logic (24 - 6 reserved = 18, capped at 50, min 2)
        expect(resolvePageSize(config, items)).toBe(18);
      });

      it('should apply buffer subtraction', () => {
        const config: PageSizeConfig = {
          base: 20,
          buffer: 3,
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(17); // 20 - 3
      });

      it('should apply minBuffer constraint', () => {
        const config: PageSizeConfig = {
          base: 20,
          buffer: 1,
          minBuffer: 5,
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(15); // 20 - max(1, 5) = 20 - 5
      });

      it('should apply autoBufferDescriptions', () => {
        const config: PageSizeConfig = {
          base: 20,
          autoBufferDescriptions: true,
        };
        const items = [
          createChoice('Line 1\nLine 2\nLine 3'), // 3 lines
          createChoice('Single line'), // 1 line
        ];

        expect(resolvePageSize(config, items)).toBe(17); // 20 - 3
      });

      it('should combine autoBuffer + buffer + minBuffer correctly', () => {
        const config: PageSizeConfig = {
          base: 30,
          autoBufferDescriptions: true,
          buffer: 2,
          minBuffer: 8,
        };
        const items = [
          createChoice('Line 1\nLine 2'), // 2 lines
        ];

        // Buffer calculation: autoBuffer(2) + buffer(2) = 4, then max(4, 8) = 8
        expect(resolvePageSize(config, items)).toBe(22); // 30 - 8
      });

      it('should ignore buffer when autoBufferDescriptions is enabled', () => {
        const config: PageSizeConfig = {
          base: 20,
          autoBufferDescriptions: true,
          buffer: 10, // Should be ignored
        };
        const items = [
          createChoice('Single line'), // 1 line
        ];

        expect(resolvePageSize(config, items)).toBe(19); // 20 - 1 (autoBuffer wins)
      });

      it('should apply min constraint', () => {
        const config: PageSizeConfig = {
          base: 10,
          buffer: 8,
          min: 5,
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(5); // max(2, 5) where 2 would be 10-8
      });

      it('should apply max constraint', () => {
        const config: PageSizeConfig = {
          base: 50,
          max: 25,
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(25); // min(50, 25)
      });

      it('should apply both min and max constraints', () => {
        const config: PageSizeConfig = {
          base: 100,
          buffer: 90, // Would result in 10
          min: 15, // Should bump up to 15
          max: 20, // Should stay at 15 (within max)
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(15); // max(min(100-90, 20), 15) = max(min(10, 20), 15) = max(10, 15) = 15
      });

      it('should ensure minimum pageSize of 1', () => {
        const config: PageSizeConfig = {
          base: 5,
          buffer: 10, // Would result in negative
        };
        const items = [createChoice()];

        expect(resolvePageSize(config, items)).toBe(1); // Should never go below 1
      });
    });

    describe('edge cases', () => {
      it('should handle empty items array', () => {
        const config: PageSizeConfig = {
          base: 10,
          autoBufferDescriptions: true,
        };

        expect(resolvePageSize(config, [])).toBe(10); // No descriptions to buffer
      });

      it('should handle items with no descriptions when autoBuffering', () => {
        const config: PageSizeConfig = {
          base: 10,
          autoBufferDescriptions: true,
        };
        const items = [
          createChoice(), // No description
          createChoice(), // No description
        ];

        expect(resolvePageSize(config, items)).toBe(10); // No descriptions to buffer
      });

      it('should handle terminal height changes gracefully', () => {
        mockStdout(undefined); // No terminal height available
        const config: PageSizeConfig = {}; // No base, should fallback
        const items = [createChoice()];

        // Should fallback to default (7 in calculateDynamicPageSize)
        expect(resolvePageSize(config, items)).toBe(7);
      });
    });
  });
});
