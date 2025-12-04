import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWeatherData,
  formatTemperature,
  formatTime,
  getUVCategoryColor,
  getFireDangerColor,
} from './weatherApi';

// Mock fetch
global.fetch = vi.fn();

describe('weatherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchWeatherData', () => {
    it('should fetch and return weather data successfully', async () => {
      const mockData = {
        location: {
          name: 'Brisbane',
          state: 'QLD',
          geohash: 'r7r7sg',
          lat: -27.4698,
          lng: 153.0251,
        },
        observations: {
          temp: 25,
          temp_feels_like: 27,
        },
        forecast: {
          today: {
            date: '2025-12-04',
            temp_max: 30,
            temp_min: 20,
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchWeatherData(-27.4698, 153.0251);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather?lat=-27.4698&lng=153.0251'
      );
    });

    it('should throw error when API returns non-ok status with error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Location not found' }),
      });

      await expect(fetchWeatherData(-27.4698, 153.0251)).rejects.toThrow('Location not found');
    });

    it('should throw error when API returns non-ok status without error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchWeatherData(-27.4698, 153.0251)).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });

    it('should throw error when location data is missing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          observations: {},
          forecast: {},
        }),
      });

      await expect(fetchWeatherData(-27.4698, 153.0251)).rejects.toThrow(
        'Invalid weather data: missing location'
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchWeatherData(-27.4698, 153.0251)).rejects.toThrow('Network error');
    });

    it('should handle coordinates with high precision', async () => {
      const mockData = {
        location: {
          name: 'Test',
          state: 'QLD',
          geohash: 'test',
          lat: -27.46975123,
          lng: 153.02512456,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await fetchWeatherData(-27.46975123, 153.02512456);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=-27.46975123')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lng=153.02512456')
      );
    });
  });

  describe('formatTemperature', () => {
    it('should format positive temperature with degree symbol', () => {
      expect(formatTemperature(25)).toBe('25°');
      expect(formatTemperature(30)).toBe('30°');
    });

    it('should format negative temperature', () => {
      expect(formatTemperature(-5)).toBe('-5°');
      expect(formatTemperature(-10)).toBe('-10°');
    });

    it('should format zero temperature', () => {
      expect(formatTemperature(0)).toBe('0°');
    });

    it('should round decimal temperatures', () => {
      expect(formatTemperature(25.4)).toBe('25°');
      expect(formatTemperature(25.5)).toBe('26°');
      expect(formatTemperature(25.9)).toBe('26°');
    });

    it('should return -- for undefined temperature', () => {
      expect(formatTemperature(undefined)).toBe('--');
    });

    it('should return -- for null temperature', () => {
      expect(formatTemperature(null as any)).toBe('--');
    });

    it('should handle large numbers', () => {
      expect(formatTemperature(45)).toBe('45°');
      expect(formatTemperature(50)).toBe('50°');
    });
  });

  describe('formatTime', () => {
    it('should format valid ISO string to 12-hour time', () => {
      const result = formatTime('2025-12-04T14:30:00Z');
      // Should contain time in format HH:mm AM/PM
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/i);
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
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/i);
    });

    it('should handle noon', () => {
      const result = formatTime('2025-12-04T12:00:00Z');
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/i);
    });

    it('should use 12-hour format', () => {
      const result = formatTime('2025-12-04T14:30:00Z');
      // Should contain AM or PM
      expect(result).toMatch(/AM|PM/i);
    });

    it('should format with 2-digit minutes', () => {
      const result = formatTime('2025-12-04T14:05:00Z');
      expect(result).toMatch(/:\d{2}/);
    });
  });

  describe('getUVCategoryColor', () => {
    it('should return green for low UV', () => {
      expect(getUVCategoryColor('low')).toBe('text-green-600');
      expect(getUVCategoryColor('Low')).toBe('text-green-600');
      expect(getUVCategoryColor('LOW')).toBe('text-green-600');
    });

    it('should return yellow for moderate UV', () => {
      expect(getUVCategoryColor('moderate')).toBe('text-yellow-600');
      expect(getUVCategoryColor('Moderate')).toBe('text-yellow-600');
      expect(getUVCategoryColor('MODERATE')).toBe('text-yellow-600');
    });

    it('should return orange for high UV', () => {
      expect(getUVCategoryColor('high')).toBe('text-orange-600');
      expect(getUVCategoryColor('High')).toBe('text-orange-600');
      expect(getUVCategoryColor('HIGH')).toBe('text-orange-600');
    });

    it('should return red for very high UV', () => {
      expect(getUVCategoryColor('very high')).toBe('text-red-600');
      expect(getUVCategoryColor('Very High')).toBe('text-red-600');
      expect(getUVCategoryColor('VERY HIGH')).toBe('text-red-600');
    });

    it('should return purple for extreme UV', () => {
      expect(getUVCategoryColor('extreme')).toBe('text-purple-600');
      expect(getUVCategoryColor('Extreme')).toBe('text-purple-600');
      expect(getUVCategoryColor('EXTREME')).toBe('text-purple-600');
    });

    it('should return gray for undefined', () => {
      expect(getUVCategoryColor(undefined)).toBe('text-gray-500');
    });

    it('should return gray for unknown category', () => {
      expect(getUVCategoryColor('unknown')).toBe('text-gray-500');
      expect(getUVCategoryColor('invalid')).toBe('text-gray-500');
      expect(getUVCategoryColor('')).toBe('text-gray-500');
    });

    it('should be case-insensitive', () => {
      expect(getUVCategoryColor('LoW')).toBe('text-green-600');
      expect(getUVCategoryColor('MoDeRaTe')).toBe('text-yellow-600');
      expect(getUVCategoryColor('hIgH')).toBe('text-orange-600');
    });
  });

  describe('getFireDangerColor', () => {
    it('should return green for none', () => {
      expect(getFireDangerColor('none')).toBe('text-green-600');
      expect(getFireDangerColor('None')).toBe('text-green-600');
      expect(getFireDangerColor('NONE')).toBe('text-green-600');
    });

    it('should return green for low-moderate', () => {
      expect(getFireDangerColor('low-moderate')).toBe('text-green-600');
      expect(getFireDangerColor('Low-Moderate')).toBe('text-green-600');
      expect(getFireDangerColor('LOW-MODERATE')).toBe('text-green-600');
    });

    it('should return orange for high', () => {
      expect(getFireDangerColor('high')).toBe('text-orange-600');
      expect(getFireDangerColor('High')).toBe('text-orange-600');
      expect(getFireDangerColor('HIGH')).toBe('text-orange-600');
    });

    it('should return red for very high', () => {
      expect(getFireDangerColor('very high')).toBe('text-red-600');
      expect(getFireDangerColor('Very High')).toBe('text-red-600');
      expect(getFireDangerColor('VERY HIGH')).toBe('text-red-600');
    });

    it('should return purple for severe', () => {
      expect(getFireDangerColor('severe')).toBe('text-purple-600');
      expect(getFireDangerColor('Severe')).toBe('text-purple-600');
      expect(getFireDangerColor('SEVERE')).toBe('text-purple-600');
    });

    it('should return purple for extreme', () => {
      expect(getFireDangerColor('extreme')).toBe('text-purple-600');
      expect(getFireDangerColor('Extreme')).toBe('text-purple-600');
      expect(getFireDangerColor('EXTREME')).toBe('text-purple-600');
    });

    it('should return purple for catastrophic', () => {
      expect(getFireDangerColor('catastrophic')).toBe('text-purple-600');
      expect(getFireDangerColor('Catastrophic')).toBe('text-purple-600');
      expect(getFireDangerColor('CATASTROPHIC')).toBe('text-purple-600');
    });

    it('should return gray for undefined', () => {
      expect(getFireDangerColor(undefined)).toBe('text-gray-500');
    });

    it('should return gray for unknown danger level', () => {
      expect(getFireDangerColor('unknown')).toBe('text-gray-500');
      expect(getFireDangerColor('invalid')).toBe('text-gray-500');
      expect(getFireDangerColor('')).toBe('text-gray-500');
    });

    it('should be case-insensitive', () => {
      expect(getFireDangerColor('nOnE')).toBe('text-green-600');
      expect(getFireDangerColor('hIgH')).toBe('text-orange-600');
      expect(getFireDangerColor('SeVeRe')).toBe('text-purple-600');
    });
  });
});
