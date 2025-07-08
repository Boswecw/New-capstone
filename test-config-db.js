// test-config-db.js - Save in New-capstone root directory
console.log('🧪 Testing config/db.js directly...');

try {
  const connectDB = require('./config/db');
  console.log('✅ config/db.js loaded successfully');
  
  // Test the connection
  connectDB();
} catch (error) {
  console.error('❌ Error loading config/db.js:', error.message);
  console.error('Stack trace:', error.stack);
}