import { RadarLocation } from '../types/radar';

/**
 * Geolocation utilities for finding nearest radar locations
 */

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface RadarWithDistance extends RadarLocation {
  distance: number; // Distance in kilometers
}

/**
 * Get user's current position using browser geolocation API
 */
export async function getCurrentPosition(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
      }
    );
  });
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance); // Return rounded kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest radars to a given location
 * Returns radars sorted by distance with distance information
 */
export function findNearestRadars(
  userLat: number,
  userLng: number,
  radars: RadarLocation[],
  limit?: number
): RadarWithDistance[] {
  const radarsWithDistance: RadarWithDistance[] = radars.map((radar) => ({
    ...radar,
    distance: calculateDistance(userLat, userLng, radar.lat, radar.lng),
  }));

  // Sort by distance (closest first)
  radarsWithDistance.sort((a, b) => a.distance - b.distance);

  // Return limited results if specified
  return limit ? radarsWithDistance.slice(0, limit) : radarsWithDistance;
}

/**
 * Basic Australian postcode to approximate coordinates mapping
 * This is a simplified lookup for common postcodes
 * For production, consider using a proper geocoding API
 */
const POSTCODE_MAP: Record<string, UserLocation> = {
  // NSW
  '2000': { lat: -33.8688, lng: 151.2093 }, // Sydney CBD
  '2010': { lat: -33.8812, lng: 151.2020 }, // Surry Hills
  '2060': { lat: -33.8200, lng: 151.1800 }, // North Sydney
  '2100': { lat: -33.7500, lng: 151.2500 }, // Northern Beaches
  '2150': { lat: -33.8000, lng: 151.0000 }, // Parramatta
  '2300': { lat: -32.9267, lng: 151.7789 }, // Newcastle
  '2500': { lat: -34.4278, lng: 150.8931 }, // Wollongong
  '2600': { lat: -35.2809, lng: 149.1300 }, // Canberra

  // VIC
  '3000': { lat: -37.8136, lng: 144.9631 }, // Melbourne CBD
  '3004': { lat: -37.8300, lng: 144.9800 }, // Melbourne inner
  '3121': { lat: -37.8200, lng: 145.0000 }, // Richmond
  '3150': { lat: -37.9000, lng: 145.1300 }, // Glen Waverley
  '3175': { lat: -38.0000, lng: 145.1800 }, // Dandenong
  '3550': { lat: -36.7667, lng: 144.2833 }, // Bendigo
  '3850': { lat: -37.2833, lng: 146.4167 }, // Sale

  // QLD
  '4000': { lat: -27.4698, lng: 153.0251 }, // Brisbane CBD
  '4101': { lat: -27.4833, lng: 153.0167 }, // South Brisbane
  '4217': { lat: -28.0167, lng: 153.4000 }, // Gold Coast
  '4350': { lat: -27.5598, lng: 151.9507 }, // Toowoomba
  '4810': { lat: -19.2590, lng: 146.8169 }, // Townsville
  '4870': { lat: -16.9186, lng: 145.7781 }, // Cairns

  // SA
  '5000': { lat: -34.9285, lng: 138.6007 }, // Adelaide CBD
  '5062': { lat: -34.9667, lng: 138.6333 }, // Adelaide inner
  '5095': { lat: -34.8333, lng: 138.6667 }, // Mawson Lakes
  '5290': { lat: -37.8278, lng: 140.7825 }, // Mount Gambier

  // WA
  '6000': { lat: -31.9505, lng: 115.8605 }, // Perth CBD
  '6008': { lat: -31.9167, lng: 115.8000 }, // Subiaco
  '6160': { lat: -32.0333, lng: 115.8333 }, // Fremantle
  '6430': { lat: -30.7497, lng: 121.4655 }, // Kalgoorlie
  '6725': { lat: -17.9614, lng: 122.2359 }, // Broome

  // TAS
  '7000': { lat: -42.8821, lng: 147.3272 }, // Hobart
  '7250': { lat: -41.4332, lng: 147.1441 }, // Launceston

  // NT
  '0800': { lat: -12.4634, lng: 130.8456 }, // Darwin
  '0870': { lat: -23.6980, lng: 133.8807 }, // Alice Springs
};

/**
 * Get coordinates for an Australian postcode
 * Returns null if postcode not found
 */
export function getCoordinatesFromPostcode(postcode: string): UserLocation | null {
  const cleaned = postcode.trim();

  // Direct lookup
  if (POSTCODE_MAP[cleaned]) {
    return POSTCODE_MAP[cleaned];
  }

  // Try to find approximate match (e.g., 2001 -> use 2000)
  const prefix = cleaned.substring(0, 3);
  for (const key in POSTCODE_MAP) {
    if (key.startsWith(prefix)) {
      return POSTCODE_MAP[key];
    }
  }

  return null;
}

/**
 * Validate Australian postcode format (4 digits)
 */
export function isValidAustralianPostcode(postcode: string): boolean {
  return /^\d{4}$/.test(postcode.trim());
}

/**
 * Save user location preference to localStorage
 */
export function saveLocationPreference(location: UserLocation): void {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.error('Failed to save location preference:', error);
  }
}

/**
 * Load user location preference from localStorage
 */
export function loadLocationPreference(): UserLocation | null {
  try {
    const stored = localStorage.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load location preference:', error);
    return null;
  }
}

/**
 * Clear saved location preference
 */
export function clearLocationPreference(): void {
  try {
    localStorage.removeItem('userLocation');
  } catch (error) {
    console.error('Failed to clear location preference:', error);
  }
}
