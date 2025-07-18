// server/services/newsAPI.js
// ==========================================
// NewsAPI Service - External News Integration
// ==========================================

const axios = require('axios');

// NewsAPI.org configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Fallback news data for when external API is unavailable
const fallbackNewsData = [
  {
    title: "Pet Adoption Rates Surge During Holiday Season",
    description: "Local shelters report increased adoption rates as families seek new companions for the holidays. Many families are choosing to add furry members during this special time of year.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80",
    publishedAt: new Date().toISOString(),
    source: { name: "Pet News" },
    author: "Pet News Team",
    content: "Holiday season brings joy not just to families, but also to pets in shelters..."
  },
  {
    title: "New Study Reveals Mental Health Benefits of Pet Ownership",
    description: "Comprehensive research shows pets contribute significantly to mental health and well-being, especially during stressful times.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=400&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    source: { name: "Pet Health Journal" },
    author: "Dr. Sarah Johnson",
    content: "A comprehensive study involving over 10,000 pet owners has revealed..."
  },
  {
    title: "Technology Helps Reunite Lost Pets with Families",
    description: "New microchip technology and mobile apps are revolutionizing how lost pets are reunited with their worried families.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1556909114-4f5b0b7e9915?w=600&h=400&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    source: { name: "Tech Pet" },
    author: "Michael Chen",
    content: "Advances in microchip technology are making it easier than ever..."
  },
  {
    title: "Seasonal Pet Care: Preparing Your Pets for Winter",
    description: "Essential tips and guidance for keeping your beloved pets safe and comfortable during the colder winter months.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1514984879728-be0aff75a6e8?w=600&h=400&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    source: { name: "Pet Care Weekly" },
    author: "Dr. Emily Rodriguez",
    content: "As temperatures drop, pet owners need to take special precautions..."
  },
  {
    title: "Community Pet Drive Collects Record Donations",
    description: "Local community comes together to support animal shelters with the largest donation drive in the region's history.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80",
    publishedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    source: { name: "Community News" },
    author: "Lisa Thompson",
    content: "The annual community pet drive exceeded all expectations this year..."
  }
];

/**
 * Test NewsAPI.org connection and configuration
 * @returns {Object} Connection test results
 */
async function testNewsAPIConnection() {
  try {
    if (!NEWS_API_KEY) {
      console.log('⚠️ NewsAPI.org: API key not configured');
      return {
        success: false,
        configured: false,
        message: 'NewsAPI.org API key not configured in environment variables'
      };
    }

    console.log('🔍 Testing NewsAPI.org connection...');
    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        apiKey: NEWS_API_KEY,
        category: 'general',
        pageSize: 1,
        country: 'us'
      },
      timeout: 5000
    });

    if (response.data.status === 'ok') {
      console.log('✅ NewsAPI.org connection successful');
      return {
        success: true,
        configured: true,
        message: 'NewsAPI.org connection successful',
        status: response.data.status
      };
    } else {
      throw new Error(`API returned status: ${response.data.status}`);
    }
  } catch (error) {
    console.log('❌ NewsAPI.org connection failed:', error.message);
    return {
      success: false,
      configured: !!NEWS_API_KEY,
      message: `Connection failed: ${error.message}`,
      error: error.response?.data?.message || error.message
    };
  }
}

/**
 * Fetch pet-related news from NewsAPI.org with fallback
 * @param {string} query - Search query for news articles
 * @param {number} limit - Maximum number of articles to return
 * @returns {Object} News fetch results
 */
async function fetchPetNews(query = 'pets', limit = 10) {
  try {
    if (!NEWS_API_KEY) {
      console.log('⚠️ NewsAPI key not configured, using fallback data');
      return {
        success: true,
        isFallback: true,
        articles: fallbackNewsData.slice(0, limit),
        message: 'Using fallback data (NewsAPI.org not configured)',
        totalResults: fallbackNewsData.length
      };
    }

    console.log(`🌐 Fetching external news: "${query}" (limit: ${limit})`);
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: Math.min(limit, 100), // NewsAPI max is 100
        domains: 'reuters.com,bbc.com,cnn.com,npr.org,apnews.com' // Reliable sources
      },
      timeout: 10000
    });

    if (response.data.status === 'ok' && response.data.articles && response.data.articles.length > 0) {
      // Filter out articles with missing essential data
      const validArticles = response.data.articles.filter(article => 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
      );

      console.log(`✅ External news: ${validArticles.length} valid articles from NewsAPI.org`);
      return {
        success: true,
        isFallback: false,
        articles: validArticles.slice(0, limit),
        totalResults: response.data.totalResults,
        message: 'External news retrieved successfully'
      };
    } else {
      throw new Error('No valid articles found in response');
    }
  } catch (error) {
    console.log('⚠️ External news fetch failed, using fallback:', error.message);
    return {
      success: true,
      isFallback: true,
      articles: fallbackNewsData.slice(0, limit),
      message: `Using fallback data due to external API error: ${error.message}`,
      totalResults: fallbackNewsData.length,
      error: error.message
    };
  }
}

/**
 * Search pet news by specific topic
 * @param {string} topic - Topic to search for
 * @param {number} limit - Maximum number of articles
 * @returns {Object} Search results
 */
async function searchPetNewsByTopic(topic, limit = 10) {
  const searchQuery = `${topic} AND (pets OR dogs OR cats OR animals OR veterinary)`;
  console.log(`🔍 Searching news by topic: "${topic}"`);
  return await fetchPetNews(searchQuery, limit);
}

/**
 * Get trending pet-related news
 * @param {number} limit - Maximum number of articles
 * @returns {Object} Trending news results
 */
async function getTrendingPetNews(limit = 10) {
  const trendingQuery = 'trending pets OR viral pets OR pet rescue OR animal adoption OR pet health';
  console.log(`📈 Fetching trending pet news`);
  return await fetchPetNews(trendingQuery, limit);
}

/**
 * Get fallback news when all external services fail
 * @param {number} limit - Maximum number of articles
 * @returns {Object} Fallback news data
 */
function getFallbackNews(limit = 10) {
  console.log(`🔄 Providing fallback news data (${limit} articles)`);
  return {
    success: true,
    isFallback: true,
    articles: fallbackNewsData.slice(0, limit),
    message: 'Fallback news data provided',
    totalResults: fallbackNewsData.length
  };
}

/**
 * Health check for the entire news service
 * @returns {Object} Service health status
 */
async function getNewsServiceHealth() {
  const connectionTest = await testNewsAPIConnection();
  const fallbackCount = fallbackNewsData.length;
  
  return {
    external: {
      configured: !!NEWS_API_KEY,
      operational: connectionTest.success,
      message: connectionTest.message
    },
    fallback: {
      available: true,
      articles: fallbackCount
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchPetNews,
  searchPetNewsByTopic,
  getTrendingPetNews,
  testNewsAPIConnection,
  getFallbackNews,
  getNewsServiceHealth
};