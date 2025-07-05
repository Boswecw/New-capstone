// server/routes/gcs.js - Updated with public bucket fallback
const express = require('express');
const router = express.Router();
const path = require('path');
const https = require('https');

// Load config from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Check if GCS is configured
const isGCSConfigured = () => {
  return !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE);
};

// Initialize GCS client only if configured
let storage = null;
if (isGCSConfigured()) {
  try {
    const { Storage } = require('@google-cloud/storage');
    storage = new Storage({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    console.log('✅ GCS client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize GCS client:', error.message);
    storage = null;
  }
} else {
  console.warn('⚠️  GCS not configured. Using public bucket fallback.');
}

// Fallback function for public bucket access
const fetchPublicBucketFiles = async (bucketName, prefix = '') => {
  return new Promise((resolve, reject) => {
    // For public buckets, we can use the XML API
    const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${encodeURIComponent(prefix)}`;
    
    console.log('🌐 Fetching from public bucket URL:', url);
    
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
    let files = [];
    
    // Try GCS SDK first if available
    if (storage) {
      console.log('🔑 Using GCS SDK with credentials');
      
      const bucket = storage.bucket(bucketName);
      const [bucketFiles] = await bucket.getFiles({ 
        prefix: prefix || undefined,
        maxResults: 1000
      });
      
      files = bucketFiles
        .filter(file => {
          if (file.name.endsWith('/')) return false;
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
          return isImage;
        })
        .map(file => file.name);
        
    } else {
      console.log('🌐 Using public bucket fallback');
      
      // Fallback to public bucket access
      files = await fetchPublicBucketFiles(bucketName, prefix);
    }

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
      method: storage ? 'gcs-sdk' : 'public-fallback'
    });

  } catch (error) {
    console.error('❌ GCS image fetch error:', error);
    
    // Detailed error handling
    let errorMessage = 'Failed to list images from GCS';
    let statusCode = 500;
    
    if (error.code === 403) {
      errorMessage = 'Access denied to bucket. Check service account permissions.';
      statusCode = 403;
    } else if (error.code === 404) {
      errorMessage = `Bucket '${bucketName}' not found`;
      statusCode = 404;
    } else if (error.code === 401) {
      errorMessage = 'Authentication failed. Check service account credentials.';
      statusCode = 401;
    } else if (error.code === 'ENOENT') {
      errorMessage = 'GCS credentials file not found. Using public bucket fallback.';
      
      // Try public fallback as last resort
      try {
        console.log('🔄 Attempting public bucket fallback...');
        const files = await fetchPublicBucketFiles(bucketName, prefix);
        
        const data = files.map(fileName => {
          return isPublic === 'true' ? fileName : {
            name: fileName,
            url: `https://storage.googleapis.com/${bucketName}/${fileName}`
          };
        });
        
        return res.json({
          success: true,
          count: data.length,
          data,
          bucket: bucketName,
          prefix: prefix || 'root',
          method: 'public-fallback-rescue',
          warning: 'Using public bucket fallback due to missing credentials'
        });
      } catch (fallbackError) {
        console.error('❌ Public bucket fallback also failed:', fallbackError);
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code,
      suggestion: error.code === 'ENOENT' ? 
        'Create the credentials directory and place your GCS key file there, or check your GOOGLE_CLOUD_KEY_FILE path in .env' : 
        undefined
    });
  }
});

// Route: GET /api/gcs/config - Get GCS configuration status
router.get('/config', (req, res) => {
  res.json({
    success: true,
    configured: isGCSConfigured(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || null,
    keyFileConfigured: !!process.env.GOOGLE_CLOUD_KEY_FILE,
    keyFileExists: process.env.GOOGLE_CLOUD_KEY_FILE ? 
      require('fs').existsSync(process.env.GOOGLE_CLOUD_KEY_FILE) : false,
    storageInitialized: !!storage,
    expectedKeyPath: process.env.GOOGLE_CLOUD_KEY_FILE
  });
});

module.exports = router;