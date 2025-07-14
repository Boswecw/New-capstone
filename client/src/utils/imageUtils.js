// client/src/utils/imageUtils.js - ENHANCED IMAGE UTILITY FUNCTIONS

// Google Cloud Storage configuration
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Default fallback images
const DEFAULT_IMAGES = {
  pet: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+Pet',
  product: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=🛍️+Product',
  brand: 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=🏢+Brand',
  general: 'https://via.placeholder.com/300x200/f5f5f5/999999?text=No+Image'
};

// Size configurations for different use cases
const SIZE_CONFIGS = {
  small: { width: 200, height: 150 },
  medium: { width: 400, height: 300 },
  large: { width: 800, height: 600 },
  hero: { width: 1200, height: 400 }
};

/**
 * Get Google Cloud Storage URL from image path (REQUIRED BY EXISTING CODE)
 * @param {string} imagePath - Image path from database (e.g., "pet/cat.png")
 * @param {string} size - Size preset (unused for now, for future optimization)
 * @param {string} category - Category for fallback selection
 * @returns {string} Complete image URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  // Handle invalid input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  // Return complete URLs as-is (from backend imageUrl field)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean relative paths and construct full GCS URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

/**
 * Get optimized image URL with Google Cloud Storage parameters
 * @param {string} originalUrl - Original image URL
 * @param {object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
  if (!originalUrl) return null;
  
  const {
    width = 400,
    height = 300,
    quality = 80,
    format = 'webp'
  } = options;
  
  // Use the getGoogleStorageUrl function for consistency
  const baseUrl = getGoogleStorageUrl(originalUrl);
  
  // If it's already a Google Cloud Storage URL with parameters, return as-is
  if (baseUrl && baseUrl.includes('?')) {
    return baseUrl;
  }
  
  // If it's a Google Cloud Storage URL, add optimization parameters
  if (baseUrl && baseUrl.includes('storage.googleapis.com')) {
    return `${baseUrl}?w=${width}&h=${height}&q=${quality}&fm=${format}&fit=cover`;
  }
  
  return baseUrl;
};

/**
 * Preload an image and return a promise
 * @param {string} src - Image source URL
 * @returns {Promise} Promise that resolves when image loads
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Validate if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} Promise that resolves to true if valid
 */
export const validateImageUrl = async (url) => {
  try {
    await preloadImage(url);
    return true;
  } catch (error) {
    console.warn(`Image validation failed for: ${url}`);
    return false;
  }
};

/**
 * Generate optimized image props for React components
 * @param {string} src - Image source
 * @param {string} alt - Alt text
 * @param {string} size - Size preset (small, medium, large, hero)
 * @param {string} category - Content category (pet, product, general)
 * @param {boolean} lazy - Whether to use lazy loading
 * @returns {object} Complete image props
 */
export const getOptimizedImageProps = (src, alt, size = 'medium', category = 'general', lazy = true) => {
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.medium;
  
  // Use getGoogleStorageUrl for consistent URL handling
  let optimizedSrc = getGoogleStorageUrl(src, size, category);
  
  // Add optimization parameters if it's a GCS URL
  if (optimizedSrc && optimizedSrc.includes('storage.googleapis.com') && !optimizedSrc.includes('?')) {
    optimizedSrc = getOptimizedImageUrl(optimizedSrc, sizeConfig);
  }
  
  const baseProps = {
    src: optimizedSrc,
    alt: alt || `${category} image`,
    width: sizeConfig.width,
    height: sizeConfig.height,
    style: {
      width: '100%',
      height: 'auto',
      maxWidth: `${sizeConfig.width}px`,
      maxHeight: `${sizeConfig.height}px`
    }
  };
  
  if (lazy) {
    baseProps.loading = 'lazy';
    baseProps.decoding = 'async';
  }
  
  return baseProps;
};

