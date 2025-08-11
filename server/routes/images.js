// server/routes/images.js - FIXED VERSION
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// Use environment variable for the bucket name so deployments can target
// different buckets without code changes
const bucketName = process.env.GCS_BUCKET;
if (!bucketName) {
  const message = 'GCS_BUCKET environment variable is not set';
  console.warn(message);
  throw new Error(message);
}
const bucket = storage.bucket(bucketName);

// ===== CORS MIDDLEWARE FOR IMAGES =====
router.use((req, res, next) => {
  // Set CORS headers for all image requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'image-proxy',
    bucket: bucketName,
    timestamp: new Date().toISOString()
  });
});

// ===== MAIN IMAGE SERVING ROUTE =====
// This matches your URL pattern: /api/images/gcs/pet/clown-fish.png
router.get('/gcs/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = `${category}/${filename}`;
    
    console.log(`🖼️ Image request: ${filePath}`);
    
    // Get the file from GCS
    const file = bucket.file(filePath);
    
    // Check if file exists first
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`❌ Image not found: ${filePath}`);
      return res.status(404).json({ 
        error: 'Image not found',
        path: filePath,
        bucket: bucketName
      });
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || getContentType(filename);
    
    console.log(`✅ Serving image: ${filePath} (${contentType})`);
    
    // Set response headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    // Create read stream from GCS
    const readStream = file.createReadStream({
      validation: false // Skip validation for faster streaming
    });
    
    // Handle stream errors
    readStream.on('error', (error) => {
      console.error(`❌ Stream error for ${filePath}:`, error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to stream image',
          path: filePath,
          details: error.message
        });
      }
    });
    
    // Handle successful stream end
    readStream.on('end', () => {
      console.log(`✅ Image streamed successfully: ${filePath}`);
    });
    
    // Pipe the stream to the response
    readStream.pipe(res);
    
  } catch (error) {
    console.error(`❌ Error serving image ${req.params.category}/${req.params.filename}:`, error.message);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        path: `${req.params.category}/${req.params.filename}`
      });
    }
  }
});

// ===== FALLBACK IMAGE ROUTES =====
router.get('/fallback/pet', (req, res) => {
  res.redirect('https://via.placeholder.com/300x250/CCCCCC/666666?text=Pet+Image');
});

router.get('/fallback/product', (req, res) => {
  res.redirect('https://via.placeholder.com/300x250/CCCCCC/666666?text=Product+Image');
});

// ===== UTILITY FUNCTION =====
function getContentType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'image/jpeg';
}

// ===== 404 HANDLER FOR IMAGE ROUTES =====
router.use('*', (req, res) => {
  console.log(`❌ Image route not found: ${req.originalUrl}`);
  res.status(404).json({
    error: 'Image route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /api/images/health',
      'GET /api/images/gcs/{category}/{filename}',
      'GET /api/images/fallback/pet',
      'GET /api/images/fallback/product'
    ]
  });
});

module.exports = router;

