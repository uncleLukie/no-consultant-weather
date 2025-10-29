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
      '/health': 'Health check'
    }
  });
});

app.listen(PORT, () => {
  console.log(`No-Consultant Weather API running on port ${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/radar/IDR663`);
});
