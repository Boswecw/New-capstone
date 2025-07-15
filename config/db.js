// config/db.js - FIXED VERSION FOR RENDER
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    // Enhanced error checking
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('🔍 NODE_ENV:', process.env.NODE_ENV);
      console.error('🔍 Available env vars:', Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('mongo')));
      
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Validate connection string format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      console.error('❌ Invalid MongoDB connection string format');
      console.error('💡 Expected format: mongodb+srv://user:pass@cluster.net/database');
      throw new Error('Invalid MongoDB connection string format');
    }

    // Extract database name from connection string for logging
    let expectedDatabase = 'test'; // MongoDB default
    try {
      const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
      if (url.pathname && url.pathname !== '/') {
        expectedDatabase = url.pathname.substring(1); // Remove leading slash
      }
    } catch (e) {
      console.warn('⚠️ Could not parse database name from URI');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
    console.log('🌐 Expected Database:', expectedDatabase);
    console.log('🌐 Cluster:', uri.includes('mongodb+srv://') ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB');
    
    // Optimized connection options for Render
    const connectionOptions = {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 5 : 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      // Ensure we use the latest MongoDB driver features
      useNewUrlParser: true,
      useUnifiedTopology: true
    };

    const conn = await mongoose.connect(uri, connectionOptions);

    // Enhanced connection logging
    console.log('✅ MongoDB Connected Successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('🗃️ Connected Database:', conn.connection.db.databaseName);
    console.log('🚀 Ready State:', conn.connection.readyState);
    console.log('🔗 Connection String Database:', expectedDatabase);
    
    // Check if we're connected to the expected database
    if (conn.connection.db.databaseName !== expectedDatabase) {
      console.warn('⚠️ DATABASE MISMATCH:');
      console.warn(`   Expected: ${expectedDatabase}`);
      console.warn(`   Actually connected to: ${conn.connection.db.databaseName}`);
      console.warn('   This might explain why no data is found!');
    }

    // List collections for debugging
    try {
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('📂 Available collections:', collections.map(c => c.name));
      
      // Count documents in collections that might contain our data
      const possibleCollections = ['pets', 'Pet', 'Pets', 'products', 'Product', 'Products'];
      for (const collName of possibleCollections) {
        try {
          const count = await conn.connection.db.collection(collName).countDocuments();
          if (count > 0) {
            console.log(`📊 Collection "${collName}": ${count} documents`);
          }
        } catch (e) {
          // Collection doesn't exist, continue
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not list collections:', error.message);
    }
    
    // Enhanced connection event handling
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

    return conn;
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📋 Error:', err.message);
    
    // Environment-specific debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('');
      console.error('🚨 RENDER DEBUGGING CHECKLIST:');
      console.error('1. ✅ Check MONGODB_URI in Render environment variables');
      console.error('2. ✅ Ensure URI includes database name: ...mongodb.net/database_name');
      console.error('3. ✅ Verify MongoDB Atlas IP whitelist: 0.0.0.0/0');
      console.error('4. ✅ Check database user permissions: readWrite');
      console.error('5. ✅ Verify cluster is running and accessible');
    }
    
    throw err; // Re-throw to let calling code handle it
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
  } catch (err) {
    console.error('❌ Error during MongoDB shutdown:', err);
  } finally {
    process.exit(0);
  }
};

// Process signal handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = connectDB;