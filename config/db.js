const path = require('path');
// ✅ FIXED: Look for .env in server directory (matches server.js configuration)
require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ✅ FIXED: Use MONGODB_URI to match server.js and documentation
    const uri = process.env.MONGODB_URI;
    
    // Enhanced error checking with helpful debug info
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('🔍 Available env vars starting with MONGO:', 
        Object.keys(process.env).filter(key => key.startsWith('MONGO')));
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Validate connection string format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      console.error('❌ Invalid MongoDB connection string format');
      console.error('💡 Expected format: mongodb://... or mongodb+srv://...');
      console.error('🔍 Current value starts with:', uri.substring(0, 20) + '...');
      throw new Error('Invalid MongoDB connection string format. Must start with "mongodb://" or "mongodb+srv://"');
    }

    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('🌐 Connection string format:', uri.startsWith('mongodb+srv://') ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB');
    
    // Connect with improved options (compatible with Mongoose 8.x)
    const conn = await mongoose.connect(uri, {
      // These options help with connection stability
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
      // ✅ REMOVED: bufferCommands and bufferMaxEntries (deprecated in Mongoose 8.x)
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🗃️  Database: ${conn.connection.db.databaseName}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`🚀 Connection ready state: ${conn.connection.readyState}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return conn;
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📋 Error details:', err.message);
    
    // Provide helpful debugging information
    if (err.message.includes('Invalid scheme')) {
      console.error('');
      console.error('🔧 TROUBLESHOOTING TIPS:');
      console.error('1. Check your .env file contains: MONGODB_URI=mongodb+srv://...');
      console.error('2. Ensure the connection string starts with mongodb:// or mongodb+srv://');
      console.error('3. Verify your .env file is in the correct directory');
      console.error('4. Make sure there are no extra spaces or quotes around the URI');
    }
    
    if (err.message.includes('authentication')) {
      console.error('');
      console.error('🔧 AUTHENTICATION ISSUE:');
      console.error('1. Check your MongoDB username and password');
      console.error('2. Ensure your IP address is whitelisted in MongoDB Atlas');
      console.error('3. Verify database user permissions');
    }
    
    console.error('');
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during MongoDB shutdown:', err);
    process.exit(1);
  }
});

module.exports = connectDB;