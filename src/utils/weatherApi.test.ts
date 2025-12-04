import { describe, it, expect } from 'vitest';
import {
  formatTemperature,
  formatTime,
  getUVCategoryColor,
  getFireDangerColor,
} from './weatherApi';

describe('weatherApi', () => {
  describe('formatTemperature', () => {
    it('should format positive temperature with degree symbol', () => {
      expect(formatTemperature(25)).toBe('25°');
      expect(formatTemperature(30.5)).toBe('31°');
    });

    it('should format negative temperature', () => {
      expect(formatTemperature(-5)).toBe('-5°');
      expect(formatTemperature(-10.7)).toBe('-11°');
    });

    it('should format zero temperature', () => {
      expect(formatTemperature(0)).toBe('0°');
    });

    it('should round decimal temperatures', () => {
      expect(formatTemperature(25.4)).toBe('25°');
      expect(formatTemperature(25.6)).toBe('26°');
    });

    it('should return -- for undefined temperature', () => {
      expect(formatTemperature(undefined)).toBe('--');
    });

    it('should return -- for null temperature', () => {
      expect(formatTemperature(null as any)).toBe('--');
    });

    it('should handle large numbers', () => {
      expect(formatTemperature(100)).toBe('100°');
      expect(formatTemperature(-50)).toBe('-50°');
    });
  });

  describe('formatTime', () => {
    it('should format valid ISO string to 12-hour time', () => {
      const result = formatTime('2025-12-04T14:30:00Z');
      // Should match HH:MM am/pm format
      expect(result).toMatch(/^\d{1,2}:\d{2}\s(am|pm)$/);
    });

    it('should return -- for undefined', () => {
      expect(formatTime(undefined)).toBe('--');
    });

    it('should return -- for empty string', () => {
      expect(formatTime('')).toBe('--');
    });

    it('should return -- for invalid ISO string', () => {
      expect(formatTime('invalid date')).toBe('--');
      expect(formatTime('not a date')).toBe('--');
    });

    it('should handle midnight', () => {
      const result = formatTime('2025-12-04T00:00:00Z');
      expect(result).toMatch(/^\d{1,2}:\d{2}\s(am|pm)$/);
    });

    it('should handle noon', () => {
      const result = formatTime('2025-12-04T12:00:00Z');
      expect(result).toMatch(/^\d{1,2}:\d{2}\s(am|pm)$/);
    });

    it('should use 12-hour format', () => {
      const afternoon = formatTime('2025-12-04T15:30:00Z');
      expect(afternoon).toMatch(/^\d{1,2}:\d{2}\s(am|pm)$/);
    });

    it('should format with 2-digit minutes', () => {
      const result = formatTime('2025-12-04T14:05:00Z');
      expect(result).toMatch(/:\d{2}\s(am|pm)$/); // Minutes should be 2 digits
    });
  });

  describe('getUVCategoryColor', () => {
    it('should return green for low UV', () => {
      expect(getUVCategoryColor('low')).toBe('text-green-600');
    });

    it('should return yellow for moderate UV', () => {
      expect(getUVCategoryColor('moderate')).toBe('text-yellow-600');
    });

    it('should return orange for high UV', () => {
      expect(getUVCategoryColor('high')).toBe('text-orange-600');
    });

    it('should return red for very high UV', () => {
      expect(getUVCategoryColor('very high')).toBe('text-red-600');
    });

    it('should return purple for extreme UV', () => {
      expect(getUVCategoryColor('extreme')).toBe('text-purple-600');
    });

    it('should return gray for undefined', () => {
      expect(getUVCategoryColor(undefined)).toBe('text-gray-500');
    });

    it('should return gray for unknown category', () => {
      expect(getUVCategoryColor('unknown')).toBe('text-gray-500');
    });

    it('should be case-insensitive', () => {
      expect(getUVCategoryColor('LOW')).toBe('text-green-600');
      expect(getUVCategoryColor('Moderate')).toBe('text-yellow-600');
      expect(getUVCategoryColor('HIGH')).toBe('text-orange-600');
    });
  });

  describe('getFireDangerColor', () => {
    it('should return green for none', () => {
      expect(getFireDangerColor('none')).toBe('text-green-600');
    });

    it('should return green for low-moderate', () => {
      expect(getFireDangerColor('low-moderate')).toBe('text-green-600');
    });

    it('should return orange for high', () => {
      expect(getFireDangerColor('high')).toBe('text-orange-600');
    });

    it('should return red for very high', () => {
      expect(getFireDangerColor('very high')).toBe('text-red-600');
    });

    it('should return purple for severe', () => {
      expect(getFireDangerColor('severe')).toBe('text-purple-600');
    });

    it('should return purple for extreme', () => {
      expect(getFireDangerColor('extreme')).toBe('text-purple-600');
    });

    it('should return purple for catastrophic', () => {
      expect(getFireDangerColor('catastrophic')).toBe('text-purple-600');
    });

    it('should return gray for undefined', () => {
      expect(getFireDangerColor(undefined)).toBe('text-gray-500');
    });

    it('should return gray for unknown danger level', () => {
      expect(getFireDangerColor('unknown')).toBe('text-gray-500');
    });

    it('should be case-insensitive', () => {
      expect(getFireDangerColor('SEVERE')).toBe('text-purple-600');
      expect(getFireDangerColor('High')).toBe('text-orange-600');
    });
  });
});
