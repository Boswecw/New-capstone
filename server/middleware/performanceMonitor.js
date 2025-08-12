// ===== PERFORMANCE MONITORING MIDDLEWARE =====
// File: server/middleware/performanceMonitor.js (CREATE NEW FILE)

const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      imageLoads: [],
      dbQueries: []
    };
    this.metricsDir = path.join(__dirname, '../logs');
    this.ensureLogsDir();
  }

  async ensureLogsDir() {
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating logs directory:', error);
    }
  }

  // Middleware to track API performance
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(...args) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log performance data
        const metric = {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        };
        
        // Track slow requests (>1000ms)
        if (duration > 1000) {
          console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
        
        // Track errors
        if (res.statusCode >= 400) {
          console.error(`❌ Error request: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
        }
        
        // Store metric
        performanceMonitor.recordRequest(metric);
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  recordRequest(metric) {
    this.metrics.requests.push(metric);
    
    // Keep only last 1000 requests
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests = this.metrics.requests.slice(-1000);
    }
  }

  recordError(error, context) {
    const errorMetric = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context: context
    };
    
    this.metrics.errors.push(errorMetric);
    
    // Keep only last 500 errors
    if (this.metrics.errors.length > 500) {
      this.metrics.errors = this.metrics.errors.slice(-500);
    }
  }

  recordImageLoad(success, url, loadTime) {
    const imageMetric = {
      timestamp: new Date().toISOString(),
      success: success,
      url: url,
      loadTime: loadTime
    };
    
    this.metrics.imageLoads.push(imageMetric);
    
    // Keep only last 1000 image loads
    if (this.metrics.imageLoads.length > 1000) {
      this.metrics.imageLoads = this.metrics.imageLoads.slice(-1000);
    }
  }

  recordDbQuery(query, duration, collection) {
    const dbMetric = {
      timestamp: new Date().toISOString(),
      query: query,
      duration: duration,
      collection: collection
    };
    
    this.metrics.dbQueries.push(dbMetric);
    
    // Keep only last 1000 DB queries
    if (this.metrics.dbQueries.length > 1000) {
      this.metrics.dbQueries = this.metrics.dbQueries.slice(-1000);
    }
  }

  getAnalytics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Filter recent data
    const recentRequests = this.metrics.requests.filter(
      r => new Date(r.timestamp).getTime() > oneHourAgo
    );
    
    const recentErrors = this.metrics.errors.filter(
      e => new Date(e.timestamp).getTime() > oneHourAgo
    );
    
    const recentImages = this.metrics.imageLoads.filter(
      img => new Date(img.timestamp).getTime() > oneHourAgo
    );
    
    const recentQueries = this.metrics.dbQueries.filter(
      q => new Date(q.timestamp).getTime() > oneHourAgo
    );
    
    // Calculate metrics
    const avgResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;
    
    const errorRate = recentRequests.length > 0
      ? (recentErrors.length / recentRequests.length) * 100
      : 0;
    
    const imageSuccessRate = recentImages.length > 0
      ? (recentImages.filter(img => img.success).length / recentImages.length) * 100
      : 0;
    
    const avgDbQueryTime = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
      : 0;
    
    const slowRequests = recentRequests.filter(r => r.duration > 1000);
    const slowQueries = recentQueries.filter(q => q.duration > 500);
    
    return {
      period: 'Last Hour',
      requests: {
        total: recentRequests.length,
        avgResponseTime: Math.round(avgResponseTime),
        slowRequests: slowRequests.length,
        errorRate: Math.round(errorRate * 100) / 100
      },
      database: {
        totalQueries: recentQueries.length,
        avgQueryTime: Math.round(avgDbQueryTime),
        slowQueries: slowQueries.length
      },
      images: {
        totalLoads: recentImages.length,
        successRate: Math.round(imageSuccessRate * 100) / 100,
        failedLoads: recentImages.filter(img => !img.success).length
      },
      topErrors: this.getTopErrors(recentErrors),
      slowestEndpoints: this.getSlowestEndpoints(recentRequests),
      timestamp: new Date().toISOString()
    };
  }

  getTopErrors(errors) {
    const errorCounts = {};
    errors.forEach(error => {
      const key = error.error.substring(0, 100);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  getSlowestEndpoints(requests) {
    const endpointTimes = {};
    requests.forEach(req => {
      const key = `${req.method} ${req.url.split('?')[0]}`;
      if (!endpointTimes[key]) {
        endpointTimes[key] = { times: [], total: 0 };
      }
      endpointTimes[key].times.push(req.duration);
      endpointTimes[key].total++;
    });
    
    return Object.entries(endpointTimes)
      .map(([endpoint, data]) => ({
        endpoint,
        avgTime: Math.round(data.times.reduce((sum, t) => sum + t, 0) / data.times.length),
        requests: data.total
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
  }

  // Save metrics to file daily
  async saveMetrics() {
    try {
      const filename = `metrics_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.metricsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify({
        date: new Date().toISOString(),
        analytics: this.getAnalytics(),
        rawMetrics: this.metrics
      }, null, 2));
      
      console.log(`📊 Metrics saved to ${filename}`);
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }
}

