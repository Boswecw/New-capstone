// client/src/utils/imageUtils.js - UPDATED WITH BACKEND PROXY CORS WORKAROUND

/**
 * Backend API configuration for image proxy
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://furbabies-backend.onrender.com/api';

/**
 * Google Cloud Storage configuration (for reference)
 */
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

/**
 * Default fallback images based on content type
 */
const DEFAULT_IMAGES = {
  pet: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+Pet',
  product: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=🛍️+Product',
  brand: 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=🏢+Brand',
  user: 'https://via.placeholder.com/300x300/3498DB/FFFFFF?text=👤+User',
};

/**
 * Get image URL using backend proxy to avoid CORS issues
 * @param {string} imagePath - Image path from database (e.g., "pet/cat.png")
 * @param {string} size - Size preset (unused for now, for future optimization)
 * @param {string} category - Category for fallback selection
 * @returns {string} Complete image URL through backend proxy
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  // Handle invalid input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.warn('🖼️ Invalid image path, using fallback:', category);
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  // Return complete URLs as-is (already processed imageUrl from backend)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean relative paths and construct backend proxy URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  
  // Use backend proxy to avoid CORS issues with Google Cloud Storage
  const proxyUrl = `${API_BASE_URL}/images/${cleanPath}`;
  
  console.log(`🖼️ Image proxy URL: ${cleanPath} → ${proxyUrl}`);
  return proxyUrl;
};

/**
 * Get optimized image props for React components with enhanced error handling
 * @param {string} imagePath - Image path or full URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} size - Size preset
 * @param {string} category - Category for fallback
 * @param {boolean} lazy - Enable lazy loading
 * @returns {object} Complete image props with error handling
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  const baseProps = {
    src: imageUrl,
    alt: alt || `${category} image`,
    onError: (e) => {
      const currentSrc = e.target.src;
      
      // Only try fallback once to prevent infinite loops
      if (!e.target.hasTriedFallback && !currentSrc.includes('placeholder')) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        
        console.warn(`🖼️ Image failed to load: ${currentSrc}`);
        console.warn(`🖼️ Using fallback: ${fallbackUrl}`);
        
        e.target.src = fallbackUrl;
        
        // Track failed images for debugging
        if (window.failedImages) {
          window.failedImages.push(currentSrc);
        } else {
          window.failedImages = [currentSrc];
        }
      }
    },
    onLoad: (e) => {
      if (e && e.target) {
        delete e.target.hasTriedFallback;
        console.log(`✅ Image loaded successfully: ${e.target.src}`);
      }
    },
  };
  
  // Add lazy loading attributes if requested
  if (lazy) {
    baseProps.loading = 'lazy';
    baseProps.decoding = 'async';
  }
  
  return baseProps;
};

/**
 * Get card-specific image props with consistent styling
 * @param {string} imagePath - Image path
 * @param {string} alt - Alt text
 * @param {string} category - Category for fallback
 * @returns {object} Image props optimized for cards
 */
export const getCardImageProps = (imagePath, alt, category = 'pet') => {
  const props = getOptimizedImageProps(imagePath, alt, 'medium', category, true);
  
  return {
    ...props,
    style: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '8px'
    }
  };
};

/**
 * Get CSS background image properties
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
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors' // This should work now with backend proxy
    });
    
    return {
      url,
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
      corsHeaders: {
        origin: response.headers.get('access-control-allow-origin'),
        methods: response.headers.get('access-control-allow-methods')
      }
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message,
      isCorsError: error.message.includes('CORS')
    };
  }
};

/**
 * Test direct Google Cloud Storage access (for debugging)
 * @param {string} imagePath - Image path to test
 * @returns {Promise<object>} Test result
 */
export const testDirectBucketAccess = async (imagePath) => {
  const directUrl = `${BUCKET_BASE_URL}/${imagePath}`;
  
  try {
    const response = await fetch(directUrl, { method: 'HEAD' });
    return {
      directUrl,
      accessible: response.ok,
      status: response.status,
      corsBlocked: false
    };
  } catch (error) {
    return {
      directUrl,
      accessible: false,
      corsBlocked: error.message.includes('CORS'),
      error: error.message
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
    const lowerPath = imagePath.toLowerCase();
    if (lowerPath.includes('product')) {
      category = 'product';
    } else if (lowerPath.includes('brand')) {
      category = 'brand';
    } else if (lowerPath.includes('user') || lowerPath.includes('avatar')) {
      category = 'user';
    }
  }
  
  return getGoogleStorageUrl(imagePath, size, category);
};

/**
 * Debug function to check image loading issues
 * @returns {object} Debug information
 */
export const getImageDebugInfo = () => {
  return {
    apiBaseUrl: API_BASE_URL,
    bucketName: BUCKET_NAME,
    bucketBaseUrl: BUCKET_BASE_URL,
    proxyEnabled: true,
    failedImages: window.failedImages || [],
    defaultImages: DEFAULT_IMAGES,
    corsWorkaround: 'Backend Proxy',
    timestamp: new Date().toISOString()
  };
};

/**
 * Configuration object for external access
 */
export const imageConfig = {
  apiBaseUrl: API_BASE_URL,
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  defaults: DEFAULT_IMAGES,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  maxFileSize: '10MB',
  corsWorkaround: 'Backend Proxy',
  folders: {
    pets: 'pet',
    products: 'product', 
    brands: 'brand',
    users: 'user'
  }
};

/**
 * Main export object for named imports
 */
const imageUtils = {
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getCardImageProps,
  getOptimizedBackgroundImage,
  testImageUrl,
  testDirectBucketAccess,
  getImageUrl,
  getImageDebugInfo,
  imageConfig,
};

export default imageUtils;