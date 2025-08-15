// create-indexes-fixed.js - Enhanced version with better env handling
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try multiple .env file locations
const envPaths = [
  '.env',
  'server/.env', 
  '../.env',
  './.env'
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📄 Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found, trying default dotenv config...');
  require('dotenv').config();
}

async function createIndexes() {
  try {
    // Try multiple possible MongoDB URI variable names
    const possibleUris = [
      process.env.MONGODB_URI,
      process.env.MONGO_URI,
      process.env.DATABASE_URL,
      process.env.DB_URI,
      process.env.MONGODB_URL
    ];

    const uri = possibleUris.find(u => u && u.trim());

    if (!uri) {
      console.error('❌ MongoDB URI not found!');
      console.error('🔍 Checked these environment variables:');
      console.error('   MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
      console.error('   MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
      console.error('   DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
      console.error('');
      console.error('💡 Solutions:');
      console.error('   1. Check your .env file has MONGODB_URI=your_connection_string');
      console.error('   2. Make sure .env is in the correct directory');
      console.error('   3. Or run: MONGODB_URI="your_connection_string" node create-indexes-fixed.js');
      console.error('   4. Or use the manual method below');
      console.error('');
      
      // Show manual connection option
      showManualOption();
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 Using connection string from:', getUriSourceName(uri, possibleUris));
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    console.log(`📊 Working with database: ${dbName}`);

    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Available collections:', collectionNames.join(', '));
    
    if (!collectionNames.includes('pets')) {
      console.log('⚠️ No "pets" collection found - indexes will be created when first document is inserted');
    }
    
    if (!collectionNames.includes('products')) {
      console.log('⚠️ No "products" collection found - indexes will be created when first document is inserted');
    }

    console.log('\n📊 Creating indexes for PETS collection...');
    
    // PETS INDEXES
    try {
      await db.collection('pets').createIndex(
        { "name": "text", "breed": "text", "description": "text", "type": "text" },
        { name: "pets_text_search", background: true }
      );
      console.log('✅ Created pets text search index');
    } catch (error) {
      console.log('⚠️ Pets text search index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "status": 1, "featured": 1 },
        { name: "pets_status_featured", background: true }
      );
      console.log('✅ Created pets status & featured index');
    } catch (error) {
      console.log('⚠️ Pets status & featured index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "category": 1, "type": 1 },
        { name: "pets_category_type", background: true }
      );
      console.log('✅ Created pets category & type index');
    } catch (error) {
      console.log('⚠️ Pets category & type index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "type": 1, "breed": 1 },
        { name: "pets_type_breed", background: true }
      );
      console.log('✅ Created pets type & breed index');
    } catch (error) {
      console.log('⚠️ Pets type & breed index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "size": 1, "gender": 1 },
        { name: "pets_size_gender", background: true }
      );
      console.log('✅ Created pets size & gender index');
    } catch (error) {
      console.log('⚠️ Pets size & gender index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "featured": 1, "status": 1 },
        { name: "pets_featured_status", background: true }
      );
      console.log('✅ Created pets featured & status index');
    } catch (error) {
      console.log('⚠️ Pets featured & status index:', error.message);
    }

    try {
      await db.collection('pets').createIndex(
        { "createdAt": -1 },
        { name: "pets_created_desc", background: true }
      );
      console.log('✅ Created pets created date index');
    } catch (error) {
      console.log('⚠️ Pets created date index:', error.message);
    }

    console.log('\n📦 Creating indexes for PRODUCTS collection...');

    // PRODUCTS INDEXES
    try {
      await db.collection('products').createIndex(
        { "name": "text", "description": "text", "brand": "text", "category": "text" },
        { name: "products_text_search", background: true }
      );
      console.log('✅ Created products text search index');
    } catch (error) {
      console.log('⚠️ Products text search index:', error.message);
    }

    try {
      await db.collection('products').createIndex(
        { "category": 1, "inStock": 1 },
        { name: "products_category_stock", background: true }
      );
      console.log('✅ Created products category & stock index');
    } catch (error) {
      console.log('⚠️ Products category & stock index:', error.message);
    }

    try {
      await db.collection('products').createIndex(
        { "featured": 1, "inStock": 1 },
        { name: "products_featured_stock", background: true }
      );
      console.log('✅ Created products featured & stock index');
    } catch (error) {
      console.log('⚠️ Products featured & stock index:', error.message);
    }

    try {
      await db.collection('products').createIndex(
        { "price": 1 },
        { name: "products_price", background: true }
      );
      console.log('✅ Created products price index');
    } catch (error) {
      console.log('⚠️ Products price index:', error.message);
    }

    try {
      await db.collection('products').createIndex(
        { "createdAt": -1 },
        { name: "products_created_desc", background: true }
      );
      console.log('✅ Created products created date index');
    } catch (error) {
      console.log('⚠️ Products created date index:', error.message);
    }

    // VERIFICATION
    console.log('\n🔍 VERIFICATION:');
    try {
      const petsIndexes = await db.collection('pets').listIndexes().toArray();
      const productsIndexes = await db.collection('products').listIndexes().toArray();
      
      console.log(`📊 Pets collection now has ${petsIndexes.length} indexes:`);
      petsIndexes.forEach(index => console.log(`   - ${index.name}`));
      
      console.log(`📦 Products collection now has ${productsIndexes.length} indexes:`);
      productsIndexes.forEach(index => console.log(`   - ${index.name}`));
    } catch (error) {
      console.log('⚠️ Could not verify indexes:', error.message);
    }

    console.log('\n🎉 INDEX CREATION COMPLETED!');
    console.log('Expected performance improvement:');
    console.log('• Filter queries: 800ms → <300ms');
    console.log('• Search queries: Much faster');
    console.log('• Featured items: Instant loading');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    console.error('');
    console.error('💡 If connection failed, try the manual method below:');
    showManualOption();
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

function getUriSourceName(selectedUri, possibleUris) {
  if (selectedUri === possibleUris[0]) return 'MONGODB_URI';
  if (selectedUri === possibleUris[1]) return 'MONGO_URI';
  if (selectedUri === possibleUris[2]) return 'DATABASE_URL';
  if (selectedUri === possibleUris[3]) return 'DB_URI';
  if (selectedUri === possibleUris[4]) return 'MONGODB_URL';
  return 'unknown';
}

function showManualOption() {
  console.log('🔧 MANUAL METHOD:');
  console.log('1. Get your MongoDB connection string from:');
  console.log('   - MongoDB Atlas → Connect → Connect your application');
  console.log('   - Or check your existing .env file');
  console.log('');
  console.log('2. Run with connection string directly:');
  console.log('   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/dbname" node create-indexes-fixed.js');
  console.log('');
  console.log('3. Or use MongoDB Atlas web interface (easiest):');
  console.log('   - Go to cloud.mongodb.com');
  console.log('   - Browse Collections → your database → pets collection → Indexes tab');
  console.log('   - Click "Create Index" for each index');
}

// Run the script
createIndexes();