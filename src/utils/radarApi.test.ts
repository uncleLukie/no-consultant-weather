import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRadarImages, formatTimestamp, buildProductId } from './radarApi';
import { RadarMode, RadarRange } from '../types/radar';

// Mock fetch
window.fetch = vi.fn();

describe('radarApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchRadarImages', () => {
    it('should fetch and return radar images successfully', async () => {
      const mockResponse = {
        images: [
          {
            url: 'https://reg.bom.gov.au/radar/IDR663.T.202512040100.png',
            timestamp: '202512040100',
          },
          {
            url: 'https://reg.bom.gov.au/radar/IDR663.T.202512040106.png',
            timestamp: '202512040106',
          },
        ],
      };

      (window.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarImages('IDR663');

      expect(result).toEqual(mockResponse.images);
      expect(window.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/radar/IDR663'
      );
    });

    it('should throw error when API returns non-ok status', async () => {
      (window.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Radar not found' }),
      });

      await expect(fetchRadarImages('INVALID')).rejects.toThrow('Radar not found');
    });

    it('should throw error when API returns non-ok status without error message', async () => {
      (window.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(fetchRadarImages('IDR663')).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should throw error when no images are returned', async () => {
      (window.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: [] }),
      });

      await expect(fetchRadarImages('IDR663')).rejects.toThrow('No radar images available');
    });

    it('should throw error when images property is missing', async () => {
      (window.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(fetchRadarImages('IDR663')).rejects.toThrow('No radar images available');
    });

    it('should throw error on network failure', async () => {
      (window.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchRadarImages('IDR663')).rejects.toThrow('Network error');
    });
  });

  describe('formatTimestamp', () => {
    it('should format valid timestamp correctly', () => {
      // Note: This test may be timezone-dependent
      // 202512040100 = 2025-12-04 01:00 UTC
      const result = formatTimestamp('202512040100');

      // Check format: DD/MM/YYYY HH:mm
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it('should handle midnight timestamp', () => {
      const result = formatTimestamp('202512040000');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it('should handle end of day timestamp', () => {
      const result = formatTimestamp('202512042359');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it('should return input unchanged for invalid timestamp length', () => {
      expect(formatTimestamp('123')).toBe('123');
      expect(formatTimestamp('20251204010')).toBe('20251204010');
      expect(formatTimestamp('2025120401001')).toBe('2025120401001');
      expect(formatTimestamp('')).toBe('');
    });

    it('should handle timestamps for different months', () => {
      const january = formatTimestamp('202501150930');
      const december = formatTimestamp('202512311159');

      expect(january).toMatch(/\d{2}\/\d{2}\/2025 \d{2}:\d{2}/);
      expect(december).toMatch(/\d{2}\/\d{2}\/2025 \d{2}:\d{2}/);
    });

    it('should use 24-hour format', () => {
      const result = formatTimestamp('202512041300'); // 1:00 PM UTC
      // Should not contain AM/PM
      expect(result).not.toMatch(/am|pm|AM|PM/i);
    });

    it('should convert UTC to local timezone', () => {
      // Create a known UTC timestamp
      const timestamp = '202512040000'; // Midnight UTC
      const result = formatTimestamp(timestamp);

      // Verify the Date object is created correctly
      const utcDate = new Date(Date.UTC(2025, 11, 4, 0, 0));
      const expectedDate = utcDate.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const expectedTime = utcDate.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      expect(result).toBe(`${expectedDate} ${expectedTime}`);
    });
  });

  describe('buildProductId', () => {
    describe('Rain mode', () => {
      const mode: RadarMode = 'rain';

      it('should build correct product ID for 64km range', () => {
        const range: RadarRange = '64';
        expect(buildProductId('66', mode, range)).toBe('IDR664');
        expect(buildProductId('71', mode, range)).toBe('IDR714');
      });

      it('should build correct product ID for 128km range', () => {
        const range: RadarRange = '128';
        expect(buildProductId('66', mode, range)).toBe('IDR663');
        expect(buildProductId('71', mode, range)).toBe('IDR713');
      });

      it('should build correct product ID for 256km range', () => {
        const range: RadarRange = '256';
        expect(buildProductId('66', mode, range)).toBe('IDR662');
        expect(buildProductId('71', mode, range)).toBe('IDR712');
      });

      it('should build correct product ID for 512km range', () => {
        const range: RadarRange = '512';
        expect(buildProductId('66', mode, range)).toBe('IDR661');
        expect(buildProductId('71', mode, range)).toBe('IDR711');
      });

      it('should handle two-digit radar IDs', () => {
        const range: RadarRange = '128';
        expect(buildProductId('02', mode, range)).toBe('IDR023');
        expect(buildProductId('71', mode, range)).toBe('IDR713');
      });

      it('should work with different base IDs', () => {
        const range: RadarRange = '128';
        expect(buildProductId('02', mode, range)).toBe('IDR023');
        expect(buildProductId('23', mode, range)).toBe('IDR233');
        expect(buildProductId('64', mode, range)).toBe('IDR643');
        expect(buildProductId('96', mode, range)).toBe('IDR963');
      });
    });

    describe('Doppler mode', () => {
      const mode: RadarMode = 'doppler';
      const range: RadarRange = '128'; // Range doesn't matter for doppler

      it('should return doppler product ID when provided', () => {
        expect(buildProductId('66', mode, range, 'IDR66I')).toBe('IDR66I');
        expect(buildProductId('71', mode, range, 'IDR71I')).toBe('IDR71I');
      });

      it('should fallback to rain mode when doppler ID not provided', () => {
        // Should log warning and fallback to rain mode (128km = suffix 3)
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = buildProductId('66', mode, range, undefined);

        expect(result).toBe('IDR663'); // Fallback to rain mode 128km
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Doppler product ID not available')
        );

        consoleSpy.mockRestore();
      });

      it('should fallback to rain mode with correct range', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Test different ranges in fallback
        expect(buildProductId('66', mode, '64', undefined)).toBe('IDR664');
        expect(buildProductId('66', mode, '256', undefined)).toBe('IDR662');
        expect(buildProductId('66', mode, '512', undefined)).toBe('IDR661');

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        consoleSpy.mockRestore();
      });

      it('should handle empty string doppler ID as fallback', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = buildProductId('71', mode, range, '');

        expect(result).toBe('IDR713'); // Empty string triggers fallback
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });

    describe('Edge cases', () => {
      it('should handle single digit base IDs', () => {
        expect(buildProductId('2', 'rain', '128')).toBe('IDR23');
        expect(buildProductId('7', 'rain', '128')).toBe('IDR73');
      });

      it('should preserve base ID format', () => {
        // If base ID has leading zero, it should be preserved
        expect(buildProductId('02', 'rain', '128')).toBe('IDR023');
        expect(buildProductId('03', 'rain', '64')).toBe('IDR034');
      });
    });
  });
});
