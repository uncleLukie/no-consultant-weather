/**
 * No-Consultant Weather - Cloudflare Worker API
 *
 * This Worker proxies requests to the Australian Bureau of Meteorology (BoM)
 * to fetch radar and weather data and return it as JSON with CORS headers.
 */

// Simple in-memory cache for weather data
// In Cloudflare Workers, this will persist for the duration of the worker instance
const weatherCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Route: GET /api/radar/:productId
    const radarMatch = url.pathname.match(/^\/api\/radar\/([^\/]+)$/);
    if (radarMatch && request.method === 'GET') {
      const productId = radarMatch[1];
      return handleRadarRequest(productId, corsHeaders);
    }

    // Route: GET /api/weather?lat={lat}&lng={lng}
    if (url.pathname === '/api/weather' && request.method === 'GET') {
      return handleWeatherRequest(url.searchParams, corsHeaders);
    }

    // Route: GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'No-Consultant Weather API is running'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Route: GET / (root)
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        message: 'No-Consultant Weather API',
        endpoints: {
          '/api/radar/:productId': 'Get radar images for a product ID (e.g., IDR663)',
          '/api/weather?lat={lat}&lng={lng}': 'Get weather data for coordinates',
          '/health': 'Health check'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({
      error: 'Not found'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

/**
 * Handles requests to fetch radar images for a given product ID
 */
async function handleRadarRequest(productId, corsHeaders) {
  try {
    const loopUrl = `https://reg.bom.gov.au/products/${productId}.loop.shtml`;

    // Fetch the HTML page from BoM
    const response = await fetch(loopUrl);

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Failed to fetch radar data: ${response.statusText}`
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const html = await response.text();

    // Parse the theImageNames array from the JavaScript
    const imageUrls = parseImageNames(html);

    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({
        error: 'No radar images found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Convert to full URLs with timestamps
    const images = imageUrls.map((path) => ({
      url: `https://reg.bom.gov.au${path}`,
      timestamp: extractTimestamp(path),
    }));

    return new Response(JSON.stringify({ images }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * Handles requests to fetch weather data for given coordinates
 */
async function handleWeatherRequest(searchParams, corsHeaders) {
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Validate coordinates
  if (!lat || !lng) {
    return new Response(JSON.stringify({
      error: 'Missing required parameters: lat and lng'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return new Response(JSON.stringify({
      error: 'Invalid coordinates: lat and lng must be numbers'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  // Check cache
  const cacheKey = `${latitude},${longitude}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return new Response(JSON.stringify(cached.data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    // Step 1: Convert lat/lng to geohash
    const locationData = await fetchLocationGeohash(latitude, longitude);

    if (!locationData || !locationData.geohash) {
      return new Response(JSON.stringify({
        error: 'Could not find location data for these coordinates'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
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

    return new Response(JSON.stringify(weatherData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch weather data',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

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
 * Parses the theImageNames JavaScript array from the HTML
 * Extracts image paths from patterns like: theImageNames[0] = "/radar/IDR663.T.202510290319.png";
 */
function parseImageNames(html) {
  const imageNames = [];
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