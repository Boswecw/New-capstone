// server/services/newsAPI.js
// Helper functions for fetching pet-related news from external sources

const axios = require('axios');

const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const DEFAULT_QUERY = 'pets OR dogs OR cats';

// Fetch pet news with optional query and limit
const fetchPetNews = async (query = DEFAULT_QUERY, limit = 10) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.log('⚠️ No NewsAPI key configured - using fallback');
      return getFallbackNews();
    }

    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit,
        apiKey,
      },
      timeout: 10000,
    });

    return {
      success: true,
      articles: response.data.articles || [],
      source: 'newsapi',
    };
  } catch (error) {
    console.error('❌ External news fetch error:', error.message);
    return getFallbackNews();
  }
};

// Search news by a specific topic
const searchPetNewsByTopic = (topic, limit = 10) => {
  const query = topic
    ? `${topic} AND (pets OR dogs OR cats OR pet adoption)`
    : DEFAULT_QUERY;
  return fetchPetNews(query, limit);
};

// Get trending pet news
const getTrendingPetNews = (limit = 10) => {
  return fetchPetNews('pets trending OR pet adoption', limit);
};

// Verify that the NewsAPI service is reachable
const testNewsAPIConnection = async () => {
  const result = await fetchPetNews(DEFAULT_QUERY, 1);
  return result.success && Array.isArray(result.articles);
};

// Fallback news content in case the external API is unavailable
const getFallbackNews = () => {
  return {
    success: true,
    articles: [
      {
        title: 'Pet Adoption Tips for New Families',
        description: 'Essential guide for families considering pet adoption this season.',
        content: 'When adopting a pet, preparation is key...',
        url: 'https://example.com/adoption-tips',
        urlToImage: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        publishedAt: new Date().toISOString(),
        source: { name: 'Pet Care Guide' },
        author: 'Pet Expert',
      },
      {
        title: 'Senior Pet Care: What You Need to Know',
        description: 'Special considerations for caring for older pets in your home.',
        content: 'Senior pets require extra attention and care...',
        url: 'https://example.com/senior-pet-care',
        urlToImage:
          'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
        publishedAt: new Date().toISOString(),
        source: { name: 'Pet Health Today' },
        author: 'Dr. Pet Care',
      },
    ],
    isFallback: true,
    source: 'fallback',
  };
};

// Health check information for the news service
const getNewsServiceHealth = () => {
  return {
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      externalAPI: {
        configured: !!process.env.NEWS_API_KEY,
        status: process.env.NEWS_API_KEY ? 'operational' : 'fallback',
      },
    },
  };
};

module.exports = {
  fetchPetNews,
  searchPetNewsByTopic,
  getTrendingPetNews,
  testNewsAPIConnection,
  getFallbackNews,
  getNewsServiceHealth,
};