// Global instance
const performanceMonitor = new PerformanceMonitor();

// Save metrics daily
setInterval(() => {
  performanceMonitor.saveMetrics();
}, 24 * 60 * 60 * 1000); // Every 24 hours

module.exports = performanceMonitor;

// ===== ANALYTICS API ROUTE =====
// File: server/routes/analytics.js (CREATE NEW FILE)

const express = require('express');
const router = express.Router();
const performanceMonitor = require('../middleware/performanceMonitor');
const auth = require('../middleware/auth');

// Get performance analytics (admin only)
router.get('/performance', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const analytics = performanceMonitor.getAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  const analytics = performanceMonitor.getAnalytics();
  
  const status = {
    status: 'healthy',
    checks: {
      responseTime: analytics.requests.avgResponseTime < 1000 ? 'pass' : 'warn',
      errorRate: analytics.requests.errorRate < 5 ? 'pass' : 'fail',
      imageSuccessRate: analytics.images.successRate > 90 ? 'pass' : 'fail',
      databasePerformance: analytics.database.avgQueryTime < 500 ? 'pass' : 'warn'
    },
    metrics: analytics
  };
  
  // Determine overall status
  const hasFailures = Object.values(status.checks).includes('fail');
  const hasWarnings = Object.values(status.checks).includes('warn');
  
  if (hasFailures) {
    status.status = 'unhealthy';
  } else if (hasWarnings) {
    status.status = 'degraded';
  }
  
  res.status(hasFailures ? 503 : 200).json(status);
});

module.exports = router;

// ===== CLIENT-SIDE PERFORMANCE TRACKING =====
// File: client/src/utils/performanceTracker.js (CREATE NEW FILE)

class ClientPerformanceTracker {
  constructor() {
    this.metrics = [];
    this.imageLoadMetrics = [];
  }

  // Track API call performance
  trackApiCall(url, startTime, endTime, success, error = null) {
    const metric = {
      timestamp: new Date().toISOString(),
      url: url,
      duration: endTime - startTime,
      success: success,
      error: error
    };
    
    this.metrics.push(metric);
    
    // Log slow API calls
    if (metric.duration > 2000) {
      console.warn(`🐌 Slow API call: ${url} - ${metric.duration}ms`);
    }
    
    // Send to server for analysis (optional)
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricToServer(metric);
    }
  }

  // Track image load performance
  trackImageLoad(url, success, loadTime) {
    const metric = {
      timestamp: new Date().toISOString(),
      url: url,
      success: success,
      loadTime: loadTime
    };
    
    this.imageLoadMetrics.push(metric);
    
    if (!success) {
      console.warn(`❌ Image failed to load: ${url}`);
    }
    
    // Send to server for analysis
    if (process.env.NODE_ENV === 'production') {
      this.sendImageMetricToServer(metric);
    }
  }

  async sendMetricToServer(metric) {
    try {
      await fetch('/api/analytics/client-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      // Silently fail - don't impact user experience
    }
  }

  async sendImageMetricToServer(metric) {
    try {
      await fetch('/api/analytics/image-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      // Silently fail
    }
  }

  // Get client-side performance summary
  getPerformanceSummary() {
    const recentMetrics = this.metrics.filter(
      m => new Date(m.timestamp).getTime() > Date.now() - (60 * 60 * 1000)
    );
    
    const recentImages = this.imageLoadMetrics.filter(
      m => new Date(m.timestamp).getTime() > Date.now() - (60 * 60 * 1000)
    );
    
    const avgApiTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;
    
    const apiSuccessRate = recentMetrics.length > 0
      ? (recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100
      : 0;
    
    const imageSuccessRate = recentImages.length > 0
      ? (recentImages.filter(m => m.success).length / recentImages.length) * 100
      : 0;
    
    return {
      api: {
        totalCalls: recentMetrics.length,
        avgResponseTime: Math.round(avgApiTime),
        successRate: Math.round(apiSuccessRate * 100) / 100
      },
      images: {
        totalLoads: recentImages.length,
        successRate: Math.round(imageSuccessRate * 100) / 100
      }
    };
  }
}

// Export singleton instance
export default new ClientPerformanceTracker();
