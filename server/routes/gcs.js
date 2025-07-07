// server/routes/gcs.js - Public bucket access only (no authentication required)
const express = require('express');
const router = express.Router();
const https = require('https');

console.log('✅ GCS routes loaded - Public bucket access only');

// Public bucket access function
const fetchPublicBucketFiles = async (bucketName, prefix = '') => {
  return new Promise((resolve, reject) => {
    const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${encodeURIComponent(prefix)}`;
    
    console.log('🌐 Fetching from public bucket:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(response.error.message || 'Failed to fetch from public bucket'));
            return;
          }
          
          const files = response.items || [];
          const fileNames = files
            .filter(file => {
              // Skip folder placeholders
              if (file.name.endsWith('/')) return false;
              
              // Only include image files
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
              return isImage;
            })
            .map(file => file.name);
          
          resolve(fileNames);
        } catch (error) {
          reject(new Error('Failed to parse bucket response'));
        }
      });
      
    }).on('error', (error) => {
      reject(error);
    });
  });
};

// Route: GET /api/gcs/buckets/:bucketName/images
router.get('/buckets/:bucketName/images', async (req, res) => {
  const { bucketName } = req.params;
  const { prefix = '', public: isPublic = false } = req.query;

  console.log(`📂 GCS Request: bucket=${bucketName}, prefix=${prefix}, public=${isPublic}`);

  try {
    console.log('🌐 Using public bucket access');
    
    // Use public bucket access only
    const files = await fetchPublicBucketFiles(bucketName, prefix);
    
    console.log(`✅ Found ${files.length} image files`);

    // Format response based on public flag
    const data = files.map(fileName => {
      if (isPublic === 'true') {
        return fileName; // Just return filename for public bucket
      } else {
        return {
          name: fileName,
          url: `https://storage.googleapis.com/${bucketName}/${fileName}`,
          publicUrl: `https://storage.googleapis.com/${bucketName}/${fileName}`
        };
      }
    });

    res.json({ 
      success: true, 
      count: data.length, 
      data,
      bucket: bucketName,
      prefix: prefix || 'root',
      method: 'public-bucket-access'
    });

  } catch (error) {
    console.error('❌ GCS public bucket fetch error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images from public bucket',
      error: error.message,
      bucket: bucketName,
      prefix: prefix || 'root'
    });
  }
});

// Route: GET /api/gcs/config - Get GCS configuration status
router.get('/config', (req, res) => {
  res.json({
    success: true,
    type: 'public-bucket-access',
    authenticationRequired: false,
    message: 'Using public bucket access - no credentials needed'
  });
});

// Route: GET /api/gcs/health - Health check for GCS routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    type: 'public-bucket-access',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;