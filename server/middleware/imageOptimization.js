// server/middleware/imageOptimization.js - Image optimization middleware

const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

// Configuration
const BUCKET_NAME = 'furbabies-petstore';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Image optimization parameters
const OPTIMIZATION_PRESETS = {
  thumbnail: { width: 80, height: 80, quality: 80 },
  small: { width: 150, height: 150, quality: 80 },
  medium: { width: 300, height: 250, quality: 80 },
  large: { width: 500, height: 400, quality: 80 },
  card: { width: 400, height: 300, quality: 80 },
  hero: { width: 1200, height: 500, quality: 85 }
};

/**
 * Parse query parameters for image optimization
 */
const parseOptimizationParams = (query) => {
  const params = {
    width: parseInt(query.w) || null,
    height: parseInt(query.h) || null,
    quality: parseInt(query.q) || 80,
    format: query.format || 'webp',
    fit: query.fit || 'cover',
    auto: query.auto || 'format'
  };

  // Validate and constrain parameters
  if (params.width) params.width = Math.min(Math.max(params.width, 50), 2000);
  if (params.height) params.height = Math.min(Math.max(params.height, 50), 2000);
  params.quality = Math.min(Math.max(params.quality, 10), 100);

  return params;
};

/**
 * Generate cache key for optimized image
 */
const generateCacheKey = (imagePath, params) => {
  const { width, height, quality, format, fit } = params;
  return `optimized_${imagePath}_${width}x${height}_q${quality}_${format}_${fit}`.replace(/[^a-zA-Z0-9_-]/g, '_');
};

/**
 * Optimize image using Sharp
 */
const optimizeImage = async (imageBuffer, params) => {
  try {
    let sharp_image = sharp(imageBuffer);

    // Get metadata
    const metadata = await sharp_image.metadata();
    console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    // Apply transformations
    if (params.width || params.height) {
      const resizeOptions = {
        width: params.width,
        height: params.height,
        fit: params.fit === 'contain' ? 'contain' : 'cover',
        withoutEnlargement: true
      };

      if (params.fit === 'cover') {
        resizeOptions.position = 'center';
      }

      sharp_image = sharp_image.resize(resizeOptions);
    }

    // Apply format and quality
    if (params.format === 'webp') {
      sharp_image = sharp_image.webp({ quality: params.quality });
    } else if (params.format === 'jpeg' || params.format === 'jpg') {
      sharp_image = sharp_image.jpeg({ quality: params.quality });
    } else if (params.format === 'png') {
      sharp_image = sharp_image.png({ quality: params.quality });
    }

    // Apply additional optimizations
    sharp_image = sharp_image
      .sharpen()
      .normalize();

    const optimizedBuffer = await sharp_image.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    
    console.log(`Optimized image: ${optimizedMetadata.width}x${optimizedMetadata.height}, format: ${optimizedMetadata.format}`);
    console.log(`Size reduction: ${imageBuffer.length} → ${optimizedBuffer.length} bytes (${((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(1)}% reduction)`);

    return optimizedBuffer;
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw error;
  }
};

/**
 * Main image optimization middleware
 */
const imageOptimizationMiddleware = async (req, res, next) => {
  try {
    const imagePath = req.params[0]; // Captures the wildcard path
    const optimizationParams = parseOptimizationParams(req.query);

    // If no optimization parameters, proceed normally
    if (!optimizationParams.width && !optimizationParams.height && req.query.q === undefined) {
      return next();
    }

    console.log(`🖼️  Optimizing image: ${imagePath}`, optimizationParams);

    // Generate cache key
    const cacheKey = generateCacheKey(imagePath, optimizationParams);

    // Try to get from cache (if you implement caching)
    // For now, we'll optimize on-the-fly

    // Get the original image from Google Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(imagePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`❌ Image not found in GCS: ${imagePath}`);
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Download the file
    const [imageBuffer] = await file.download();

    // Optimize the image
    const optimizedBuffer = await optimizeImage(imageBuffer, optimizationParams);

    // Set appropriate headers
    const contentType = optimizationParams.format === 'webp' ? 'image/webp' : 
                       optimizationParams.format === 'png' ? 'image/png' : 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Length': optimizedBuffer.length,
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
      'ETag': `"${cacheKey}"`,
      'Last-Modified': new Date().toUTCString(),
      'X-Optimized': 'true',
      'X-Original-Size': imageBuffer.length,
      'X-Optimized-Size': optimizedBuffer.length,
      'X-Compression-Ratio': `${((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(1)}%`
    });

    // Check if client has cached version
    if (req.headers['if-none-match'] === `"${cacheKey}"`) {
      return res.status(304).end();
    }

    res.send(optimizedBuffer);

  } catch (error) {
    console.error('Image optimization middleware error:', error);
    next(); // Fall back to original image serving
  }
};

/**
 * Preset optimization middleware for common sizes
 */
const presetOptimizationMiddleware = (preset) => {
  return (req, res, next) => {
    const presetParams = OPTIMIZATION_PRESETS[preset];
    if (presetParams) {
      // Add preset parameters to query
      req.query = {
        ...req.query,
        ...presetParams
      };
    }
    return imageOptimizationMiddleware(req, res, next);
  };
};

/**
 * Health check for image optimization
 */
const imageOptimizationHealth = (req, res) => {
  res.json({
    success: true,
    service: 'Image Optimization',
    sharp: {
      available: true,
      version: require('sharp').version
    },
    presets: Object.keys(OPTIMIZATION_PRESETS),
    parameters: {
      width: 'w - Image width (50-2000px)',
      height: 'h - Image height (50-2000px)',
      quality: 'q - Image quality (10-100)',
      format: 'format - Output format (webp, jpeg, png)',
      fit: 'fit - Resize fit (cover, contain)',
      auto: 'auto - Auto optimization (format)'
    },
    examples: [
      '/api/images/gcs/pets/dog1.jpg?w=300&h=250&q=80&format=webp',
      '/api/images/gcs/products/toy1.jpg?w=400&h=300&fit=contain',
      '/api/images/gcs/pets/cat1.jpg?preset=thumbnail'
    ]
  });
};

module.exports = {
  imageOptimizationMiddleware,
  presetOptimizationMiddleware,
  imageOptimizationHealth,
  OPTIMIZATION_PRESETS
};