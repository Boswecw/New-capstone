// client/src/services/newsAPI.js
import axios from 'axios';

// Internal pet news (custom CMS)
const INTERNAL_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://furbabies-backend.onrender.com/api/news';

// External news from NewsAPI.org (proxy or direct)
const EXTERNAL_NEWS_API_URL = 'https://newsapi.org/v2/everything';
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''; // Your NewsAPI.org key

// Format external NewsAPI.org articles
const formatExternalArticle = (article) => ({
  id: encodeURIComponent(article.url), // Use encoded URL as unique ID
  title: article.title,
  excerpt: article.description || article.content || '',
  publishedAt: article.publishedAt,
  category: 'pet',
  imageUrl: article.urlToImage || '',
  sourceInfo: {
    name: article.source?.name || 'External News',
    url: article.url,
    type: 'external',
  },
});

// Get all news articles (internal and optionally external)
const getAllNews = async ({ category = 'pet', limit = 50 } = {}) => {
  try {
    // Fetch internal pet articles from your backend
    const internalRes = await axios.get(`${INTERNAL_BASE_URL}`, {
      params: { category, limit },
    });

    const internalArticles = internalRes.data?.data || [];

    // Fetch external pet-related articles from NewsAPI
    let externalArticles = [];
    if (NEWS_API_KEY) {
      const keywords = 'pets OR dogs OR cats OR animal adoption OR pet care';
      const externalRes = await axios.get(EXTERNAL_NEWS_API_URL, {
        params: {
          q: keywords,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: NEWS_API_KEY,
        },
      });

      const validArticles = externalRes.data.articles || [];
      externalArticles = validArticles.map(formatExternalArticle);
    }

    // Combine both sources (prioritize internal first)
    const allArticles = [...internalArticles, ...externalArticles];

    return {
      success: true,
      data: allArticles,
    };
  } catch (error) {
    console.error('❌ newsAPI.getAllNews error:', error.message);
    return {
      success: false,
      error: 'Unable to fetch pet news',
      data: [],
    };
  }
};

// Get a single article by ID (internal only)
const getNewsById = async (id) => {
  try {
    const res = await axios.get(`${INTERNAL_BASE_URL}/${id}`);
    return {
      success: true,
      data: res.data?.data,
    };
  } catch (error) {
    console.error(`❌ newsAPI.getNewsById (${id}) error:`, error.message);
    return {
      success: false,
      error: 'News service endpoint not found',
      data: null,
    };
  }
};

export const newsAPI = {
  getAllNews,
  getNewsById,
};
