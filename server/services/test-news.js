// ==========================================
// test-news.js - News Functionality Test Script
// ==========================================
// Run with: node test-news.js

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/news`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');
const logHeader = (message) => log(`\n🧪 ${message}`, 'cyan');

// Test functions
async function testEndpoint(name, url, expectedFields = []) {
  try {
    logInfo(`Testing: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.success) {
      logSuccess(`${name} - Response OK`);
      
      // Check expected fields
      for (const field of expectedFields) {
        if (response.data[field] !== undefined) {
          logSuccess(`  • ${field}: ${Array.isArray(response.data[field]) ? `${response.data[field].length} items` : 'present'}`);
        } else {
          logWarning(`  • Missing field: ${field}`);
        }
      }
      
      return response.data;
    } else {
      logError(`${name} - Failed: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`${name} - Server not running on ${BASE_URL}`);
    } else if (error.code === 'ENOTFOUND') {
      logError(`${name} - Cannot reach server`);
    } else {
      logError(`${name} - Error: ${error.message}`);
    }
    return null;
  }
}

async function runAllTests() {
  log('\n🚀 Starting News Functionality Tests', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Health Check
  logHeader('Test 1: Health Check');
  const healthResult = await testEndpoint(
    'Health Check',
    `${API_BASE}/health`,
    ['services']
  );
  
  if (healthResult) {
    results.passed++;
    if (healthResult.services?.externalAPI?.status === 'operational') {
      logSuccess('  • NewsAPI.org connection: Working');
    } else {
      logWarning('  • NewsAPI.org connection: Fallback mode');
      results.warnings++;
    }
  } else {
    results.failed++;
  }

  // Test 2: Custom News
  logHeader('Test 2: Custom CMS Articles');
  const customResult = await testEndpoint(
    'Custom News',
    `${API_BASE}/custom?limit=5`,
    ['data', 'count']
  );
  
  if (customResult) {
    results.passed++;
    if (customResult.count > 0) {
      logSuccess(`  • Found ${customResult.count} custom articles`);
    } else {
      logWarning('  • No custom articles found');
      results.warnings++;
    }
  } else {
    results.failed++;
  }

  // Test 3: External News Connection
  logHeader('Test 3: NewsAPI.org Connection');
  const connectionResult = await testEndpoint(
    'NewsAPI Connection',
    `${API_BASE}/test/connection`,
    ['configured']
  );
  
  if (connectionResult) {
    results.passed++;
    if (connectionResult.configured && connectionResult.success) {
      logSuccess('  • NewsAPI.org: Properly configured and working');
    } else if (connectionResult.configured && !connectionResult.success) {
      logWarning('  • NewsAPI.org: Configured but connection failed');
      results.warnings++;
    } else {
      logWarning('  • NewsAPI.org: Not configured (using fallback)');
      results.warnings++;
    }
  } else {
    results.failed++;
  }

  // Test 4: External News Fetch
  logHeader('Test 4: External News Fetching');
  const fetchResult = await testEndpoint(
    'External News Fetch',
    `${API_BASE}/test/fetch?q=pets&limit=3`,
    ['result']
  );
  
  if (fetchResult && fetchResult.result) {
    results.passed++;
    if (fetchResult.result.success) {
      const articleCount = fetchResult.result.articles?.length || 0;
      if (fetchResult.result.isFallback) {
        logWarning(`  • Using fallback data: ${articleCount} articles`);
        results.warnings++;
      } else {
        logSuccess(`  • Live data retrieved: ${articleCount} articles`);
      }
    } else {
      logWarning('  • External fetch failed, but system handled gracefully');
      results.warnings++;
    }
  } else {
    results.failed++;
  }

  // Test 5: Featured News (Mixed Content)
  logHeader('Test 5: Featured News (Mixed Content)');
  const featuredResult = await testEndpoint(
    'Featured News',
    `${API_BASE}/featured?limit=6`,
    ['data', 'count', 'breakdown']
  );
  
  if (featuredResult) {
    results.passed++;
    if (featuredResult.breakdown) {
      logSuccess(`  • Custom articles: ${featuredResult.breakdown.custom || 0}`);
      logSuccess(`  • External articles: ${featuredResult.breakdown.external || 0}`);
      if (featuredResult.breakdown.externalSource === 'fallback') {
        logWarning('  • External source: Using fallback data');
        results.warnings++;
      } else if (featuredResult.breakdown.externalSource === 'live') {
        logSuccess('  • External source: Live NewsAPI.org data');
      }
    }
  } else {
    results.failed++;
  }

  // Test 6: All News with Filtering
  logHeader('Test 6: All News with Filtering');
  const allNewsResult = await testEndpoint(
    'All News',
    `${API_BASE}/?limit=10&source=all`,
    ['data', 'count', 'breakdown']
  );
  
  if (allNewsResult) {
    results.passed++;
    logSuccess(`  • Total articles retrieved: ${allNewsResult.count}`);
  } else {
    results.failed++;
  }

  // Test 7: Categories
  logHeader('Test 7: News Categories');
  const categoriesResult = await testEndpoint(
    'Categories',
    `${API_BASE}/categories`,
    ['data']
  );
  
  if (categoriesResult) {
    results.passed++;
    const categoryCount = categoriesResult.data?.length || 0;
    logSuccess(`  • Available categories: ${categoryCount}`);
  } else {
    results.failed++;
  }

  // Test 8: Individual Article
  logHeader('Test 8: Individual Article Retrieval');
  const articleResult = await testEndpoint(
    'Individual Article',
    `${API_BASE}/custom-1`,
    ['data']
  );
  
  if (articleResult) {
    results.passed++;
    logSuccess(`  • Article title: ${articleResult.data?.title || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Final Results
  log('\n📊 Test Results Summary', 'cyan');
  log('='.repeat(30), 'cyan');
  logSuccess(`Passed: ${results.passed}`);
  if (results.warnings > 0) {
    logWarning(`Warnings: ${results.warnings}`);
  }
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }

  const totalTests = results.passed + results.failed;
  const successRate = ((results.passed / totalTests) * 100).toFixed(1);
  
  if (results.failed === 0) {
    logSuccess(`\n🎉 All tests passed! Success rate: ${successRate}%`);
    if (results.warnings > 0) {
      logWarning('Note: Some warnings indicate fallback modes are active.');
      logInfo('This is normal if NewsAPI.org is not configured or has rate limits.');
    }
  } else {
    logError(`\n❌ ${results.failed} test(s) failed. Success rate: ${successRate}%`);
  }

  // Recommendations
  log('\n💡 Recommendations:', 'blue');
  if (results.warnings > 0) {
    logInfo('• Configure NewsAPI.org API key for live external news');
    logInfo('• Check environment variables are properly set');
  }
  if (results.failed > 0) {
    logInfo('• Ensure server is running on the correct port');
    logInfo('• Check server logs for detailed error messages');
    logInfo('• Verify all required dependencies are installed');
  }
  if (results.passed === totalTests && results.warnings === 0) {
    logInfo('• Your news system is fully operational!');
    logInfo('• Consider implementing caching for production');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
News Functionality Test Script

Usage: node test-news.js [options]

Options:
  --url <url>     Specify server URL (default: http://localhost:5000)
  --help, -h      Show this help message

Examples:
  node test-news.js
  node test-news.js --url http://localhost:3001
  TEST_URL=https://your-app.onrender.com node test-news.js
  `);
  process.exit(0);
}

// Parse URL argument
const urlArg = process.argv.indexOf('--url');
if (urlArg !== -1 && process.argv[urlArg + 1]) {
  process.env.TEST_URL = process.argv[urlArg + 1];
}

// Run tests
runAllTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});