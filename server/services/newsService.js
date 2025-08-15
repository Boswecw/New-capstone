const axios = require('axios');
const crypto = require('crypto');

// Create a stable ID for external articles
const createStableExternalId = (article) => {
  const source = article.url || article.title || 'unknown';
  return `ext-${crypto
    .createHash('md5')
    .update(source)
    .digest('hex')
    .substring(0, 12)}`;
};

// Format an external article to match the NewsArticle schema
const formatExternal = (article) => ({
  id: createStableExternalId(article),
  title: article.title || 'Untitled Article',
  summary: article.description || '',
  content: article.content || article.description || '',
  author: article.author || article.source?.name || 'External Source',
  category: 'external-news',
  imageUrl: article.urlToImage || '',
  originalUrl: article.url,
  published: true,
  featured: false,
  publishedAt: article.publishedAt || new Date(),
  views: 0,
  likes: 0,
  tags: ['external', 'news'],
  source: 'external',
  type: 'external'
});

// Fallback news data when the external API is unavailable
const getFallbackExternalNews = () => ({
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
      author: 'Pet Expert'
    },
    {
      title: 'Senior Pet Care: What You Need to Know',
      description: 'Special considerations for caring for older pets in your home.',
      content: 'Senior pets require extra attention and care...',
      url: 'https://example.com/senior-pet-care',
      urlToImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
      publishedAt: new Date().toISOString(),
      source: { name: 'Pet Health Today' },
      author: 'Dr. Pet Care'
    }
  ],
  isFallback: true,
  source: 'fallback'
});

// Fetch external news from NewsAPI.org
const fetchExternalNews = async (query = 'pets OR dogs OR cats', limit = 10) => {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;

    if (!NEWS_API_KEY) {
      console.log('⚠️ No NewsAPI key configured - using fallback');
      return getFallbackExternalNews();
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit,
        apiKey: NEWS_API_KEY
      },
      timeout: 10000
    });

    return {
      success: true,
      articles: response.data.articles || [],
      source: 'newsapi'
    };
  } catch (error) {
    console.error('❌ External news fetch error:', error.message);
    return getFallbackExternalNews();
  }
};

// Health information for the news service
const getNewsServiceHealth = () => ({
  status: 'operational',
  timestamp: new Date().toISOString(),
  services: {
    database: 'connected',
    externalAPI: {
      configured: !!process.env.NEWS_API_KEY,
      status: process.env.NEWS_API_KEY ? 'operational' : 'fallback'
    }
  }
});

module.exports = {
  formatExternal,
  fetchExternalNews,
  getFallbackExternalNews,
  getNewsServiceHealth
};
