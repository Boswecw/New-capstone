// client/src/utils/imageUtils.js - FIXED VERSION (Syntax Error Resolved)

// ===== CONSTANTS =====
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Default fallback images for each category
const DEFAULT_IMAGES = {
  pet: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+Pet',
  product: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=🛍️+Product',
  brand: 'https://via.placeholder.com/200x100/FFE66D/333333?text=Brand',
  user: 'https://via.placeholder.com/150x150/95E1D3/333333?text=👤+User'
};

// Size configurations for different use cases
const SIZE_CONFIGS = {
  thumbnail: { maxWidth: 150, maxHeight: 150 },
  small: { maxWidth: 250, maxHeight: 250 },
  medium: { maxWidth: 400, maxHeight: 400 },
  large: { maxWidth: 800, maxHeight: 600 },
  hero: { maxWidth: 1200, maxHeight: 800 }
};

/**
 * Smart URL builder for Google Cloud Storage images
 * Handles both raw database paths and pre-constructed URLs
 * @param {string} imagePath - Can be either "pet/image.jpg" or full URL
 * @param {string} size - Size preset for future optimization
 * @param {string} category - Category for fallback selection
 * @returns {string} Optimized image URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  // Return fallback for invalid input
  if (!imagePath || typeof imagePath !== 'string') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }

  // If already a full URL, return as-is (backend-constructed URLs)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Handle base64 data URLs
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Handle blob URLs (temporary local URLs)
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Construct Google Cloud Storage URL from database path
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Construct the full URL
  const fullUrl = `${BUCKET_BASE_URL}/${cleanPath}`;
  
  // Future: Add size optimization parameters here
  // const sizeConfig = SIZE_CONFIGS[size];
  // if (sizeConfig) {
  //   return `${fullUrl}?w=${sizeConfig.maxWidth}&h=${sizeConfig.maxHeight}&fit=crop`;
  // }
  
  return fullUrl;
};

/**
 * Enhanced image props generator with performance optimizations
 * @param {string} imagePath - Image path or URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} size - Size preset
 * @param {string} category - Category for fallback
 * @param {boolean} lazy - Enable lazy loading
 * @returns {object} Complete image props for React components
 */
export const getOptimizedImageProps = (imagePath, alt = '', size = 'medium', category = 'pet', lazy = true) => {
  const src = getGoogleStorageUrl(imagePath, size, category);
  
  const baseProps = {
    src,
    alt: alt || `${category} image`,
    onError: (e) => {
      // Fallback chain: try default for category, then generic pet image
      if (!e.target.src.includes('placeholder')) {
        e.target.src = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
      }
    }
  };

  // FIXED: Complete the if statement that was causing the syntax error
  if (lazy) {
    baseProps.loading = 'lazy';
    baseProps.decoding = 'async';
  }
  
  return baseProps;
};

/**
 * Smart utility for card components (pets and products)
 * FIXED: Prioritizes backend-constructed URLs over raw database paths
 * @param {object} item - Pet or product object from API
 * @param {string} size - Size preset
 * @returns {object} Complete image props ready for React components
 */
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.pet,
      alt: 'Content unavailable',
      loading: 'lazy'
    };
  }

  // 🚀 KEY FIX: Prioritize backend-constructed imageUrl over raw image path
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
  
  return getOptimizedImageProps(imagePath, alt, size, category, true);
};

/**
 * Background image CSS generator for hero sections, banners, etc.
 * @param {string} imagePath - Image path or full URL
 * @param {string} size - Size preset (for future optimization)
 * @param {string} category - Category for fallback
 * @returns {object} CSS properties for background images
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
 * Legacy compatibility function
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
 * Main export object for named imports
 */
const imageUtils = {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getOptimizedBackgroundImage,
  testImageUrl,
  getImageUrl,
  imageConfig,
};

export default imageUtils;