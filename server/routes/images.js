// server/routes/images.js - Image Proxy Route to solve CORS issues
const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

// Configuration
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;
const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

// Fallback images for different categories
const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
};

// Helper function to determine image category from path
const getImageCategory = (imagePath) => {
  if (!imagePath) return 'default';
  const lowerPath = imagePath.toLowerCase();
  if (lowerPath.includes('pet') || lowerPath.includes('dog') || lowerPath.includes('cat')) {
    return 'pet';
  }
  if (lowerPath.includes('product') || lowerPath.includes('food') || lowerPath.includes('toy')) {
    return 'product';
  }
  return 'default';
};

// Helper function to make HTTP/HTTPS requests
const makeRequest = (url) => {
  const protocol = url.startsWith('https:') ? https : http;
  return new Promise((resolve, reject) => {
    const request = protocol.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'FurBabies-ImageProxy/1.0'
      }
    }, (response) => {
      resolve(response);
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Route: GET /api/images/gcs/:imagePath(*) - Proxy GCS images with CORS headers
router.get('/gcs/:imagePath(*)', async (req, res) => {
  const imagePath = req.params.imagePath;
  
  if (!imagePath) {
    return res.status(400).json({ error: 'Image path is required' });
  }

  // Clean the image path
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  const gcsUrl = `${BUCKET_BASE_URL}/${cleanPath}`;
  
  console.log(`🖼️ Image proxy request: ${cleanPath}`);
  console.log(`🔗 GCS URL: ${gcsUrl}`);

  try {
    // Set CORS headers for all responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cache-Control', `public, max-age=${CACHE_DURATION}`);
    res.header('X-Image-Proxy', 'furbabies-server');

    // Make request to GCS
    const gcsResponse = await makeRequest(gcsUrl);

    if (gcsResponse.statusCode === 200) {
      // Forward the content type
      if (gcsResponse.headers['content-type']) {
        res.setHeader('Content-Type', gcsResponse.headers['content-type']);
      }
      
      // Forward the content length if available
      if (gcsResponse.headers['content-length']) {
        res.setHeader('Content-Length', gcsResponse.headers['content-length']);
      }

      console.log(`✅ Successfully proxied image: ${cleanPath}`);
      
      // Pipe the image data to the response
      gcsResponse.pipe(res);
    } else {
      console.log(`⚠️ GCS returned ${gcsResponse.statusCode} for: ${cleanPath}`);
      // Redirect to fallback image instead of returning error
      const category = getImageCategory(cleanPath);
      const fallbackUrl = FALLBACK_IMAGES[category];
      
      res.redirect(302, fallbackUrl);
    }
  } catch (error) {
    console.error(`❌ Error proxying image ${cleanPath}:`, error.message);
    
    // Redirect to fallback image on any error
    const category = getImageCategory(cleanPath);
    const fallbackUrl = FALLBACK_IMAGES[category];
    
    res.redirect(302, fallbackUrl);
  }
});

// Route: GET /api/images/fallback/:category - Get fallback images
router.get('/fallback/:category?', (req, res) => {
  const category = req.params.category || 'default';
  const fallbackUrl = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
  
  console.log(`🔄 Fallback image requested for category: ${category}`);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', `public, max-age=${CACHE_DURATION}`);
  
  // Redirect to the fallback image
  res.redirect(302, fallbackUrl);
});

// Route: GET /api/images/health - Health check for image proxy
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'image-proxy',
    bucket: BUCKET_NAME,
    fallbacks: Object.keys(FALLBACK_IMAGES),
    timestamp: new Date().toISOString()
  });
});

// Route: OPTIONS for CORS preflight
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = router;