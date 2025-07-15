// server/services/newsAPI.js

const axios = require('axios');

const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

if (!NEWS_API_KEY) {
  console.warn('⚠️ Missing NEWS_API_KEY. Please set it in your environment.');
}

/**
 * Fetch pet-related news from NewsAPI.org
 * @param {string} query - Search query (default includes pets/dogs/cats)
 * @param {number} limit - Number of articles to fetch (default 10)
 * @returns {Promise<{success: boolean, articles?: [], error?: string}>}
 */
const fetchPetNews = async (query = 'pets OR dogs OR cats OR animal adoption', limit = 10) => {
  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit,
        apiKey: NEWS_API_KEY,
      },
    });

    return {
      success: true,
      articles: response.data.articles || [],
      totalResults: response.data.totalResults,
    };
  } catch (error) {
    console.error('❌ NewsAPI fetch failed:', error.message);
    return {
      success: false,
      message: 'Failed to fetch news articles.',
      error: error.message,
    };
  }
};

module.exports = {
  fetchPetNews,
};
