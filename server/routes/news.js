// server/routes/news.js - Complete NewsAPI Implementation
const express = require('express');
const router = express.Router();
const https = require('https');
const { optionalAuth } = require('../middleware/auth');

console.log('✅ News routes loaded with NewsAPI support');
console.log('🔑 NewsAPI Key:', process.env.NEWS_API_KEY ? 'Configured ✅' : 'Missing ❌');

// Make HTTPS requests
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Fetch real news from NewsAPI
const fetchNewsAPI = async (category, limit) => {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  if (!NEWS_API_KEY) {
    throw new Error('NewsAPI key not found');
  }
  
  // Map categories to search terms
  const searchTerms = {
    pets: 'pets OR animals OR "pet care" OR "pet health"',
    dogs: 'dogs OR canine OR "dog training" OR "dog care"',
    cats: 'cats OR feline OR "cat behavior" OR "cat care"',
    veterinary: '"veterinary medicine" OR "animal health" OR "pet medicine"',
    adoption: '"pet adoption" OR "animal rescue" OR "shelter animals"'
  };
  
  const query = searchTerms[category] || searchTerms.pets;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}&language=en&apiKey=${NEWS_API_KEY}`;
  
  console.log(`📡 Fetching NewsAPI: ${category} (${limit} articles)`);
  
  try {
    const result = await makeRequest(url);
    
    if (result.status === 'ok' && result.articles) {
      const articles = result.articles
        .filter(article => {
          // Filter out removed articles and poor quality content
          return article.title && 
                 article.description && 
                 !article.title.includes('[Removed]') &&
                 article.source.name !== '[Removed]' &&
                 article.description.length > 50;
        })
        .map((article, index) => ({
          id: `newsapi-${Date.now()}-${index}`,
          title: article.title,
          description: article.description,
          content: article.content || article.description,
          author: article.author || 'News Team',
          source: article.source.name,
          publishedAt: article.publishedAt,
          imageUrl: article.urlToImage || `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&auto=format&q=80&sig=${index}`,
          url: article.url,
          category: category
        }));
      
      console.log(`✅ NewsAPI Success: ${articles.length} articles retrieved`);
      return articles;
      
    } else {
      throw new Error(`NewsAPI Error: ${result.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ NewsAPI Request Failed:', error.message);
    throw error;
  }
};

// Fallback sample news
const getSampleNews = (category, limit) => {
  const sampleData = {
    pets: [
      {
        title: "New Pet Health Technology Revolutionizes Care",
        description: "Smart wearable devices for pets can now detect health issues before symptoms appear.",
        author: "Dr. Sarah Johnson",
        source: "Pet Health Today"
      },
      {
        title: "Study: Pet Ownership Reduces Stress by 68%",
        description: "Comprehensive research shows significant mental health benefits of pet companionship.",
        author: "Research Team",
        source: "Health & Wellness Journal"
      }
    ],
    dogs: [
      {
        title: "Revolutionary Dog Training Method Shows 95% Success",
        description: "New positive reinforcement techniques are transforming how we train our canine companions.",
        author: "Mark Stevens",
        source: "Canine Training Magazine"
      }
    ],
    cats: [
      {
        title: "Understanding Your Cat's Communication Signals",
        description: "Recent studies reveal the complex ways cats communicate with their human families.",
        author: "Dr. Lisa Chen",
        source: "Feline Behavior Quarterly"
      }
    ]
  };
  
  const articles = sampleData[category] || sampleData.pets;
  const now = Date.now();
  
  return articles.slice(0, parseInt(limit)).map((article, index) => ({
    id: `sample-${category}-${now}-${index}`,
    title: `${article.title} [Demo]`,
    description: article.description,
    content: article.description,
    author: article.author,
    source: `${article.source} (Sample)`,
    publishedAt: new Date(now - (index * 3600000)).toISOString(),
    imageUrl: `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&auto=format&q=80&sig=${index}`,
    url: `https://example.com/sample-${category}-${index}`,
    category: category
  }));
};

// GET /api/news - Main endpoint
router.get('/', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { category = 'pets', limit = 12 } = req.query;
    
    console.log(`📰 News Request: category=${category}, limit=${limit}`);
    
    let articles = [];
    let source = 'unknown';
    let message = '';
    
    // Try NewsAPI first
    if (process.env.NEWS_API_KEY) {
      try {
        articles = await fetchNewsAPI(category, limit);
        source = 'NewsAPI';
        message = `Live ${category} news from NewsAPI`;
        
      } catch (apiError) {
        console.error('❌ NewsAPI failed, using fallback:', apiError.message);
        articles = getSampleNews(category, limit);
        source = 'Sample Data';
        message = `Sample ${category} news (NewsAPI unavailable)`;
      }
    } else {
      console.log('⚠️ No NewsAPI key configured, using sample data');
      articles = getSampleNews(category, limit);
      source = 'Sample Data';
      message = `Sample ${category} news (Configure NewsAPI for live news)`;
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Response ready: ${articles.length} articles in ${responseTime}ms`);
    
    res.json({
      success: true,
      data: articles,
      total: articles.length,
      message: message,
      source: source,
      category: category,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ News endpoint error:', error);
    
    // Emergency fallback
    const emergency = getSampleNews(req.query.category || 'pets', req.query.limit || 10);
    
    res.json({
      success: true,
      data: emergency,
      total: emergency.length,
      message: 'Emergency fallback news (API error)',
      source: 'Emergency',
      error: 'API temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/categories
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'pets', name: 'General Pet News', description: 'Latest pet-related news', icon: '🐾' },
    { id: 'dogs', name: 'Dog News', description: 'Dog-specific articles', icon: '🐕' },
    { id: 'cats', name: 'Cat News', description: 'Cat-specific articles', icon: '🐱' },
    { id: 'veterinary', name: 'Veterinary News', description: 'Pet health and medical news', icon: '🏥' },
    { id: 'adoption', name: 'Adoption Stories', description: 'Pet adoption and rescue stories', icon: '❤️' }
  ];
  
  res.json({
    success: true,
    data: categories,
    total: categories.length,
    message: 'News categories loaded'
  });
});

// GET /api/news/test - Test NewsAPI connection
router.get('/test', async (req, res) => {
  try {
    if (!process.env.NEWS_API_KEY) {
      return res.json({
        success: false,
        message: 'NewsAPI key not configured',
        status: 'missing_key'
      });
    }
    
    // Test with a simple query
    const testArticles = await fetchNewsAPI('pets', 3);
    
    res.json({
      success: true,
      message: 'NewsAPI working correctly!',
      status: 'connected',
      testResults: {
        articlesReturned: testArticles.length,
        sampleTitle: testArticles[0]?.title,
        apiKeyConfigured: true
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      message: 'NewsAPI test failed',
      status: 'error',
      error: error.message,
      apiKeyConfigured: !!process.env.NEWS_API_KEY
    });
  }
});

// GET /api/news/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pet News API is healthy',
    status: 'online',
    newsAPI: process.env.NEWS_API_KEY ? 'configured' : 'missing',
    endpoints: [
      'GET /api/news?category=pets&limit=10',
      'GET /api/news/categories',
      'GET /api/news/test',
      'GET /api/news/health'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;