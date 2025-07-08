// test-server.js - Multi-port server test script
const axios = require('axios');

async function testPort(port) {
  try {
    console.log(`\n🔍 Testing port ${port}...`);
    
    const response = await axios.get(`http://localhost:${port}/api/health`);
    
    console.log(`✅ Server found on port ${port}!`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test other endpoints
    try {
      const petsResponse = await axios.get(`http://localhost:${port}/api/pets`);
      console.log('✅ Pets endpoint working, found', petsResponse.data.length, 'pets');
    } catch (err) {
      console.log('⚠️ Pets endpoint:', err.response?.status || err.message);
    }
    
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ No server running on port ${port}`);
    } else {
      console.log(`❌ Error on port ${port}:`, error.message);
    }
    return false;
  }
}

async function findServer() {
  console.log('🔍 Searching for your server...');
  
  const ports = [5000, 10000, 3000, 3001, 8000];
  
  for (const port of ports) {
    const found = await testPort(port);
    if (found) {
      console.log(`\n🎯 Server found! Use: curl http://localhost:${port}/api/health`);
      return;
    }
  }
  
  console.log('\n❌ No server found on common ports');
  console.log('💡 Make sure your server is running with: npm start or npm run server');
}

findServer();