import { RadarImage } from '../types/radar';

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
 */
export function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 12) return timestamp;

  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);

  return `${day}/${month}/${year} ${hour}:${minute}`;
}
