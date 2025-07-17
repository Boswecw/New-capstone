// server/routes/images.js - Updated with optimization middleware

const express = require('express');
const { Storage } = require('@google-cloud/storage');
const rateLimit = require('express-rate-limit');
const { 
  imageOptimizationMiddleware, 
  presetOptimizationMiddleware, 
  imageOptimizationHealth 
} = require('../middleware/imageOptimization');

const router = express.Router();
const storage = new Storage();
const BUCKET_NAME = 'furbabies-petstore';

// Rate limiting for image requests
const imageRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many image requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all image routes
router.use(imageRateLimit);

// Fallback images for different categories
const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Image Proxy Service',
    timestamp: new Date().toISOString(),
    bucket: BUCKET_NAME,
    optimization: 'Available',
    endpoints: {
      gcs: '/api/images/gcs/{path}',
      optimized: '/api/images/gcs/{path}?w=300&h=250&q=80',
      presets: '/api/images/preset/{preset}/{path}',
      fallback: '/api/images/fallback/{category}',
      health: '/api/images/health'
    }
  });
});

// ===== OPTIMIZATION HEALTH CHECK =====
router.get('/optimization/health', imageOptimizationHealth);

// ===== PRESET ROUTES FOR COMMON SIZES =====
// Thumbnail preset (80x80)
router.get('/preset/thumbnail/gcs/*', presetOptimizationMiddleware('thumbnail'));

// Small preset (150x150)
router.get('/preset/small/gcs/*', presetOptimizationMiddleware('small'));

// Medium preset (300x250)
router.get('/preset/medium/gcs/*', presetOptimizationMiddleware('medium'));

// Large preset (500x400)
router.get('/preset/large/gcs/*', presetOptimizationMiddleware('large'));

// Card preset (400x300)
router.get('/preset/card/gcs/*', presetOptimizationMiddleware('card'));

// Hero preset (1200x500)
router.get('/preset/hero/gcs/*', presetOptimizationMiddleware('hero'));

// ===== FALLBACK IMAGES =====
router.get('/fallback/:category', (req, res) => {
  const category = req.params.category?.toLowerCase() || 'default';
  const fallbackUrl = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
  
  console.log(`🔄 Serving fallback image for category: ${category}`);
  
  res.redirect(302, fallbackUrl);
});

// ===== MAIN GCS IMAGE PROXY WITH OPTIMIZATION =====
router.get('/gcs/*', imageOptimizationMiddleware, async (req, res) => {
  try {
    const imagePath = req.params[0];
    
    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required'
      });
    }

    console.log(`📁 Fetching image from GCS: ${imagePath}`);

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(imagePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`❌ Image not found in GCS: ${imagePath}`);
      
      // Try to determine category from path for better fallback
      const category = imagePath.includes('pets') ? 'pet' : 
                      imagePath.includes('products') ? 'product' : 'default';
      
      return res.redirect(302, `/api/images/fallback/${category}`);
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const fileSize = metadata.size;
    const contentType = metadata.contentType || 'image/jpeg';
    const lastModified = metadata.updated || metadata.timeCreated;

    // Set caching headers
    const cacheMaxAge = 24 * 60 * 60; // 24 hours
    res.set({
      'Content-Type': contentType,
      'Content-Length': fileSize,
      'Cache-Control': `public, max-age=${cacheMaxAge}`,
      'ETag': `"${metadata.etag}"`,
      'Last-Modified': new Date(lastModified).toUTCString(),
      'X-Image-Source': 'Google Cloud Storage',
      'X-Image-Size': fileSize,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, ETag, Last-Modified'
    });

    // Handle conditional requests
    if (req.headers['if-none-match'] === `"${metadata.etag}"`) {
      return res.status(304).end();
    }

    if (req.headers['if-modified-since']) {
      const ifModifiedSince = new Date(req.headers['if-modified-since']);
      const lastModifiedDate = new Date(lastModified);
      
      if (lastModifiedDate <= ifModifiedSince) {
        return res.status(304).end();
      }
    }

    // Stream the file
    const stream = file.createReadStream();
    
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      
      // Try to determine category from path for better fallback
      const category = imagePath.includes('pets') ? 'pet' : 
                      imagePath.includes('products') ? 'product' : 'default';
      
      res.redirect(302, `/api/images/fallback/${category}`);
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Try to determine category from path for better fallback
    const imagePath = req.params[0] || '';
    const category = imagePath.includes('pets') ? 'pet' : 
                    imagePath.includes('products') ? 'product' : 'default';
    
    res.redirect(302, `/api/images/fallback/${category}`);
  }
});

// ===== BATCH OPTIMIZATION ENDPOINT =====
router.post('/optimize-batch', async (req, res) => {
  try {
    const { imagePaths, preset = 'medium' } = req.body;
    
    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({
        success: false,
        message: 'imagePaths array is required'
      });
    }

    console.log(`🔄 Batch optimizing ${imagePaths.length} images with preset: ${preset}`);

    const results = await Promise.allSettled(
      imagePaths.map(async (imagePath) => {
        const optimizedUrl = `/api/images/preset/${preset}/gcs/${imagePath}`;
        return {
          original: imagePath,
          optimized: optimizedUrl,
          preset: preset
        };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

    res.json({
      success: true,
      optimized: successful,
      failed: failed.length,
      total: imagePaths.length,
      preset: preset
    });

  } catch (error) {
    console.error('Batch optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch optimization failed',
      error: error.message
    });
  }
});

// ===== IMAGE METADATA ENDPOINT =====
router.get('/metadata/gcs/*', async (req, res) => {
  try {
    const imagePath = req.params[0];
    
    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required'
      });
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(imagePath);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const [metadata] = await file.getMetadata();

    res.json({
      success: true,
      metadata: {
        name: metadata.name,
        bucket: metadata.bucket,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated,
        etag: metadata.etag,
        urls: {
          original: `/api/images/gcs/${imagePath}`,
          thumbnail: `/api/images/preset/thumbnail/gcs/${imagePath}`,
          small: `/api/images/preset/small/gcs/${imagePath}`,
          medium: `/api/images/preset/medium/gcs/${imagePath}`,
          large: `/api/images/preset/large/gcs/${imagePath}`,
          card: `/api/images/preset/card/gcs/${imagePath}`,
          hero: `/api/images/preset/hero/gcs/${imagePath}`
        }
      }
    });

  } catch (error) {
    console.error('Metadata fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image metadata',
      error: error.message
    });
  }
});

// ===== ERROR HANDLING =====
router.use((error, req, res, next) => {
  console.error('Image router error:', error);
  res.status(500).json({
    success: false,
    message: 'Image service error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;