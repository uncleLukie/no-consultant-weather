import { WeatherData } from '../types/radar';

// Use environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetches weather data (observations + forecast) for given coordinates
 *
 * How it works:
 * 1. Calls our backend proxy API endpoint with lat/lng
 * 2. The proxy converts coordinates to BoM geohash
 * 3. The proxy fetches observations and forecast from BoM API
 * 4. Returns combined weather data with caching
 */
export async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.location) {
      throw new Error('Invalid weather data: missing location');
    }

    return data as WeatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Formats temperature with degree symbol
 */
export function formatTemperature(temp: number | undefined): string {
  if (temp === undefined || temp === null) return '--';
  return `${Math.round(temp)}°`;
}

/**
 * Formats time from ISO string to local time
 */
export function formatTime(isoString: string | undefined): string {
  if (!isoString) return '--';

  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '--';
  }
}

/**
 * Gets UV category color for display
 */
export function getUVCategoryColor(category: string | undefined): string {
  if (!category) return 'text-gray-500';

  const lowerCategory = category.toLowerCase();

  switch (lowerCategory) {
    case 'low':
      return 'text-green-600';
    case 'moderate':
      return 'text-yellow-600';
    case 'high':
      return 'text-orange-600';
    case 'very high':
      return 'text-red-600';
    case 'extreme':
      return 'text-purple-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Gets fire danger color for display
 */
export function getFireDangerColor(danger: string | undefined): string {
  if (!danger) return 'text-gray-500';

  const lowerDanger = danger.toLowerCase();

  switch (lowerDanger) {
    case 'none':
    case 'low-moderate':
      return 'text-green-600';
    case 'high':
      return 'text-orange-600';
    case 'very high':
      return 'text-red-600';
    case 'severe':
    case 'extreme':
    case 'catastrophic':
      return 'text-purple-600';
    default:
      return 'text-gray-500';
  }
}
