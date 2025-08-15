// client/src/utils/performanceMonitor.js
// ============================================
// 5. PERFORMANCE MONITORING
// ============================================

const performanceMonitor = {
    logFilterPerformance: (filterName, startTime) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
  
      console.log(`⚡ ${filterName} completed in ${duration}ms`);
  
      // Log slow queries for optimization
      if (duration > 1000) {
        console.warn(`🐌 Slow filter detected: ${filterName} took ${duration}ms`);
      }
    },
  
    logImageLoadPerformance: (imageSrc, startTime, success) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const status = success ? '✅' : '❌';
  
      console.log(`🖼️ ${status} Image load: ${imageSrc} (${duration}ms)`);
    }
  };
  
  // Optional: expose globally in dev for quick console access
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-undef
    window.performanceMonitor = performanceMonitor;
  }
  
  export default performanceMonitor;
  