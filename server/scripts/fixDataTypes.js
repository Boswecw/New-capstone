// server/scripts/fixDataTypes.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const candidates = [
    '../../.env.local',
    '../../.env',
    '../.env',
    '.env',
  ].map(p => path.resolve(__dirname, p));

  let loadedFrom = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      loadedFrom = p;
      break;
    }
  }
  console.log('🌱 Loaded .env from:', loadedFrom || 'none');

  // allow common aliases
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    '';

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Set MONGODB_URI (or MONGO_URI/DATABASE_URL) in .env'
    );
  }

  // normalize into MONGODB_URI for the rest of the script
  process.env.MONGODB_URI = uri;
}

function maskUri(uri = '') {
  if (!uri) return '';
  try {
    const u = new URL(uri);
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '***';
  }
}

async function fixProductDataTypes() {
  try {
    loadEnv();
    console.log('Using MONGODB_URI:', maskUri(process.env.MONGODB_URI));
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const products = db.collection('products');

    console.log('🔧 Fixing product data types...');

    const productsToFix = await products.find({
      $or: [
        { featured: { $type: 'string' } },
        { inStock: { $type: 'string' } },
        { price: { $type: 'string' } },
      ],
    }).toArray();

    console.log(`📊 Found ${productsToFix.length} products to fix`);

    const bulkOps = [];
    for (const product of productsToFix) {
      const updates = {};
      if (typeof product.featured === 'string') {
        updates.featured = product.featured.toLowerCase() === 'true';
      }
      if (typeof product.inStock === 'string') {
        updates.inStock = product.inStock.toLowerCase() === 'true';
      }
      if (typeof product.price === 'string' && !isNaN(product.price)) {
        updates.price = parseFloat(product.price);
      }
      if (Object.keys(updates).length) {
        bulkOps.push({
          updateOne: { filter: { _id: product._id }, update: { $set: updates } },
        });
      }
    }

    if (bulkOps.length) {
      const result = await products.bulkWrite(bulkOps);
      console.log(`✅ Fixed ${result.modifiedCount} products`);
    } else {
      console.log('✅ No products needed fixing');
    }

    const verification = await products.aggregate([
      {
        $group: {
          _id: null,
          featuredStringCount: { $sum: { $cond: [{ $eq: [{ $type: '$featured' }, 'string'] }, 1, 0] } },
          featuredBoolCount:   { $sum: { $cond: [{ $eq: [{ $type: '$featured' }, 'bool'] }, 1, 0] } },
          inStockStringCount:  { $sum: { $cond: [{ $eq: [{ $type: '$inStock' }, 'string'] }, 1, 0] } },
          inStockBoolCount:    { $sum: { $cond: [{ $eq: [{ $type: '$inStock' }, 'bool'] }, 1, 0] } },
          priceStringCount:    { $sum: { $cond: [{ $eq: [{ $type: '$price' }, 'string'] }, 1, 0] } },
          priceNumberCount:    { $sum: { $cond: [{ $eq: [{ $type: '$price' }, 'double'] }, 1, 0] } },
        },
      },
    ]).toArray();

    console.log('📊 Verification Results:', verification[0] || {});
  } catch (err) {
    console.error('❌ Error fixing data types:', err.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixProductDataTypes();
