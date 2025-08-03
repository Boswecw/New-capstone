// client/src/services/newsAPI.js - Uses backend-proxy, no frontend API keys
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://furbabies-backend.onrender.com/api';

export const newsAPI = {
  // Get featured (custom + external) articles
  getFeaturedNews: (limit = 6) => {
    return axios.get(`${API_BASE_URL}/news/featured?limit=${limit}`);
  },

  // Get all articles (with filters)
  getAllNews: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE_URL}/news?${query}`);
  },

  // Get a specific article by ID
  getArticleById: (id) => {
    return axios.get(`${API_BASE_URL}/news/${id}`);
  },

  // Like an article
  likeArticle: (id) => {
    return axios.post(`${API_BASE_URL}/news/${id}/like`);
  },

  // Get only internal (admin-created) articles
  getCustomArticles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE_URL}/news/custom?${query}`);
  },

  // Get only external (NewsAPI.org) articles
  getExternalArticles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE_URL}/news/external?${query}`);
  },

  // Get category breakdown (for filters or UI)
  getCategories: () => {
    return axios.get(`${API_BASE_URL}/news/categories`);
  },

  // Health check for news service
  getHealth: () => {
    return axios.get(`${API_BASE_URL}/news/health`);
  }
};

module.exports = {
  fetchPetNews,
  searchPetNewsByTopic,
  getTrendingPetNews,
  testNewsAPIConnection,
  getFallbackNews,
  getNewsServiceHealth
};