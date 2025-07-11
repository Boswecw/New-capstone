// config/db.js - FIXED FOR RENDER
const path = require('path');
const mongoose = require('mongoose');

// ✅ RENDER FIX: Use consistent environment loading
// This will work both locally and on Render
const loadEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    // On Render, environment variables are already loaded
    console.log('🌐 RENDER: Using environment variables from dashboard');
    return;
  }
  
  // For local development, try multiple paths
  const possibleEnvPaths = [
    path.resolve(__dirname, '../.env'),        // Root directory (preferred)
    path.resolve(__dirname, '../server/.env'), // Server directory (current)
    path.resolve(__dirname, '.env'),           // Config directory
  ];
  
  for (const envPath of possibleEnvPaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(envPath)) {
        console.log(`🔧 Loading .env from: ${envPath}`);
        require('dotenv').config({ path: envPath });
        break;
      }
    } catch (error) {
      console.log(`⚠️  Could not load .env from ${envPath}`);
    }
  }
};

// Load environment variables
loadEnvironment();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    // Enhanced error checking for Render
    if (!uri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('🔍 NODE_ENV:', process.env.NODE_ENV);
      console.error('🔍 Available MongoDB env vars:', 
        Object.keys(process.env).filter(key => key.toLowerCase().includes('mongo')));
      
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 RENDER: Set MONGODB_URI in your service environment variables');
        console.error('   Go to: Dashboard → Your Service → Environment → Add Variable');
      }
      
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Validate connection string format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      console.error('❌ Invalid MongoDB connection string format');
      console.error('💡 Expected format: mongodb://... or mongodb+srv://...');
      console.error('🔍 Current value starts with:', uri.substring(0, 20) + '...');
      throw new Error('Invalid MongoDB connection string format');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
    console.log('🌐 Connection type:', uri.startsWith('mongodb+srv://') ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB');
    
    // Render-optimized connection options
    const conn = await mongoose.connect(uri, {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 5 : 10,
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Additional options for Render
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🗃️  Database: ${conn.connection.db.databaseName}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`🚀 Ready state: ${conn.connection.readyState}`);
    
    // Enhanced connection event handling for Render
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 RENDER: Check your MongoDB Atlas IP whitelist');
        console.error('   Add 0.0.0.0/0 to allow connections from Render');
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      if (process.env.NODE_ENV === 'production') {
        console.warn('🔄 RENDER: Will attempt to reconnect...');
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

    return conn;
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📋 Error:', err.message);
    
    // Render-specific debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('');
      console.error('🚨 RENDER DEBUGGING:');
      console.error('1. Check MONGODB_URI in service environment variables');
      console.error('2. Ensure MongoDB Atlas allows connections from 0.0.0.0/0');
      console.error('3. Verify your database user has readWrite permissions');
      console.error('4. Check Render service logs for more details');
    } else {
      console.error('');
      console.error('🔧 LOCAL DEBUGGING:');
      console.error('1. Ensure .env file contains MONGODB_URI');
      console.error('2. Check connection string format');
      console.error('3. Verify MongoDB Atlas IP whitelist includes your IP');
    }
    
    // Don't exit on Render - let service restart
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};

// Graceful shutdown - important for Render
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during MongoDB shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;