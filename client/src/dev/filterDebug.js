// client/src/dev/filterDebug.js - FIXED VERSION
let apiCallCount = 0;
let lastResetTime = Date.now();
const RESET_INTERVAL = 10000; // Reset counter every 10 seconds
let maxCallsPerInterval = 15; // Allow more calls in testing scenarios

export function setupFilterDebug() {
  // ✅ Simple and safe API base URL retrieval
  const getAPIBaseURL = () => {
    // In development, this will be set by api.js
    if (window.__API_BASE_URL__) {
      return window.__API_BASE_URL__;
    }
    
    // Fallback for any environment
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Default development fallback
    return '/api';
  };

  const API = getAPIBaseURL().replace(/\/$/, '');
  
  console.log('🔧 Filter Debug using API:', API);

  // ✅ Enhanced fetch wrapper with smart detection
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    
    // Only track pet-related API calls
    if (typeof url === 'string' && url.includes('/api/pets')) {
      const now = Date.now();
      
      // ✅ Auto-reset counter periodically
      if (now - lastResetTime > RESET_INTERVAL) {
        console.log(`🔄 Resetting API call counter (${apiCallCount} calls in last ${RESET_INTERVAL/1000}s)`);
        apiCallCount = 0;
        lastResetTime = now;
      }
      
      apiCallCount++;
      console.log(`🔥 API Call #${apiCallCount}: ${url}`);
      
      // ✅ Smart threshold - higher limit, but warn about sustained patterns
      if (apiCallCount > maxCallsPerInterval) {
        console.error(`🚨 HIGH API ACTIVITY DETECTED! ${apiCallCount} calls in ${(now - lastResetTime)/1000}s`);
        
        // ✅ Check if it's a real loop vs burst activity
        if (apiCallCount > maxCallsPerInterval + 10) {
          console.error(`🚨 INFINITE LOOP DETECTED! More than ${maxCallsPerInterval + 10} API calls`);
          console.trace('Call stack:');
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };

  // ✅ Manual reset function for after running tests
  window.resetAPICounter = () => {
    const prevCount = apiCallCount;
    apiCallCount = 0;
    lastResetTime = Date.now();
    console.log(`🔄 Manually reset API counter (was ${prevCount})`);
  };

  // ✅ Test functions with enhanced error handling
  async function testFilter(type) {
    const url = `${API}/pets?type=${encodeURIComponent(type)}&status=available`;
    console.log(`\n🧪 Testing filter: ${type}`, url);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType}. Response: ${text.slice(0, 120)}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${type} results:`, {
        success: data.success,
        count: data.data?.length || 0,
        firstPet: data.data?.[0]?.name || 'None',
        query: data.query || 'Not provided',
        filterCounts: data.filterCounts || 'Not provided'
      });
      return data;
    } catch (error) {
      console.error(`❌ ${type} request failed:`, error.message);
      return null;
    }
  }

  async function checkDataStructure() {
    const url = `${API}/pets/debug/sample`;
    try {
      console.log('\n📊 Checking data structure:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType}. Response: ${text.slice(0, 120)}`);
      }
      
      const data = await response.json();
      console.log('✅ Data Structure Check:', {
        success: data.success,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
        count: data.data?.length || 'N/A',
        sample: data.data?.[0] ? Object.keys(data.data[0]) : 'No data',
        query: data.query || 'No query info',
        timestamp: data.timestamp || 'No timestamp'
      });
      return data;
    } catch (error) {
      console.error('❌ Data structure check failed:', error.message);
      return null;
    }
  }

  // ✅ Run tests with proper counter management
  async function runFilterTests() {
    console.log('\n🎯 Starting Filter Debug Tests...');
    
    // Reset counter before tests
    apiCallCount = 0;
    lastResetTime = Date.now();
    
    try {
      await testFilter('dog');
      await testFilter('cat');
      await testFilter('fish');
      await testFilter('all');
      await checkDataStructure();
      
      console.log('\n✅ Filter tests complete');
      
      // ✅ Give a grace period before normal app usage
      setTimeout(() => {
        console.log('🔄 Resetting counter for normal app usage');
        apiCallCount = 0;
        lastResetTime = Date.now();
      }, 2000);
      
    } catch (err) {
      console.error('❌ Filter tests failed:', err);
    }
  }

  // ✅ Expose control functions globally
  window.filterDebug = {
    runTests: runFilterTests,
    testFilter,
    checkDataStructure,
    resetCounter: window.resetAPICounter,
    getCallCount: () => apiCallCount,
    setThreshold: (newThreshold) => {
      maxCallsPerInterval = newThreshold;
      console.log(`🎛️ API call threshold set to ${newThreshold}`);
    }
  };

  // Auto-run tests in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Filter Debug Active - Use window.filterDebug.runTests() to test');
    // Don't auto-run anymore to prevent interference
    // setTimeout(runFilterTests, 1000);
  }
}