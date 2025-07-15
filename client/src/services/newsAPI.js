import axios from 'axios';

// News API configuration
const NEWS_API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_BASE_URL || 'https://furbabies-backend.onrender.com/api'
  : process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const newsApi = axios.create({
  baseURL: `${NEWS_API_BASE_URL}/news`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
newsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
newsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('News API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== HYBRID NEWS API =====
export const newsAPI = {
  // Get mixed content (custom + external)
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return newsApi.get(`/?${searchParams}`);
  },

  // Get featured articles (mixed)
  getFeaturedNews: (limit = 6) => newsApi.get(`/featured?limit=${limit}`),

  // Get only external news (NewsAPI.org)
  getExternalNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return newsApi.get(`/external?${searchParams}`);
  },

  // Get only custom CMS content
  getCustomNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return newsApi.get(`/custom?${searchParams}`);
  },

  // Get specific article
  getNewsById: (id) => newsApi.get(`/${id}`),

  // Get categories
  getNewsCategories: () => newsApi.get('/categories'),

  // Get news by source
  getNewsBySource: (source, params = {}) => {
    const searchParams = new URLSearchParams({ source, ...params });
    return newsApi.get(`/?${searchParams}`);
  },

  // Like article (custom articles only)
  likeArticle: (id) => newsApi.post(`/${id}/like`),

  // Search functionality
  searchNews: (searchTerm, params = {}) => {
    const searchParams = new URLSearchParams({ 
      search: searchTerm,
      ...params 
    });
    return newsApi.get(`/?${searchParams}`);
  }
};

// ===== ADMIN API FOR CUSTOM CMS =====
export const newsAdminAPI = {
  // Create custom article
  createCustomArticle: (articleData) => newsApi.post('/custom', articleData),

  // Update custom article  
  updateCustomArticle: (id, articleData) => newsApi.put(`/custom/${id}`, articleData),

  // Delete custom article
  deleteCustomArticle: (id) => newsApi.delete(`/custom/${id}`),

  // Get all custom articles for admin
  getCustomArticlesAdmin: (params = {}) => {
    const searchParams = new URLSearchParams({ admin: 'true', ...params });
    return newsApi.get(`/custom?${searchParams}`);
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
      'external-news': { icon: 'fas fa-globe', color: 'info' }
    };
    return categoryMap[categoryName] || { icon: 'fas fa-newspaper', color: 'secondary' };
  }
};

export default newsAPI;