/**
 * Smart utility for card components (pets and products)
 * Prioritizes backend-constructed URLs over raw database paths
 * @param {object} item - Pet or product object from API
 * @param {string} size - Size preset
 * @returns {object} Complete image props ready for React components
 */
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.general,
      alt: 'Content unavailable',
      loading: 'lazy'
    };
  }

  // KEY FIX: Prioritize backend-constructed imageUrl over raw image path
  // Backend sends both:
  // - image: "pet/cat.png" (raw database path)
  // - imageUrl: "https://storage.googleapis.com/furbabies-petstore/pet/cat.png" (constructed URL)
  const imagePath = item.imageUrl || item.image || item.photo;
  
  // Determine content category for appropriate fallbacks
  const isProduct = item.price !== undefined || 
                   (item.category && typeof item.category === 'string' && 
                    (item.category.toLowerCase().includes('care') || 
                     item.category.toLowerCase().includes('training') ||
                     item.category.toLowerCase().includes('grooming') ||
                     item.category.toLowerCase().includes('aquarium')));
  
  const category = isProduct ? 'product' : 'pet';
  
  // Generate meaningful alt text
  let alt;
  if (category === 'pet') {
    const petName = item.name || '';
    const petBreed = item.breed || '';
    const petType = item.type || '';
    alt = [petName, petBreed, petType].filter(Boolean).join(', ') || 'Pet';
  } else {
    const productName = item.name || '';
    const productCategory = item.category || '';
    alt = [productName, productCategory].filter(Boolean).join(' - ') || 'Product';
  }
  
  // Use the centralized getGoogleStorageUrl function
  const src = getGoogleStorageUrl(imagePath, size, category);
  
  return {
    src,
    alt,
    loading: 'lazy'
  };
};

/**
 * Background image CSS generator for hero sections, banners, etc.
 * @param {string} src - Image source
 * @param {string} size - Size preset
 * @returns {object} CSS style object with background image
 */
export const getBackgroundImageStyle = (src, size = 'hero') => {
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.hero;
  const optimizedSrc = getOptimizedImageUrl(src, sizeConfig);
  
  return {
    backgroundImage: `url("${optimizedSrc}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: `${sizeConfig.height}px`
  };
};

/**
 * Generate srcSet for responsive images
 * @param {string} src - Base image source
 * @param {array} sizes - Array of size multipliers [1, 2, 3]
 * @returns {string} srcSet string for responsive images
 */
export const generateSrcSet = (src, sizes = [1, 2, 3]) => {
  const baseUrl = getGoogleStorageUrl(src);
  if (!baseUrl || !baseUrl.includes('storage.googleapis.com')) return '';
  
  return sizes
    .map(multiplier => {
      const url = `${baseUrl}?w=${400 * multiplier}&q=80&fm=webp`;
      return `${url} ${multiplier}x`;
    })
    .join(', ');
};

/**
 * Legacy compatibility function (for existing code)
 * @param {string} imagePath - Image path
 * @param {string} size - Size preset
 * @returns {string} Image URL
 */
export const getImageUrl = (imagePath, size = 'medium') => {
  // Detect category from path
  let category = 'pet';
  if (imagePath && typeof imagePath === 'string') {
    if (imagePath.toLowerCase().includes('product')) {
      category = 'product';
    } else if (imagePath.toLowerCase().includes('brand')) {
      category = 'brand';
    }
  }
  
  return getGoogleStorageUrl(imagePath, size, category);
};

/**
 * Test if image URL is accessible (useful for admin tools)
 * @param {string} imagePath - Image path to test
 * @param {string} category - Category for fallback
 * @returns {Promise<object>} Test result with accessibility info
 */
export const testImageUrl = async (imagePath, category = 'pet') => {
  const url = getGoogleStorageUrl(imagePath, 'medium', category);
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message,
    };
  }
};

/**
 * Check if image source is a valid URL
 * @param {string} src - Image source to check
 * @returns {boolean} True if valid URL
 */
export const isValidImageUrl = (src) => {
  if (!src || typeof src !== 'string') return false;
  
  try {
    const url = new URL(src);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
  } catch {
    return false;
  }
};

/**
 * Get image dimensions from URL if possible
 * @param {string} src - Image source URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (src) => {
  const imageUrl = getGoogleStorageUrl(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

/**
 * Configuration object for external access
 */
export const imageConfig = {
  defaults: DEFAULT_IMAGES,
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  maxFileSize: '10MB',
  folders: {
    pets: 'pet',
    products: 'product', 
    brands: 'brand'
  }
};

/**
 * Background image CSS generator with GCS support
 */
export const getOptimizedBackgroundImage = (imagePath, size = 'large', category = 'pet') => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
};

/**
 * Main export object for named imports (backwards compatibility)
 */
const imageUtils = {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getOptimizedBackgroundImage,
  getBackgroundImageStyle,
  testImageUrl,
  getImageUrl,
  imageConfig,
  getOptimizedImageUrl,
  preloadImage,
  validateImageUrl,
  generateSrcSet,
  isValidImageUrl,
  getImageDimensions
};

export default imageUtils;