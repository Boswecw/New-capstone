// debug-env.js - Run this to check your environment variables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });

console.log('🔍 ENVIRONMENT DIAGNOSTICS');
console.log('=' .repeat(50));

// Check if .env file exists
const fs = require('fs');
const envPath = path.resolve(__dirname, 'server/.env');
console.log(`📁 .env file path: ${envPath}`);
console.log(`📄 .env file exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📋 .env file contents:');
  console.log('-'.repeat(30));
  console.log(envContent);
  console.log('-'.repeat(30));
}

console.log('\n🔑 Environment Variables:');
console.log(`MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
console.log(`MONGODB_URI value: "${process.env.MONGODB_URI}"`);
console.log(`MONGODB_URI length: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0}`);

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('\n🧪 Connection String Analysis:');
  console.log(`First 50 characters: "${uri.substring(0, 50)}..."`);
  console.log(`Starts with mongodb://: ${uri.startsWith('mongodb://')}`);
  console.log(`Starts with mongodb+srv://: ${uri.startsWith('mongodb+srv://')}`);
  console.log(`Contains spaces: ${uri.includes(' ')}`);
  console.log(`Contains quotes: ${uri.includes('"') || uri.includes("'")}`);
  console.log(`Contains newlines: ${uri.includes('\n') || uri.includes('\r')}`);
}

// Check for other MONGO-related variables
console.log('\n🔍 Other MONGO variables:');
Object.keys(process.env)
  .filter(key => key.includes('MONGO'))
  .forEach(key => {
    console.log(`${key}: "${process.env[key]}"`);
  });

console.log('\n💡 EXPECTED FORMAT:');
console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
console.log('\n🔧 If using local MongoDB:');
console.log('MONGODB_URI=mongodb://localhost:27017/your-database-name');