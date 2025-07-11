// server/routes/news.js - Enhanced with NewsAPI support
const express = require('express');
const router = express.Router();
const https = require('https');
const { optionalAuth } = require('../middleware/auth');

console.log('✅ Enhanced News routes loaded');
console.log('📰 NewsAPI Key status:', process.env.NEWS_API_KEY ? '✅ Found' : '❌ Missing');

// Helper function to make HTTPS requests
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Fetch news from NewsAPI
const fetchNewsAPI = async (category, limit) => {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  if (!NEWS_API_KEY) {
    throw new Error('NewsAPI key not configured');
  }
  
  // Map categories to search queries
  const searchQueries = {
    pets: 'pets OR animals OR "pet care" OR veterinary',
    dogs: 'dogs OR canine OR "dog training" OR "dog health"',
    cats: 'cats OR feline OR "cat behavior" OR "cat health"',
    veterinary: 'veterinary OR "animal health" OR "pet medicine"',
    adoption: '"pet adoption" OR "animal rescue" OR "shelter pets"'
  };
  
  const query = searchQueries[category] || searchQueries.pets;
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&language=en&apiKey=${NEWS_API_KEY}`;
  
  console.log(`📡 Fetching from NewsAPI for category: ${category}`);
  
  const result = await makeRequest(newsApiUrl);
  
  if (result.status === 'ok' && result.articles) {
    const articles = result.articles
      .filter(article => 
        article.title && 
        article.description && 
        !article.title.includes('[Removed]') &&
        article.source.name !== '[Removed]'
      )
      .map((article, index) => ({
        id: `newsapi-${Date.now()}-${index}`,
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        author: article.author || 'News Reporter',
        source: article.source.name,
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage,
        url: article.url,
        category: category
      }));
    
    console.log(`✅ NewsAPI returned ${articles.length} articles`);
    return articles;
  } else {
    throw new Error(result.message || 'NewsAPI request failed');
  }
};

// Fallback: Generate sample news (same as before)
const generateSampleNews = (category, limit) => {
  const newsDatabase = {
    pets: [
      {
        title: "Revolutionary Pet Health Technology Emerges",
        description: "New wearable devices help monitor pet health in real-time.",
        source: "Pet Tech Today",
        author: "Dr. Sarah Martinez"
      },
      {
        title: "Study Shows Pets Reduce Owner Stress by 60%",
        description: "Latest research confirms significant mental health benefits of pet ownership.",
        source: "Health Research Journal",
        author: "Research Team"
      }
    ],
    dogs: [
      {
        title: "New Dog Training Method Shows 95% Success Rate",
        description: "Positive reinforcement techniques yield remarkable training results.",
        source: "Canine Training Pro",
        author: "Mark Stevens"
      }
    ],
    cats: [
      {
        title: "Understanding Cat Behavior: Latest Research",
        description: "New studies reveal insights into feline communication and behavior.",
        source: "Feline Studies Quarterly",
        author: "Dr. Amanda Foster"
      }
    ]
  };
  
  const articles = newsDatabase[category] || newsDatabase.pets;
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

// GET /api/news - Main endpoint with NewsAPI support
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category = 'pets', limit = 10 } = req.query;
    console.log(`📰 News request: category=${category}, limit=${limit}`);
    
    let articles = [];
    let source = 'unknown';
    
    // Try NewsAPI first (if key is available)
    if (process.env.NEWS_API_KEY) {
      try {
        articles = await fetchNewsAPI(category, limit);
        source = 'NewsAPI';
        console.log(`✅ Using real news from NewsAPI: ${articles.length} articles`);
      } catch (error) {
        console.error('❌ NewsAPI failed:', error.message);
        // Fall back to sample news
        articles = generateSampleNews(category, limit);
        source = 'Sample Data (NewsAPI failed)';
      }
    } else {
      // No API key, use sample news
      console.log('⚠️ No NewsAPI key found, using sample data');
      articles = generateSampleNews(category, limit);
      source = 'Sample Data (No API key)';
    }
    
    res.json({
      success: true,
      data: articles,
      total: articles.length,
      message: `Pet news from ${source}`,
      category: category,
      source: source,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ News API error:', error);
    
    // Emergency fallback
    const fallbackArticles = generateSampleNews(req.query.category || 'pets', req.query.limit || 10);
    
    res.json({
      success: true,
      data: fallbackArticles,
      total: fallbackArticles.length,
      message: 'Sample pet news (API temporarily unavailable)',
      source: 'Emergency Fallback',
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
    { id: 'veterinary', name: 'Veterinary News', description: 'Pet health news', icon: '🏥' },
    { id: 'adoption', name: 'Adoption Stories', description: 'Adoption success stories', icon: '❤️' }
  ];
  
  res.json({
    success: true,
    data: categories,
    total: categories.length,
    message: 'Categories loaded successfully'
  });
});

// GET /api/news/status - Check NewsAPI status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'News API Status Check',
    newsApiKey: process.env.NEWS_API_KEY ? 'Configured ✅' : 'Missing ❌',
    mode: process.env.NEWS_API_KEY ? 'Live News' : 'Sample Data',
    timestamp: new Date().toISOString()
  });
});

// GET /api/news/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pet News API is healthy',
    status: 'online',
    newsApiKey: process.env.NEWS_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;