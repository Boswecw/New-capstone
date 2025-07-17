// client/src/utils/imageUtils.js - UPDATED WITH PROXY SUPPORT
const BUCKET_NAME = 'furbabies-petstore';

// Use the proxy route instead of direct GCS access
const getProxyBaseUrl = () => {
  // In development, use localhost. In production, use relative path
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api/images/gcs';
  }
  return '/api/images/gcs';
};

// Working fallback images that don't require CORS
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  fallback: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
};

/**
 * Get image URL using the proxy route (solves CORS issues)
 * @param {string} imagePath - Path to image in GCS bucket
 * @param {string} category - Category for fallback selection
 * @returns {string} Proxied image URL or fallback
 */
export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.fallback;
  }
  
  // If already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean the path and use proxy route
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  const proxyBaseUrl = getProxyBaseUrl();
  
  return `${proxyBaseUrl}/${cleanPath}`;
};

/**
 * Get fallback image URL through proxy
 * @param {string} category - Image category (pet, product, default)
 * @returns {string} Fallback image URL
 */
export const getFallbackImageUrl = (category = 'default') => {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api/images/fallback'
    : '/api/images/fallback';
  
  return `${baseUrl}/${category}`;
};

/**
 * Get optimized image props for React components
 * @param {object} item - Pet or product object
 * @param {string} size - Image size (not used currently, for future optimization)
 * @returns {object} Image props including src, alt, and error handling
 */
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.fallback,
      alt: 'Content unavailable',
      onError: () => {},
      onLoad: () => {}
    };
  }

  // Determine if this is a product or pet
  const isProduct = item.price !== undefined || 
                   (item.category && 
                    ['Dog Care', 'Cat Care', 'Grooming', 'Training', 'Aquarium'].some(cat => 
                      item.category.includes(cat)
                    ));
  
  const category = isProduct ? 'product' : 'pet';
  
  // Priority: imageUrl > image field through proxy > fallback
  let imageSrc;
  if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
    imageSrc = item.imageUrl;
  } else if (item.image) {
    imageSrc = getGoogleStorageUrl(item.image, category);
  } else {
    imageSrc = DEFAULT_IMAGES[category];
  }
  
  const altText = isProduct 
    ? `${item.name || 'Product'} - ${item.category || 'Pet Store Item'}`
    : `${item.name || 'Pet'} - ${item.breed || ''} ${item.type || ''}`.trim();

  return {
    src: imageSrc,
    alt: altText,
    onError: (e) => {
      // Simple one-time fallback to prevent infinite loops
      if (!e.target.dataset.fallbackAttempted) {
        e.target.dataset.fallbackAttempted = 'true';
        e.target.src = DEFAULT_IMAGES[category];
        console.warn(`Image failed: ${imageSrc}, using fallback`);
      }
    },
    onLoad: (e) => {
      // Clear fallback flag on successful load
      delete e.target?.dataset?.fallbackAttempted;
    }
  };
};

/**
 * Get optimized image props with lazy loading
 * @param {string} imagePath - Path to image
 * @param {string} alt - Alt text
 * @param {string} size - Size modifier (for future use)
 * @param {string} category - Image category
 * @param {boolean} lazy - Enable lazy loading
 * @returns {object} Complete image props
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const imageUrl = getGoogleStorageUrl(imagePath, category);
  
  return {
    src: imageUrl,
    alt: alt || 'Content',
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
    onError: (e) => {
      if (!e.target.dataset.fallbackAttempted) {
        e.target.dataset.fallbackAttempted = 'true';
        e.target.src = DEFAULT_IMAGES[category];
      }
    },
    onLoad: (e) => {
      delete e.target?.dataset?.fallbackAttempted;
    }
  };
};

/**
 * Validate if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} True if image loads successfully
 */
export const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000); // 5 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
};

/**
 * Configuration object for easy access
 */
export const imageConfig = {
  bucketName: BUCKET_NAME,
  proxyBaseUrl: getProxyBaseUrl(),
  fallbackBaseUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api/images/fallback'
    : '/api/images/fallback',
  defaults: DEFAULT_IMAGES,
  useProxy: true
};

// Default export with all utilities
export default {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getFallbackImageUrl,
  validateImageUrl,
  imageConfig
};