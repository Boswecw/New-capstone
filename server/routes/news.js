// server/routes/news.js - RSS Feed Implementation (Replace your existing file)
const express = require('express');
const router = express.Router();
const https = require('https');
const { optionalAuth } = require('../middleware/auth');

console.log('✅ News routes loaded with RSS feeds');

// Popular pet RSS feeds by category
const PET_RSS_FEEDS = {
  pets: [
    'https://www.petmd.com/rss.xml',
    'https://www.rover.com/blog/feed/',
    'https://www.petfinder.com/blog/feed/'
  ],
  dogs: [
    'https://www.akc.org/feed/',
    'https://dogtime.com/feed',
    'https://www.whole-dog-journal.com/feed/'
  ],
  cats: [
    'https://cattime.com/feed'
  ],
  veterinary: [
    'https://www.petmd.com/rss.xml'
  ],
  adoption: [
    'https://www.petfinder.com/blog/feed/',
    'https://www.aspca.org/rss.xml'
  ]
};

// Function to fetch and parse RSS feed
const fetchRSSFeed = (rssUrl) => {
  return new Promise((resolve, reject) => {
    // Use rss2json service to convert RSS to JSON
    const RSS_TO_JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=null&count=10`;
    
    https.get(RSS_TO_JSON_API, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.status === 'ok' && result.items) {
            console.log(`✅ Fetched ${result.items.length} articles from RSS`);
            resolve(result.items);
          } else {
            console.warn('⚠️ RSS feed returned no items:', result);
            resolve([]);
          }
        } catch (error) {
          console.error('❌ Error parsing RSS JSON:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Error fetching RSS:', error);
      reject(error);
    });
  });
};

// Function to clean HTML from text
const stripHTML = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

// Function to get domain name from URL
const getDomainName = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Pet News';
  }
};

// GET /api/news - Fetch pet-related news from RSS feeds
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('📰 Fetching live pet news from RSS feeds...');
    
    const { category = 'pets', limit = 10 } = req.query;
    
    // Get RSS feeds for the category
    const feedUrls = PET_RSS_FEEDS[category] || PET_RSS_FEEDS.pets;
    console.log(`🔍 Using ${feedUrls.length} RSS feeds for category: ${category}`);
    
    let allArticles = [];
    
    // Fetch articles from multiple RSS feeds
    for (const feedUrl of feedUrls) {
      try {
        console.log(`📡 Fetching from: ${feedUrl}`);
        const articles = await fetchRSSFeed(feedUrl);
        
        // Format articles
        const formattedArticles = articles.map((article, index) => ({
          id: `rss-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          title: stripHTML(article.title) || 'Pet News Article',
          description: stripHTML(article.description) || 'Click to read more about this pet-related topic.',
          content: stripHTML(article.content || article.description) || '',
          author: article.author || 'Pet Expert',
          source: getDomainName(article.link) || 'Pet News',
          publishedAt: article.pubDate || new Date().toISOString(),
          imageUrl: article.enclosure?.link || article.thumbnail || null,
          url: article.link,
          category: category
        }));
        
        allArticles.push(...formattedArticles);
        console.log(`✅ Added ${formattedArticles.length} articles from ${getDomainName(feedUrl)}`);
        
      } catch (error) {
        console.error(`❌ Failed to fetch from ${feedUrl}:`, error.message);
        // Continue with other feeds
      }
    }
    
    // Sort by date (newest first) and limit results
    const sortedArticles = allArticles
      .filter(article => article.title && article.url) // Remove invalid articles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, parseInt(limit));
    
    console.log(`✅ Returning ${sortedArticles.length} live pet news articles`);
    
    res.json({
      success: true,
      data: sortedArticles,
      total: sortedArticles.length,
      message: `Live pet news from ${feedUrls.length} RSS sources`,
      sources: feedUrls.map(url => getDomainName(url))
    });
    
  } catch (error) {
    console.error('❌ Error fetching RSS pet news:', error);
    
    // Fallback to sample data
    const sampleNews = [
      {
        id: 'sample-1',
        title: 'Understanding Your Pet\'s Nutritional Needs',
        description: 'Learn about the essential nutrients your pet needs for optimal health and wellbeing.',
        content: 'A comprehensive guide to pet nutrition...',
        author: 'Dr. Pet Expert',
        source: 'Pet Health Today',
        publishedAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        url: 'https://example.com/pet-nutrition',
        category: 'pets'
      },
      {
        id: 'sample-2',
        title: 'Signs Your Dog Needs More Exercise',
        description: 'Recognizing the behavioral and physical signs that indicate your dog needs more physical activity.',
        content: 'Exercise is crucial for dog health...',
        author: 'Canine Specialist',
        source: 'Dog Care Weekly',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
        url: 'https://example.com/dog-exercise',
        category: 'dogs'
      }
    ];
    
    res.json({
      success: true,
      data: sampleNews.slice(0, parseInt(limit)),
      total: sampleNews.length,
      message: 'Sample pet news (RSS feeds temporarily unavailable)',
      error: 'Live feeds unavailable, showing sample content'
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
        icon: '🐾',
        feedCount: PET_RSS_FEEDS.pets.length
      },
      { 
        id: 'dogs', 
        name: 'Dog News', 
        description: 'Dog-specific articles and care tips',
        icon: '🐕',
        feedCount: PET_RSS_FEEDS.dogs.length
      },
      { 
        id: 'cats', 
        name: 'Cat News', 
        description: 'Cat-specific articles and behavior guides',
        icon: '🐱',
        feedCount: PET_RSS_FEEDS.cats.length
      },
      { 
        id: 'veterinary', 
        name: 'Veterinary News', 
        description: 'Health and medical news for pets',
        icon: '🏥',
        feedCount: PET_RSS_FEEDS.veterinary.length
      },
      { 
        id: 'adoption', 
        name: 'Adoption Stories', 
        description: 'Success stories and adoption tips',
        icon: '❤️',
        feedCount: PET_RSS_FEEDS.adoption.length
      }
    ];
    
    console.log('✅ News categories retrieved');
    
    res.json({
      success: true,
      data: categories,
      total: categories.length,
      message: 'News categories with live RSS feeds'
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

// GET /api/news/sources - Get information about RSS sources
router.get('/sources', (req, res) => {
  try {
    const sources = Object.entries(PET_RSS_FEEDS).map(([category, feeds]) => ({
      category,
      feeds: feeds.map(feed => ({
        url: feed,
        domain: getDomainName(feed),
        name: getDomainName(feed).charAt(0).toUpperCase() + getDomainName(feed).slice(1)
      }))
    }));
    
    res.json({
      success: true,
      data: sources,
      message: 'RSS feed sources information'
    });
  } catch (error) {
    console.error('❌ Error fetching sources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news sources',
      error: error.message
    });
  }
});

// GET /api/news/health - Get pet health check status
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Live Pet News API is healthy',
    timestamp: new Date().toISOString(),
    feedSources: Object.keys(PET_RSS_FEEDS).length,
    totalFeeds: Object.values(PET_RSS_FEEDS).flat().length,
    endpoints: [
      'GET /api/news - Get live news articles',
      'GET /api/news/categories - Get news categories',
      'GET /api/news/sources - Get RSS feed sources',
      'GET /api/news/health - Health check'
    ]
  });
});

module.exports = router;