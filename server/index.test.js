import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Create a mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import the utility functions we need to test separately
// Since we can't easily import from index.js without starting the server,
// we'll define them here for now, or restructure later
function parseImageNames(html) {
  const imageNames = [];
  const regex = /theImageNames\[\d+\]\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    imageNames.push(match[1]);
  }
  return imageNames;
}

function extractTimestamp(path) {
  const match = path.match(/\.T\.(\d+)\.png/);
  return match ? match[1] : '';
}

// Create test app
const app = express();
app.use(cors());

const weatherCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// Radar endpoint
app.get('/api/radar/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const loopUrl = `https://reg.bom.gov.au/products/${productId}.loop.shtml`;
    const response = await fetch(loopUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch radar data: ${response.statusText}`
      });
    }

    const html = await response.text();
    const imageUrls = parseImageNames(html);

    if (imageUrls.length === 0) {
      return res.status(404).json({
        error: 'No radar images found'
      });
    }

    const images = imageUrls.map((path) => ({
      url: `https://reg.bom.gov.au${path}`,
      timestamp: extractTimestamp(path),
    }));

    res.json({ images });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters: lat and lng'
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      error: 'Invalid coordinates: lat and lng must be numbers'
    });
  }

  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return res.json(cached.data);
  }

  try {
    const locationUrl = `https://api.weather.bom.gov.au/v1/locations?search=${latitude},${longitude}`;
    const locationResponse = await fetch(locationUrl);

    if (!locationResponse.ok) {
      throw new Error(`BoM location API error: ${locationResponse.statusText}`);
    }

    const locationData = await locationResponse.json();

    if (!locationData || !locationData.data || locationData.data.length === 0) {
      return res.status(404).json({
        error: 'Could not find location data for these coordinates'
      });
    }

    const location = locationData.data[0];
    const geohash = location.geohash;

    const [obsResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/observations`),
      fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`)
    ]);

    const observations = obsResponse.ok ? (await obsResponse.json()).data : null;
    const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
    const forecast = forecastData?.data?.length > 0 ? {
      today: forecastData.data[0],
      daily: forecastData.data
    } : null;

    const weatherData = {
      location: {
        name: location.name,
        state: location.state,
        geohash: geohash,
        lat: latitude,
        lng: longitude
      },
      observations: observations || null,
      forecast: forecast || null
    };

    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    res.json(weatherData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'No-Consultant Weather API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'No-Consultant Weather API',
    endpoints: {
      '/api/radar/:productId': 'Get radar images for a product ID (e.g., IDR663)',
      '/api/weather?lat={lat}&lng={lng}': 'Get weather data for coordinates',
      '/health': 'Health check'
    }
  });
});

