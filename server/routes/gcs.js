// server/routes/gcs.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();
const path = require('path');

// Load config from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize GCS client
const storage = new Storage({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

// Route: GET /api/gcs/buckets/:bucketName/images
router.get('/buckets/:bucketName/images', async (req, res) => {
  const { bucketName } = req.params;
  const { prefix = '', public: isPublic = false } = req.query;

  try {
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });

    const data = files
      .filter(file => !file.name.endsWith('/')) // ignore "folder" placeholders
      .map(file => isPublic === 'true'
        ? file.name
        : {
            name: file.name,
            url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
          });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('GCS image fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list images from GCS',
      error: error.message
    });
  }
});

module.exports = router;
