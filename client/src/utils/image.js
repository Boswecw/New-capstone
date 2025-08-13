
// ===== 1. server/routes/images.js (ONLY THIS BACKEND FILE NEEDS UPDATING) =====
const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'furbabies-petstore';
const bucket = storage.bucket(bucketName);

// ===== SPECIFIC ROUTES FIRST (order matters!) =====
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Image Service',
    bucket: bucketName,
    timestamp: new Date().toISOString()
  });
});

// Your existing GCS proxy route (keep as-is)
router.get('/gcs/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = `${category}/${filename}`;
    
    console.log(`🖼️ Serving image: ${filePath}`);
    
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log(`❌ Image not found: ${filePath}`);
      return res.status(404).json({ 
        error: 'Image not found',
        path: filePath,
        bucket: bucketName
      });
    }
    
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || getContentType(filename);
    
    console.log(`✅ Serving image: ${filePath} (${contentType})`);
    
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    const readStream = file.createReadStream({ validation: false });
    
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

router.get('/fallback/pet', (req, res) => {
  res.redirect('https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop&q=80');
});

router.get('/fallback/product', (req, res) => {
  res.redirect('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&q=80');
});

// ===== NEW: Support your normalizeImageUrl helper =====
// This redirects /api/images/pet/filename.jpg -> /api/images/gcs/pet/filename.jpg
router.get('/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  console.log(`🔄 Image redirect: /${category}/${filename} -> /gcs/${category}/${filename}`);
  return res.redirect(302, `/api/images/gcs/${category}/${filename}`);
});

// Support deeper paths
router.get('/*', (req, res) => {
  const fullPath = req.path.replace('/api/images/', '');
  const pathParts = fullPath.split('/');
  
  if (pathParts.length < 2) {
    return res.status(400).json({ error: 'Invalid image path format' });
  }
  
  const [category, ...filenameParts] = pathParts;
  const filename = filenameParts.join('/');
  
  console.log(`🔄 Deep image redirect: ${fullPath} -> /gcs/${category}/${filename}`);
  return res.redirect(302, `/api/images/gcs/${category}/${filename}`);
});

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

module.exports = router;