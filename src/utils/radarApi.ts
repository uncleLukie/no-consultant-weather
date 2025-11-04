import { RadarImage, RadarRange, RadarMode } from '../types/radar';

// Use environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetches radar image URLs for a given product ID from our proxy API
 *
 * How it works:
 * 1. Calls our backend proxy API endpoint
 * 2. The proxy fetches the BoM HTML page (avoiding CORS issues)
 * 3. The proxy parses the image URLs and returns them as JSON
 * 4. We display the radar images
 */
export async function fetchRadarImages(productId: string): Promise<RadarImage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/radar/${productId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.images || data.images.length === 0) {
      throw new Error('No radar images available');
    }

    return data.images;
  } catch (error) {
    console.error('Error fetching radar images:', error);
    throw error;
  }
}

/**
 * Formats timestamp from YYYYMMDDHHmm to readable format
 * Converts UTC time from BoM to user's local timezone
 */
export function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 12) return timestamp;

  const year = parseInt(timestamp.slice(0, 4));
  const month = parseInt(timestamp.slice(4, 6));
  const day = parseInt(timestamp.slice(6, 8));
  const hour = parseInt(timestamp.slice(8, 10));
  const minute = parseInt(timestamp.slice(10, 12));

  // Parse as UTC timestamp (BoM uses UTC)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Format in user's local timezone
  const localDateStr = utcDate.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const localTimeStr = utcDate.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${localDateStr} ${localTimeStr}`;
}

/**
 * Builds the correct product ID based on radar mode and range
 *
 * Rain mode: IDR{baseId}{rangeSuffix}
 *   - 64km: suffix 4 (e.g., IDR664)
 *   - 128km: suffix 3 (e.g., IDR663)
 *   - 256km: suffix 2 (e.g., IDR662)
 *   - 512km: suffix 1 (e.g., IDR661)
 *
 * Doppler mode: Uses fixed doppler product ID (e.g., IDR66I)
 */
export function buildProductId(
  baseId: string,
  mode: RadarMode,
  range: RadarRange,
  dopplerProductId?: string
): string {
  if (mode === 'doppler') {
    // Doppler wind uses a fixed product ID per radar
    if (!dopplerProductId) {
      console.warn(`Doppler product ID not available for radar ${baseId}, falling back to rain mode`);
      // Fallback to rain mode instead of crashing
      mode = 'rain';
    } else {
      return dopplerProductId;
    }
  }

  // Rain radar: build product ID from base + range suffix
  const rangeSuffix = range === '64' ? '4'
                    : range === '128' ? '3'
                    : range === '256' ? '2'
                    : '1'; // 512km

  return `IDR${baseId}${rangeSuffix}`;
}
