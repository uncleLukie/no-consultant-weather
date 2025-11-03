/**
 * No-Consultant Weather - Cloudflare Worker API
 *
 * This Worker proxies requests to the Australian Bureau of Meteorology (BoM)
 * to fetch radar data and return it as JSON with CORS headers.
 */

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
