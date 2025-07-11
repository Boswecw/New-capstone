// server/routes/news.js - Pet News API Route
const express = require('express');
const router = express.Router();
const https = require('https');
const { optionalAuth } = require('../middleware/auth');

console.log('✅ News routes loaded');

// Helper function to make API requests
const fetchNewsFromAPI = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse API response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

// GET /api/news - Fetch pet-related news
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('📰 Fetching pet news...');
    
    const { category = 'pets', limit = 10 } = req.query;
    
    // Using NewsAPI - you'll need to add NEWS_API_KEY to your .env
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    
    if (!NEWS_API_KEY) {
      // Fallback to sample data if no API key
      console.log('⚠️ No NEWS_API_KEY found, returning sample data');
      const sampleNews = [
        {
          id: 'sample-1',
          title: 'New Study Reveals Benefits of Pet Ownership for Mental Health',
          description: 'Recent research shows that pet ownership can significantly improve mental health and reduce stress levels.',
          content: 'A comprehensive study conducted by leading veterinary researchers...',
          author: 'Dr. Sarah Johnson',
          source: 'Pet Health Today',
          publishedAt: new Date().toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
          url: 'https://example.com/sample-article-1',
          category: 'pets'
        },
        {
          id: 'sample-2',
          title: 'Top 10 Tips for First-Time Dog Owners',
          description: 'Essential advice for new dog parents to ensure a smooth transition for both pet and owner.',
          content: 'Bringing home a new dog is an exciting experience...',
          author: 'Mike Thompson',
          source: 'Dog Lovers Weekly',
          publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
          url: 'https://example.com/sample-article-2',
          category: 'dogs'
        },
        {
          id: 'sample-3',
          title: 'Understanding Cat Behavior: What Your Feline is Trying to Tell You',
          description: 'Decode common cat behaviors and strengthen the bond with your feline companion.',
          content: 'Cats communicate in mysterious ways...',
          author: 'Lisa Chen',
          source: 'Feline Facts',
          publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
          url: 'https://example.com/sample-article-3',
          category: 'cats'
        }
      ];
      
      return res.json({
        success: true,
        data: sampleNews.slice(0, parseInt(limit)),
        total: sampleNews.length,
        message: 'Sample pet news retrieved successfully'
      });
    }
    
    // Build search query based on category
    const searchQuery = category === 'pets' 
      ? 'pets OR animals OR "pet care" OR veterinary'
      : category;
    
    const NEWS_API_URL = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&pageSize=${limit}&language=en&apiKey=${NEWS_API_KEY}`;
    
    console.log('🔍 Fetching from NewsAPI with query:', searchQuery);
    
    const newsData = await fetchNewsFromAPI(NEWS_API_URL);
    
    if (newsData.status === 'ok') {
      // Filter and format articles
      const articles = newsData.articles
        .filter(article => 
          article.title && 
          article.description && 
          !article.title.includes('[Removed]') &&
          article.source.name !== '[Removed]'
        )
        .map((article, index) => ({
          id: `${Date.now()}-${index}`, // Generate unique ID
          title: article.title,
          description: article.description,
          content: article.content || article.description,
          author: article.author || 'Unknown',
          source: article.source.name,
          publishedAt: article.publishedAt,
          imageUrl: article.urlToImage,
          url: article.url,
          category: category
        }));
      
      console.log(`✅ Retrieved ${articles.length} articles from NewsAPI`);
      
      res.json({
        success: true,
        data: articles,
        total: articles.length,
        message: 'Pet news fetched successfully'
      });
    } else {
      throw new Error(newsData.message || 'Failed to fetch news from API');
    }
  } catch (error) {
    console.error('❌ Error fetching pet news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet news',
      error: error.message
    });
  }
});

// GET /api/news/categories - Get available news categories
router.get('/categories', (req, res) => {
  try {
    console.log('📂 Fetching news categories...');
    
    const categories = [
      { 
        id: 'pets', 
        name: 'General Pet News', 
        description: 'Latest pet-related news and updates',
        icon: '🐾'
      },
      { 
        id: 'dogs', 
        name: 'Dog News', 
        description: 'Dog-specific articles and care tips',
        icon: '🐕'
      },
      { 
        id: 'cats', 
        name: 'Cat News', 
        description: 'Cat-specific articles and behavior guides',
        icon: '🐱'
      },
      { 
        id: 'veterinary', 
        name: 'Veterinary News', 
        description: 'Health and medical news for pets',
        icon: '🏥'
      },
      { 
        id: 'adoption', 
        name: 'Adoption Stories', 
        description: 'Success stories and adoption tips',
        icon: '❤️'
      },
      {
        id: 'training',
        name: 'Training & Behavior',
        description: 'Training tips and behavioral insights',
        icon: '🎾'
      }
    ];
    
    console.log('✅ News categories retrieved');
    
    res.json({
      success: true,
      data: categories,
      total: categories.length,
      message: 'News categories retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news categories',
      error: error.message
    });
  }
});

// GET /api/news/featured - Get featured news articles
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    console.log('⭐ Fetching featured news...');
    
    const { limit = 3 } = req.query;
    
    // For demo purposes, we'll fetch general pet news
    // In production, you might have a database field for featured articles
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    
    if (!NEWS_API_KEY) {
      // Return sample featured articles
      const featuredNews = [
        {
          id: 'featured-1',
          title: 'Revolutionary Pet Health Technology Emerges',
          description: 'New wearable devices help monitor pet health in real-time.',
          author: 'Tech Pet Weekly',
          source: 'Pet Innovation',
          publishedAt: new Date().toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
          url: 'https://example.com/featured-1',
          category: 'pets',
          featured: true
        }
      ];
      
      return res.json({
        success: true,
        data: featuredNews.slice(0, parseInt(limit)),
        message: 'Featured news retrieved successfully'
      });
    }
    
    // Use the main news endpoint with pets category
    req.query = { category: 'pets', limit };
    return router.handle(req, res);
    
  } catch (error) {
    console.error('❌ Error fetching featured news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured news',
      error: error.message
    });
  }
});

// GET /api/news/health - Get pet health check status
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'News API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/news - Get news articles',
      'GET /api/news/categories - Get news categories',
      'GET /api/news/featured - Get featured articles',
      'GET /api/news/health - Health check'
    ]
  });
});

module.exports = router;