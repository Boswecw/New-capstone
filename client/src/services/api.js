// client/src/services/api.js - CONSOLIDATED NEWS API (Fixed)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://furbabies-backend.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== NEWS API - CONSOLIDATED =====
export const newsAPI = {
  // Get all news (mixed custom + external)
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/news?${queryString}` : '/news';
    return api.get(url);
  },

  // Get featured news for home page (always works)
  getFeaturedNews: async (limit = 6) => {
    try {
      console.log(`🌟 Fetching ${limit} featured news articles...`);
      const response = await api.get(`/news/featured?limit=${limit}`);
      
      // Ensure consistent response format
      if (response.data && !response.data.success) {
        return {
          data: {
            success: true,
            data: Array.isArray(response.data) ? response.data : [],
            count: Array.isArray(response.data) ? response.data.length : 0
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Featured news fetch failed:', error);
      // Return fallback structure
      return {
        data: {
          success: true,
          data: getFallbackNews(),
          count: 3,
          isFallback: true
        }
      };
    }
  },

  // Get individual article by ID
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },

  // Get only custom (admin-created) articles
  getCustomNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/news/custom?${queryString}` : '/news/custom';
    return api.get(url);
  },

  // Get only external (NewsAPI) articles
  getExternalNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/news/external?${queryString}` : '/news/external';
    return api.get(url);
  },

  // Like/Unlike article
  likeArticle: (id) => {
    return api.post(`/news/${id}/like`);
  },

  // Admin: Create new article
  createArticle: (articleData) => {
    return api.post('/news', articleData);
  },

  // Admin: Update article
  updateArticle: (id, articleData) => {
    return api.put(`/news/${id}`, articleData);
  },

  // Admin: Delete article
  deleteArticle: (id) => {
    return api.delete(`/news/${id}`);
  },

  // Health check
  checkNewsHealth: () => {
    return api.get('/news/health');
  }
};

// Fallback news content for when API fails
const getFallbackNews = () => [
  {
    id: 'fallback-1',
    title: 'Welcome to FurBabies Pet Store',
    excerpt: 'Find your perfect furry companion and everything they need for a happy life.',
    content: 'Our pet store is dedicated to connecting loving families with their perfect pet companions.',
    publishedAt: new Date().toISOString(),
    category: 'company-news',
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=200&fit=crop',
    type: 'custom',
    source: 'internal',
    published: true,
    featured: true,
    isFallback: true
  },
  {
    id: 'fallback-2',
    title: 'Pet Adoption Success Stories',
    excerpt: 'Read heartwarming stories of pets finding their forever homes through our platform.',
    content: 'Every day, we help connect pets with loving families. Here are some of our favorite success stories.',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'success-story',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
    type: 'custom',
    source: 'internal',
    published: true,
    featured: true,
    isFallback: true
  },
  {
    id: 'fallback-3',
    title: 'Pet Care Tips & Guides',
    excerpt: 'Expert advice on keeping your pets healthy, happy, and well-cared for.',
    content: 'Our team of veterinarians and pet care experts share their knowledge to help you provide the best care for your furry friends.',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'care',
    imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=200&fit=crop',
    type: 'custom',
    source: 'internal',
    published: true,
    featured: true,
    isFallback: true
  }
];

export default api;