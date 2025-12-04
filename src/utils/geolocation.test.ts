import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCurrentPosition,
  calculateDistance,
  findNearestRadars,
  getCoordinatesFromPostcode,
  isValidAustralianPostcode,
  saveLocationPreference,
  loadLocationPreference,
  clearLocationPreference,
  UserLocation,
} from './geolocation';
import { RadarLocation } from '../types/radar';

describe('geolocation utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getCurrentPosition', () => {
    it('should return user position on success', async () => {
      const mockPosition = {
        coords: {
          latitude: -27.4698,
          longitude: 153.0251,
        },
      };

      (navigator.geolocation.getCurrentPosition as any) = vi.fn(
        (success: PositionCallback) => {
          success(mockPosition as GeolocationPosition);
        }
      );

      const result = await getCurrentPosition();

      expect(result).toEqual({
        lat: -27.4698,
        lng: 153.0251,
      });
    });

    it('should reject when geolocation is not supported', async () => {
      // Temporarily remove geolocation
      const originalGeolocation = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(getCurrentPosition()).rejects.toThrow(
        'Geolocation is not supported by your browser'
      );

      // Restore geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
        configurable: true,
      });
    });

    it('should handle PERMISSION_DENIED error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'User denied geolocation',
      };

      (navigator.geolocation.getCurrentPosition as any) = vi.fn(
        (success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError as GeolocationPositionError);
        }
      );

      await expect(getCurrentPosition()).rejects.toThrow(/Location access denied/);
    });

    it('should handle POSITION_UNAVAILABLE error', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'Position unavailable',
      };

      (navigator.geolocation.getCurrentPosition as any) = vi.fn(
        (success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError as GeolocationPositionError);
        }
      );

      await expect(getCurrentPosition()).rejects.toThrow(/Location information unavailable/);
    });

    it('should handle TIMEOUT error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'Timeout',
      };

      (navigator.geolocation.getCurrentPosition as any) = vi.fn(
        (success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError as GeolocationPositionError);
        }
      );

      await expect(getCurrentPosition()).rejects.toThrow(/Location request timed out/);
    });

    it('should handle unknown error', async () => {
      const mockError = {
        code: 999, // Unknown
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'Unknown error',
      };

      (navigator.geolocation.getCurrentPosition as any) = vi.fn(
        (success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError as GeolocationPositionError);
        }
      );

      await expect(getCurrentPosition()).rejects.toThrow(/Geolocation error: Unknown error/);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Brisbane and Sydney', () => {
      // Brisbane: -27.4698, 153.0251
      // Sydney: -33.8688, 151.2093
      // Actual distance: ~733 km
      const distance = calculateDistance(-27.4698, 153.0251, -33.8688, 151.2093);
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(800);
    });

    it('should calculate distance between Melbourne and Adelaide', () => {
      // Melbourne: -37.8136, 144.9631
      // Adelaide: -34.9285, 138.6007
      // Actual distance: ~654 km
      const distance = calculateDistance(-37.8136, 144.9631, -34.9285, 138.6007);
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(700);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(-27.4698, 153.0251, -27.4698, 153.0251);
      expect(distance).toBe(0);
    });

    it('should return rounded kilometers', () => {
      const distance = calculateDistance(-27.4698, 153.0251, -27.4700, 153.0250);
      expect(Number.isInteger(distance)).toBe(true);
    });

    it('should handle negative and positive coordinates', () => {
      // Darwin (positive) to Hobart (negative latitude)
      const distance = calculateDistance(-12.4634, 130.8456, -42.8821, 147.3272);
      expect(distance).toBeGreaterThan(3000);
    });

    it('should calculate small distances correctly', () => {
      // Very close points (should be < 1km but rounded to 0 or 1)
      const distance = calculateDistance(-27.4698, 153.0251, -27.4699, 153.0252);
      expect(distance).toBeLessThan(1);
    });
  });

  describe('findNearestRadars', () => {
    const mockRadars: RadarLocation[] = [
      {
        id: '66',
        name: 'Brisbane',
        location: 'Marburg',
        state: 'QLD',
        productId: 'IDR663',
        lat: -27.6081,
        lng: 152.5400,
      },
      {
        id: '71',
        name: 'Sydney',
        location: 'Terrey Hills',
        state: 'NSW',
        productId: 'IDR713',
        lat: -33.7008,
        lng: 151.2100,
      },
      {
        id: '50',
        name: 'Melbourne',
        location: 'Laverton',
        state: 'VIC',
        productId: 'IDR503',
        lat: -37.8569,
        lng: 144.7553,
      },
    ];

    it('should return radars sorted by distance', () => {
      // User in Brisbane
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Brisbane');
      expect(result[1].name).toBe('Sydney');
      expect(result[2].name).toBe('Melbourne');
    });

    it('should include distance in each radar', () => {
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars);

      result.forEach((radar) => {
        expect(radar).toHaveProperty('distance');
        expect(typeof radar.distance).toBe('number');
        expect(radar.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should limit results when limit is specified', () => {
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars, 2);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Brisbane');
      expect(result[1].name).toBe('Sydney');
    });

    it('should handle limit greater than array length', () => {
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars, 10);

      expect(result).toHaveLength(3);
    });

    it('should return all radars when limit is not specified', () => {
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars);

      expect(result).toHaveLength(mockRadars.length);
    });

    it('should handle empty radar array', () => {
      const result = findNearestRadars(-27.4698, 153.0251, []);

      expect(result).toEqual([]);
    });

    it('should preserve all radar properties', () => {
      const result = findNearestRadars(-27.4698, 153.0251, mockRadars, 1);

      expect(result[0]).toMatchObject({
        id: '66',
        name: 'Brisbane',
        location: 'Marburg',
        state: 'QLD',
        productId: 'IDR663',
        lat: -27.6081,
        lng: 152.5400,
      });
    });
  });

  describe('getCoordinatesFromPostcode', () => {
    it('should return coordinates for exact postcode match', () => {
      const result = getCoordinatesFromPostcode('4000');
      expect(result).toEqual({ lat: -27.4698, lng: 153.0251 }); // Brisbane CBD
    });

    it('should return coordinates for Sydney CBD', () => {
      const result = getCoordinatesFromPostcode('2000');
      expect(result).toEqual({ lat: -33.8688, lng: 151.2093 });
    });

    it('should return coordinates for Melbourne CBD', () => {
      const result = getCoordinatesFromPostcode('3000');
      expect(result).toEqual({ lat: -37.8136, lng: 144.9631 });
    });

    it('should handle whitespace in postcode', () => {
      const result = getCoordinatesFromPostcode('  4000  ');
      expect(result).toEqual({ lat: -27.4698, lng: 153.0251 });
    });

    it('should return approximate match for unlisted postcode', () => {
      // 4001 should match 4000 (same prefix)
      const result = getCoordinatesFromPostcode('4001');
      expect(result).toEqual({ lat: -27.4698, lng: 153.0251 });
    });

    it('should return approximate match using prefix', () => {
      // 2999 should match something starting with 29 (e.g., 2000)
      const result = getCoordinatesFromPostcode('2999');
      expect(result).toBeTruthy();
      expect(result?.lat).toBeDefined();
      expect(result?.lng).toBeDefined();
    });

    it('should return null for unknown postcode', () => {
      const result = getCoordinatesFromPostcode('9999');
      expect(result).toBeNull();
    });

    it('should return null for invalid postcode format', () => {
      const result = getCoordinatesFromPostcode('invalid');
      expect(result).toBeNull();
    });

    it('should handle postcodes from different states', () => {
      expect(getCoordinatesFromPostcode('5000')).toBeTruthy(); // SA
      expect(getCoordinatesFromPostcode('6000')).toBeTruthy(); // WA
      expect(getCoordinatesFromPostcode('7000')).toBeTruthy(); // TAS
      expect(getCoordinatesFromPostcode('0800')).toBeTruthy(); // NT
    });
  });

  describe('isValidAustralianPostcode', () => {
    it('should validate correct postcodes', () => {
      expect(isValidAustralianPostcode('2000')).toBe(true);
      expect(isValidAustralianPostcode('4000')).toBe(true);
      expect(isValidAustralianPostcode('3000')).toBe(true);
      expect(isValidAustralianPostcode('0800')).toBe(true);
    });

    it('should reject postcodes with wrong length', () => {
      expect(isValidAustralianPostcode('200')).toBe(false);
      expect(isValidAustralianPostcode('20000')).toBe(false);
      expect(isValidAustralianPostcode('20')).toBe(false);
    });

    it('should reject non-numeric postcodes', () => {
      expect(isValidAustralianPostcode('abcd')).toBe(false);
      expect(isValidAustralianPostcode('20a0')).toBe(false);
      expect(isValidAustralianPostcode('test')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidAustralianPostcode('')).toBe(false);
      expect(isValidAustralianPostcode('   ')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(isValidAustralianPostcode('  2000  ')).toBe(true);
      expect(isValidAustralianPostcode(' 4000 ')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(isValidAustralianPostcode('20-00')).toBe(false);
      expect(isValidAustralianPostcode('2000!')).toBe(false);
    });
  });

  describe('saveLocationPreference', () => {
    it('should save location to localStorage', () => {
      const location: UserLocation = { lat: -27.4698, lng: 153.0251 };
      saveLocationPreference(location);

      const stored = localStorage.getItem('userLocation');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(location);
    });

    it('should overwrite existing location', () => {
      const location1: UserLocation = { lat: -27.4698, lng: 153.0251 };
      const location2: UserLocation = { lat: -33.8688, lng: 151.2093 };

      saveLocationPreference(location1);
      saveLocationPreference(location2);

      const stored = localStorage.getItem('userLocation');
      expect(JSON.parse(stored!)).toEqual(location2);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        saveLocationPreference({ lat: -27.4698, lng: 153.0251 });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save location preference:',
        expect.any(Error)
      );

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('loadLocationPreference', () => {
    it('should load location from localStorage', () => {
      const location: UserLocation = { lat: -27.4698, lng: 153.0251 };
      localStorage.setItem('userLocation', JSON.stringify(location));

      const result = loadLocationPreference();
      expect(result).toEqual(location);
    });

    it('should return null when no location is saved', () => {
      const result = loadLocationPreference();
      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('userLocation', 'invalid json');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = loadLocationPreference();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = loadLocationPreference();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load location preference:',
        expect.any(Error)
      );

      localStorage.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('clearLocationPreference', () => {
    it('should remove location from localStorage', () => {
      const location: UserLocation = { lat: -27.4698, lng: 153.0251 };
      localStorage.setItem('userLocation', JSON.stringify(location));

      clearLocationPreference();

      expect(localStorage.getItem('userLocation')).toBeNull();
    });

    it('should not throw error when nothing to clear', () => {
      expect(() => clearLocationPreference()).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => clearLocationPreference()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear location preference:',
        expect.any(Error)
      );

      localStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });
});
