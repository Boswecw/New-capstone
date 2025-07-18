// client/src/services/newsAPI.js - FIXED VERSION with robust configuration
import axios from 'axios';

// ✅ FIXED: Consistent API base URL configuration
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || 'https://furbabies-backend.onrender.com/api';
  } else {
    return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  }
};

const NEWS_API_BASE_URL = getBaseURL();

console.log('🔧 News API Base URL:', NEWS_API_BASE_URL);

const newsApi = axios.create({
  baseURL: `${NEWS_API_BASE_URL}/news`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth and debugging
newsApi.interceptors.request.use(
  (config) => {
    console.log('📤 News API Request:', config.method?.toUpperCase(), config.url);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('📤 News API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
newsApi.interceptors.response.use(
  (response) => {
    console.log('📥 News API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📥 News API Error Details:');
    console.error('  URL:', error.config?.url);
    console.error('  Method:', error.config?.method);
    console.error('  Status:', error.response?.status);
    console.error('  Data:', error.response?.data);
    console.error('  Message:', error.message);
    
    // Provide more helpful error messages
    if (error.code === 'ECONNREFUSED') {
      error.message = 'Cannot connect to news service. Please check if the server is running.';
    } else if (error.code === 'NETWORK_ERROR') {
      error.message = 'Network error while fetching news. Please check your connection.';
    } else if (error.response?.status === 404) {
      error.message = 'News service endpoint not found. Please check the server configuration.';
    } else if (error.response?.status === 500) {
      error.message = 'News service is experiencing issues. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

// ===== ROBUST NEWS API WITH FALLBACKS =====
export const newsAPI = {
  // Get mixed content (custom + external) with error handling
  getAllNews: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          searchParams.append(key, params[key]);
        }
      });
      
      console.log('🔍 getAllNews called with params:', params);
      const response = await newsApi.get(`/?${searchParams}`);
      console.log('✅ getAllNews response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getAllNews failed:', error.message);
      throw error;
    }
  },

  // Get featured articles with enhanced error handling
  getFeaturedNews: async (limit = 6) => {
    try {
      console.log('🔍 getFeaturedNews called with limit:', limit);
      const response = await newsApi.get(`/featured?limit=${limit}`);
      console.log('✅ getFeaturedNews response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getFeaturedNews failed:', error.message);
      throw error;
    }
  },

  // Get only external news
  getExternalNews: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams(params);
      console.log('🔍 getExternalNews called with params:', params);
      const response = await newsApi.get(`/external?${searchParams}`);
      console.log('✅ getExternalNews response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getExternalNews failed:', error.message);
      throw error;
    }
  },

  // Get only custom CMS content
  getCustomNews: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams(params);
      console.log('🔍 getCustomNews called with params:', params);
      const response = await newsApi.get(`/custom?${searchParams}`);
      console.log('✅ getCustomNews response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getCustomNews failed:', error.message);
      throw error;
    }
  },

  // Get specific article
  getNewsById: async (id) => {
    try {
      console.log('🔍 getNewsById called with id:', id);
      const response = await newsApi.get(`/${id}`);
      console.log('✅ getNewsById response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getNewsById failed:', error.message);
      throw error;
    }
  },

  // Get categories
  getNewsCategories: async () => {
    try {
      console.log('🔍 getNewsCategories called');
      const response = await newsApi.get('/categories');
      console.log('✅ getNewsCategories response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getNewsCategories failed:', error.message);
      throw error;
    }
  },

  // Health check for debugging
  checkNewsHealth: async () => {
    try {
      console.log('🔍 checkNewsHealth called');
      const response = await newsApi.get('/health');
      console.log('✅ checkNewsHealth response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ checkNewsHealth failed:', error.message);
      throw error;
    }
  },

  // Like article (custom articles only)
  likeArticle: async (id) => {
    try {
      console.log('🔍 likeArticle called with id:', id);
      const response = await newsApi.post(`/${id}/like`);
      console.log('✅ likeArticle response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ likeArticle failed:', error.message);
      throw error;
    }
  },

  // Search functionality
  searchNews: async (searchTerm, params = {}) => {
    try {
      const searchParams = new URLSearchParams({ 
        search: searchTerm,
        ...params 
      });
      console.log('🔍 searchNews called with term:', searchTerm, 'params:', params);
      const response = await newsApi.get(`/?${searchParams}`);
      console.log('✅ searchNews response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ searchNews failed:', error.message);
      throw error;
    }
  }
};

