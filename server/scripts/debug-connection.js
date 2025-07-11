// debug-connection.js - Save this in your New-capstone root directory
const path = require('path');
const fs = require('fs');

console.log('🔍 DEBUGGING MONGODB CONNECTION');
console.log('=' .repeat(50));

// Check current directory
console.log('📁 Current directory:', __dirname);

// Check if config/db.js exists
const configDbPath = path.join(__dirname, 'config', 'db.js');
console.log('📄 config/db.js exists:', fs.existsSync(configDbPath));

// Check if server/.env exists
const envPath = path.join(__dirname, 'server', '.env');
console.log('📄 server/.env exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('📄 server/.env path:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📋 .env file first 200 characters:');
  console.log('-'.repeat(40));
  console.log(envContent.substring(0, 200) + '...');
  console.log('-'.repeat(40));
}

// Test the path that config/db.js should use
const configToEnvPath = path.resolve(__dirname, 'config', '../server/.env');
console.log('\n🔗 Path config/db.js should use:', configToEnvPath);
console.log('📄 This path exists:', fs.existsSync(configToEnvPath));

// Load environment variables the same way config/db.js does
console.log('\n🔑 Loading environment variables...');
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
}

console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value:', process.env.MONGODB_URI ? `"${process.env.MONGODB_URI}"` : 'undefined');

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('\n🧪 URI Analysis:');
  console.log('Length:', uri.length);
  console.log('First 50 chars:', uri.substring(0, 50) + '...');
  console.log('Starts with mongodb://:', uri.startsWith('mongodb://'));
  console.log('Starts with mongodb+srv://:', uri.startsWith('mongodb+srv://'));
  console.log('Contains spaces:', uri.includes(' '));
  console.log('Contains quotes:', uri.includes('"') || uri.includes("'"));
}

// Test what config/db.js would see
console.log('\n🔍 What config/db.js would see:');
delete require.cache[require.resolve('dotenv')]; // Clear cache
const { config } = require('dotenv');
const result = config({ path: path.resolve(__dirname, 'config', '../server/.env') });
console.log('dotenv result:', result);
console.log('MONGODB_URI after config/db.js path:', process.env.MONGODB_URI || 'undefined');

console.log('\n🔧 EXPECTED PATHS:');
console.log('Your project structure should be:');
console.log('New-capstone/');
console.log('├── config/');
console.log('│   └── db.js');
console.log('├── server/');
console.log('│   └── .env');
console.log('└── debug-connection.js (this file)');