describe('Backend API Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    weatherCache.clear();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'No-Consultant Weather API is running'
      });
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('/api/radar/:productId');
    });
  });

  describe('GET /api/radar/:productId', () => {
    it('should return radar images for valid product ID', async () => {
      const mockHtml = `
        <script>
          theImageNames[0] = "/radar/IDR663.T.202512040100.png";
          theImageNames[1] = "/radar/IDR663.T.202512040106.png";
          theImageNames[2] = "/radar/IDR663.T.202512040112.png";
        </script>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        status: 200,
        statusText: 'OK'
      });

      const response = await request(app).get('/api/radar/IDR663');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('images');
      expect(response.body.images).toHaveLength(3);
      expect(response.body.images[0]).toEqual({
        url: 'https://reg.bom.gov.au/radar/IDR663.T.202512040100.png',
        timestamp: '202512040100'
      });
    });

    it('should return 404 when no images found', async () => {
      const mockHtml = '<html><body>No radar images</body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
        status: 200,
        statusText: 'OK'
      });

      const response = await request(app).get('/api/radar/INVALID');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No radar images found');
    });

    it('should handle BoM API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const response = await request(app).get('/api/radar/IDR663');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).get('/api/radar/IDR663');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Network error');
    });
  });

  describe('GET /api/weather', () => {
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).get('/api/weather');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameters: lat and lng');
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app).get('/api/weather?lat=invalid&lng=123');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid coordinates: lat and lng must be numbers');
    });

    it('should return weather data for valid coordinates', async () => {
      // Mock location lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{
            geohash: 'r7r7sg',
            name: 'Brisbane',
            state: 'QLD'
          }]
        })
      });

      // Mock observations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            temp: 25,
            temp_feels_like: 27
          }
        })
      });

      // Mock forecast
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { date: '2025-12-04', temp_max: 30, temp_min: 20 }
          ]
        })
      });

      const response = await request(app)
        .get('/api/weather?lat=-27.4698&lng=153.0251');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toEqual({
        name: 'Brisbane',
        state: 'QLD',
        geohash: 'r7r7sg',
        lat: -27.4698,
        lng: 153.0251
      });
      expect(response.body).toHaveProperty('observations');
      expect(response.body).toHaveProperty('forecast');
    });

    it('should return cached data on subsequent requests', async () => {
      // First request - mock API calls
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ geohash: 'r7r7sg', name: 'Brisbane', state: 'QLD' }]
        })
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { temp: 25 } })
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ date: '2025-12-04' }] })
      });

      const response1 = await request(app)
        .get('/api/weather?lat=-27.4698&lng=153.0251');
      expect(response1.status).toBe(200);

      // Second request - should use cache, no new fetch calls
      const response2 = await request(app)
        .get('/api/weather?lat=-27.4698&lng=153.0251');

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
      // Only 3 fetch calls total (from first request)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return 404 when location not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      const response = await request(app)
        .get('/api/weather?lat=0&lng=0');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Could not find location data for these coordinates');
    });

    it('should handle BoM API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable'
      });

      const response = await request(app)
        .get('/api/weather?lat=-27.4698&lng=153.0251');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Utility Functions', () => {
  describe('parseImageNames', () => {
    it('should parse image names from HTML', () => {
      const html = `
        <script>
          theImageNames[0] = "/radar/IDR663.T.202512040100.png";
          theImageNames[1] = "/radar/IDR663.T.202512040106.png";
        </script>
      `;

      const result = parseImageNames(html);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('/radar/IDR663.T.202512040100.png');
      expect(result[1]).toBe('/radar/IDR663.T.202512040106.png');
    });

    it('should handle single quotes', () => {
      const html = "theImageNames[0] = '/radar/IDR663.T.202512040100.png';";
      const result = parseImageNames(html);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('/radar/IDR663.T.202512040100.png');
    });

    it('should return empty array when no matches', () => {
      const html = '<html><body>No image names here</body></html>';
      const result = parseImageNames(html);
      expect(result).toEqual([]);
    });

    it('should handle multiple occurrences', () => {
      const html = `
        theImageNames[0] = "/radar/IDR663.T.202512040100.png";
        theImageNames[1] = "/radar/IDR663.T.202512040106.png";
        theImageNames[2] = "/radar/IDR663.T.202512040112.png";
        theImageNames[3] = "/radar/IDR663.T.202512040118.png";
      `;
      const result = parseImageNames(html);
      expect(result).toHaveLength(4);
    });
  });

  describe('extractTimestamp', () => {
    it('should extract timestamp from valid path', () => {
      const path = '/radar/IDR663.T.202512040100.png';
      const result = extractTimestamp(path);
      expect(result).toBe('202512040100');
    });

    it('should handle different timestamps', () => {
      expect(extractTimestamp('/radar/IDR71.T.202501151234.png')).toBe('202501151234');
      expect(extractTimestamp('/radar/IDR023.T.202512311159.png')).toBe('202512311159');
    });

    it('should return empty string for invalid path', () => {
      expect(extractTimestamp('/radar/invalid.png')).toBe('');
      expect(extractTimestamp('/radar/IDR663.png')).toBe('');
      expect(extractTimestamp('not a path')).toBe('');
    });

    it('should only match .T. pattern', () => {
      expect(extractTimestamp('/radar/IDR663.X.202512040100.png')).toBe('');
      expect(extractTimestamp('/radar/IDR663.202512040100.png')).toBe('');
    });
  });
});