// ===== ADMIN API FOR CUSTOM CMS =====
export const newsAdminAPI = {
  // Create custom article
  createCustomArticle: async (articleData) => {
    try {
      console.log('🔍 createCustomArticle called');
      const response = await newsApi.post('/custom', articleData);
      console.log('✅ createCustomArticle response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ createCustomArticle failed:', error.message);
      throw error;
    }
  },

  // Update custom article  
  updateCustomArticle: async (id, articleData) => {
    try {
      console.log('🔍 updateCustomArticle called with id:', id);
      const response = await newsApi.put(`/custom/${id}`, articleData);
      console.log('✅ updateCustomArticle response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ updateCustomArticle failed:', error.message);
      throw error;
    }
  },

  // Delete custom article
  deleteCustomArticle: async (id) => {
    try {
      console.log('🔍 deleteCustomArticle called with id:', id);
      const response = await newsApi.delete(`/custom/${id}`);
      console.log('✅ deleteCustomArticle response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ deleteCustomArticle failed:', error.message);
      throw error;
    }
  },

  // Get all custom articles for admin
  getCustomArticlesAdmin: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams({ admin: 'true', ...params });
      console.log('🔍 getCustomArticlesAdmin called');
      const response = await newsApi.get(`/custom?${searchParams}`);
      console.log('✅ getCustomArticlesAdmin response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ getCustomArticlesAdmin failed:', error.message);
      throw error;
    }
  }
};

// ===== NEWS UTILITIES =====
export const newsUtils = {
  // Determine article source
  getArticleSource: (article) => {
    if (article.type === 'external' || article.source === 'external') {
      return {
        type: 'external',
        label: 'Pet News',
        icon: 'fas fa-globe',
        color: 'info'
      };
    }
    return {
      type: 'custom',
      label: 'FurBabies',
      icon: 'fas fa-home',
      color: 'primary'
    };
  },

  // Format article for display
  formatArticle: (article) => ({
    ...article,
    formattedDate: new Date(article.publishedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    sourceInfo: newsUtils.getArticleSource(article)
  }),

  // Get category info
  getCategoryInfo: (categoryName) => {
    const categoryMap = {
      'success-story': { icon: 'fas fa-trophy', color: 'success' },
      'safety': { icon: 'fas fa-shield-alt', color: 'warning' },
      'company-news': { icon: 'fas fa-building', color: 'primary' },
      'external-news': { icon: 'fas fa-globe', color: 'info' },
      'adoption': { icon: 'fas fa-heart', color: 'danger' },
      'care': { icon: 'fas fa-hand-holding-heart', color: 'success' },
      'health': { icon: 'fas fa-stethoscope', color: 'info' }
    };
    return categoryMap[categoryName] || { icon: 'fas fa-newspaper', color: 'secondary' };
  }
};

// Debug helper - only for development
export const debugNewsAPI = {
  testAllEndpoints: async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('🧪 Testing all news API endpoints...');
    
    const tests = [
      { name: 'Health Check', fn: () => newsAPI.checkNewsHealth() },
      { name: 'Featured News', fn: () => newsAPI.getFeaturedNews(3) },
      { name: 'Custom News', fn: () => newsAPI.getCustomNews({ limit: 3 }) },
      { name: 'External News', fn: () => newsAPI.getExternalNews({ limit: 3 }) },
      { name: 'All News', fn: () => newsAPI.getAllNews({ limit: 5 }) }
    ];

    for (const test of tests) {
      try {
        console.log(`🧪 Testing: ${test.name}`);
        await test.fn();
        console.log(`✅ ${test.name}: PASSED`);
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      }
    }
  }
};

export default newsAPI;