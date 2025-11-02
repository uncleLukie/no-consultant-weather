import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (restrict in production if needed)
app.use(cors());

/**
 * API endpoint to fetch radar image URLs for a given product ID
 * Example: GET /api/radar/IDR663
 */
app.get('/api/radar/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const loopUrl = `https://reg.bom.gov.au/products/${productId}.loop.shtml`;

    // Fetch the HTML page
    const response = await fetch(loopUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch radar data: ${response.statusText}`
      });
    }

    const html = await response.text();

    // Parse the theImageNames array from the JavaScript
    const imageUrls = parseImageNames(html);

    if (imageUrls.length === 0) {
      return res.status(404).json({
        error: 'No radar images found'
      });
    }

    // Convert to full URLs with timestamps
    const images = imageUrls.map((path) => ({
      url: `https://reg.bom.gov.au${path}`,
      timestamp: extractTimestamp(path),
    }));

    res.json({ images });

  } catch (error) {
    console.error('Error fetching radar images:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Parses the theImageNames JavaScript array from the HTML
 */
function parseImageNames(html) {
  const imageNames = [];

  // Match patterns like: theImageNames[0] = "/radar/IDR663.T.202510290319.png";
  const regex = /theImageNames\[\d+\]\s*=\s*["']([^"']+)["']/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    imageNames.push(match[1]);
  }

  return imageNames;
}

/**
 * Extracts timestamp from radar image path
 * Example: /radar/IDR663.T.202510290319.png -> 202510290319
 */
function extractTimestamp(path) {
  const match = path.match(/\.T\.(\d+)\.png/);
  return match ? match[1] : '';
}

/**
 * Simple in-memory cache for weather data
 * Key format: "lat,lng" -> { data, timestamp }
 */
const weatherCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * API endpoint to fetch weather data for given coordinates
 * Example: GET /api/weather?lat=-33.8688&lng=151.2093
 */
app.get('/api/weather', async (req, res) => {
  const { lat, lng } = req.query;

  // Validate coordinates
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

  // Check cache
  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return res.json(cached.data);
  }

  try {
    // Step 1: Convert lat/lng to geohash
    const locationData = await fetchLocationGeohash(latitude, longitude);

    if (!locationData || !locationData.geohash) {
      return res.status(404).json({
        error: 'Could not find location data for these coordinates'
      });
    }

    // Step 2: Fetch observations and forecast in parallel
    const [observations, forecast] = await Promise.all([
      fetchObservations(locationData.geohash),
      fetchDailyForecast(locationData.geohash)
    ]);

    const weatherData = {
      location: {
        name: locationData.name,
        state: locationData.state,
        geohash: locationData.geohash,
        lat: latitude,
        lng: longitude
      },
      observations: observations || null,
      forecast: forecast || null
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    res.json(weatherData);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

/**
 * Fetches location geohash from BoM API
 */
async function fetchLocationGeohash(lat, lng) {
  const url = `https://api.weather.bom.gov.au/v1/locations?search=${lat},${lng}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`BoM location API error: ${response.statusText}`);
  }

  const data = await response.json();

  // API returns an array, take the first (closest) result
  if (data && data.data && data.data.length > 0) {
    const location = data.data[0];
    return {
      geohash: location.geohash,
      name: location.name,
      state: location.state
    };
  }

  return null;
}

/**
 * Fetches current observations from BoM API
 */
async function fetchObservations(geohash) {
  const url = `https://api.weather.bom.gov.au/v1/locations/${geohash}/observations`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`BoM observations API error: ${response.statusText}`);
    return null;
  }

  const result = await response.json();
  return result.data || null;
}

/**
 * Fetches daily forecast from BoM API
 */
async function fetchDailyForecast(geohash) {
  const url = `https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`BoM forecast API error: ${response.statusText}`);
    return null;
  }

  const result = await response.json();

  // Return today's forecast (first item) plus the full array
  if (result.data && result.data.length > 0) {
    return {
      today: result.data[0],
      daily: result.data
    };
  }

  return null;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'No-Consultant Weather API is running' });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'No-Consultant Weather API',
    endpoints: {
      '/api/radar/:productId': 'Get radar images for a product ID (e.g., IDR663)',
      '/api/weather?lat={lat}&lng={lng}': 'Get weather data for coordinates (e.g., /api/weather?lat=-33.8688&lng=151.2093)',
      '/health': 'Health check'
    }
  });
});

app.listen(PORT, () => {
  console.log(`No-Consultant Weather API running on port ${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/radar/IDR663`);
});
