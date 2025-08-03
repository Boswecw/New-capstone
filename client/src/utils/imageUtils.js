// client/src/utils/imageUtils.js - CORRECTED for furbabies-petstore GCS structure

const BUCKET_NAME = 'furbabies-petstore';
const GCS_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Fallback images that work
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  chinchilla: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

/**
 * Get proxy base URL for CORS handling
 */
const getProxyBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://furbabies-backend.onrender.com/api/images/gcs';
  }
  return 'http://localhost:5000/api/images/gcs';
};

/**
 * Clean image path - remove leading slashes, fix double slashes
 * @param {string} imagePath - Original image path
 * @returns {string} Cleaned image path
 */
const cleanImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }
  
  return imagePath.trim()
    .replace(/^\/+/, '')    // Remove leading slashes
    .replace(/\/+/g, '/');  // Fix double slashes
};

/**
 * Build Google Cloud Storage URL directly
 * This works if CORS is properly configured on the bucket
 * @param {string} imagePath - Path like "pet/betas-fish.jpg"
 * @returns {string} Full GCS URL
 */
export const getGoogleStorageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES.default;
  }

  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return DEFAULT_IMAGES.default;
  }

  // Build direct GCS URL
  const gcsUrl = `${GCS_BASE_URL}/${cleanPath}`;
  console.log('🖼️ Building GCS URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: gcsUrl
  });

  return gcsUrl;
};

/**
 * Build image URL using proxy (for CORS handling)
 * @param {string} imagePath - Path like "pet/betas-fish.jpg"
 * @returns {string} Proxy URL
 */
export const getProxyImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES.default;
  }

  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return DEFAULT_IMAGES.default;
  }

  // Split path into category and filename for proxy route
  // Format: /api/images/gcs/pet/betas-fish.jpg
  const proxyUrl = `${getProxyBaseUrl()}/${cleanPath}`;
  
  console.log('🔧 Building Proxy URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: proxyUrl
  });

  return proxyUrl;
};

/**
 * Get image props for a pet/product item
 * Handles both direct GCS and proxy URLs with fallbacks
 * @param {object} item - Pet or product object
 * @param {boolean} useProxy - Whether to use proxy (default: false for direct GCS)
 * @returns {object} Image props for SafeImage component
 */
export const getImageProps = (item, useProxy = false) => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.default,
      alt: 'Image not available'
    };
  }

  // Determine category for fallback
  let category = 'default';
  if (item.type) {
    category = item.type.toLowerCase(); // dog, cat, fish, etc.
  } else if (item.category) {
    category = item.category.toLowerCase().includes('dog') ? 'dog' :
               item.category.toLowerCase().includes('cat') ? 'cat' :
               item.category.toLowerCase().includes('fish') ? 'fish' : 'product';
  }

  // Get image path from various possible fields
  const imagePath = item.imageUrl || item.image || item.imagePath || item.photo || '';

  // Build the URL
  const imageUrl = useProxy ? getProxyImageUrl(imagePath) : getGoogleStorageUrl(imagePath);

  return {
    src: imageUrl,
    alt: item.name || item.title || 'Pet image',
    fallbackType: category,
    onError: (e) => {
      console.warn(`❌ Image load error for ${item.name}:`, imagePath);
      console.warn('🔄 SafeImage will handle fallback');
    },
    onLoad: () => {
      console.log(`✅ Image loaded successfully for ${item.name}`);
    }
  };
};

/**
 * Get optimized image URL with parameters (for future CDN integration)
 * @param {string} imagePath - Base image path
 * @param {object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, options = {}) => {
  const baseUrl = getGoogleStorageUrl(imagePath);
  
  // For now, return base URL
  // In the future, could add query params for CDN optimization
  if (!options.width && !options.height && !options.quality) {
    return baseUrl;
  }

  // Could implement CDN optimization here
  return baseUrl;
};

/**
 * Validate if an image path looks valid
 * @param {string} imagePath - Image path to validate
 * @returns {boolean} Whether path appears valid
 */
export const isValidImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return false;
  }

  const cleanPath = cleanImagePath(imagePath);
  
  // Should have category/filename format
  const parts = cleanPath.split('/');
  if (parts.length < 2) {
    return false;
  }

  // Should have valid extension
  const filename = parts[parts.length - 1];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = validExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );

  return hasValidExtension;
};

/**
 * Get fallback image for a specific type
 * @param {string} type - Image type (pet, dog, cat, fish, etc.)
 * @returns {string} Fallback image URL
 */
export const getFallbackImage = (type = 'default') => {
  return DEFAULT_IMAGES[type.toLowerCase()] || DEFAULT_IMAGES.default;
};

// Export utilities object
const imageUtils = {
  getGoogleStorageUrl,
  getProxyImageUrl,
  getImageProps,
  getOptimizedImageUrl,
  isValidImagePath,
  getFallbackImage,
  cleanImagePath,
  DEFAULT_IMAGES,
  BUCKET_NAME,
  GCS_BASE_URL
};

export default imageUtils;