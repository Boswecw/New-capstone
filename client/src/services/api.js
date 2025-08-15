// client/src/services/api.js
import axios from 'axios';

/**
 * Base URL – set in client/.env as:
 *   VITE_API_BASE_URL=http://localhost:5000/api
 * Falls back to '/api'.
 */
const API_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta?.env?.VITE_API_BASE_URL) ||
  '/api';

/** Axios instance */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // keep if you use cookie auth; ok to remove if not needed
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/** Request/response interceptors (optional but handy for central logging) */
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Central error passthrough (keep console noise minimal in prod)
    if (import.meta?.env?.MODE === 'development') {
      // eslint-disable-next-line no-console
      console.warn('API error:', error?.response?.status, error?.config?.url);
    }
    return Promise.reject(error);
  }
);

/** Remove empty values and trim "all" sentinels so the server won’t choke */
function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (typeof v === 'string' && v.toLowerCase() === 'all') return;
    out[k] = v;
  });
  return out;
}

/* =========================
 *        AUTH API
 * ========================= */
export const authAPI = {
  login(data) {
    return api.post('/auth/login', data);
  },
  register(data) {
    return api.post('/auth/register', data);
  },
  me() {
    return api.get('/auth/me');
  },
  logout() {
    return api.post('/auth/logout');
  },
};

/* =========================
 *        PETS API
 * ========================= */
export const petAPI = {
  /** General listing with filters/pagination */
  getAllPets(params = {}) {
    return api.get('/pets', { params: cleanParams(params) });
  },

  /**
   * Featured pets – uses index route with filters, so it works even if
   * /api/pets/featured is not present on the server.
   */
  getFeaturedPets(limit = 6) {
    return api.get('/pets', { params: { featured: true, limit } });
  },

  getPetById(id) {
    return api.get(`/pets/${id}`);
  },

  // Optional CRUD helpers if you need them later:
  createPet(data) {
    return api.post('/pets', data);
  },
  updatePet(id, data) {
    return api.put(`/pets/${id}`, data);
  },
  deletePet(id) {
    return api.delete(`/pets/${id}`);
  },
};

/* =========================
 *      PRODUCTS API
 * ========================= */
export const productAPI = {
  getAllProducts(params = {}) {
    return api.get('/products', { params: cleanParams(params) });
  },

  // Your backend already serves /products/featured (based on your logs)
  getFeaturedProducts(limit = 6) {
    return api.get('/products/featured', { params: { limit } });
  },

  getProductById(id) {
    return api.get(`/products/${id}`);
  },
};

/* =========================
 *        NEWS API
 * ========================= */
export const newsAPI = {
  getNews(params = {}) {
    return api.get('/news', { params: cleanParams(params) });
  },
  getFeaturedNews(limit = 3) {
    return api.get('/news', { params: { featured: true, limit } });
  },
};

/* =========================
 *      CONTACT / MISC
 * ========================= */
export const contactAPI = {
  sendMessage(data) {
    return api.post('/contact', data);
  },
};

/* =========================
 *         DEBUG
 * ========================= */
if (typeof window !== 'undefined') {
  // Match your existing console output format
  // eslint-disable-next-line no-console
  console.log('🔧 API Base URL exposed for debugging:', API_BASE_URL);
  // eslint-disable-next-line no-console
  console.log('🔧 API instance exposed as window.__api');
  window.__api = api;
}

export default api;
