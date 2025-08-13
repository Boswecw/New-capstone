// client/src/utils/image.js
// Central place to normalize any pet/product image value

const API_BASE = (typeof window !== 'undefined' && window.__api?.defaults?.baseURL)
  || process.env.REACT_APP_API_BASE_URL
  || 'http://localhost:5000/api';

// Accepts: absolute URL, relative GCS path, `/images/...`, storage key, array, etc.
export function normalizeImageUrl(input) {
  if (!input) return null;

  // If an array (e.g., [{url: '...'}] or ['...'])
  if (Array.isArray(input)) {
    const first = input[0];
    return normalizeImageUrl(typeof first === 'string' ? first : first?.url);
  }

  // Objects with url field
  if (typeof input === 'object') {
    return normalizeImageUrl(input.url || input.image || input.imageUrl);
  }

  const str = String(input).trim();
  if (!str) return null;

  // Already absolute http(s)
  if (/^https?:\/\//i.test(str)) return str;

  // Keys that your images API can serve
  // e.g. 'pet/dachshund.png' or 'product/leash.png'
  if (/^(pet|product|news|uploads)\//i.test(str)) {
    return `${API_BASE}/images/${str}`;
  }

  // Leading slash to your images route, keep it as-is but prefix base
  if (str.startsWith('/images/')) {
    return `${API_BASE}${str}`;
  }

  // Plain filename (rare): send through images API
  if (!str.includes('/')) {
    return `${API_BASE}/images/${str}`;
  }

  // Fallback: prefix with API if it looks like a server path
  if (str.startsWith('/')) {
    return `${API_BASE}${str}`;
  }

  // Last resort: treat as key under /images
  return `${API_BASE}/images/${str}`;
}