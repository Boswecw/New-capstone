// client/src/utils/imageUtils.js - FIXED FOR BACKEND PROXY

/**
 * Backend API configuration - CRITICAL FOR CORS WORKAROUND
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://furbabies-backend.onrender.com/api';

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
 * Get image URL through backend proxy - ONLY WAY TO AVOID CORS
 * @param {string} imagePath - Image path from database (e.g., "pet/cat.png")
 * @param {string} size - Size preset (unused for now)
 * @param {string} category - Category for fallback selection
 * @returns {string} Backend proxy URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  console.log(`🖼️ getGoogleStorageUrl called with:`, { imagePath, size, category });
  
  // Handle invalid/empty input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.warn('🖼️ Invalid image path, using fallback:', category);
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  // If it's already a complete URL, check if it's our backend proxy
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If it's already our backend proxy URL, return as-is
    if (imagePath.includes(`${API_BASE_URL}/images/`)) {
      console.log(`🖼️ Already backend proxy URL:`, imagePath);
      return imagePath;
    }
    
    // If it's a direct Google Cloud Storage URL, extract the path and route through backend
    if (imagePath.includes('storage.googleapis.com/furbabies-petstore/')) {
      const pathMatch = imagePath.match(/furbabies-petstore\/(.+)$/);
      if (pathMatch) {
        const extractedPath = pathMatch[1];
        const proxyUrl = `${API_BASE_URL}/images/${extractedPath}`;
        console.log(`🖼️ Converting GCS URL to proxy:`, { original: imagePath, proxy: proxyUrl });
        return proxyUrl;
      }
    }
    
    // For any other complete URL, return as fallback
    console.warn('🖼️ Unknown URL format, using fallback:', imagePath);
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  // Clean relative paths and construct backend proxy URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  const proxyUrl = `${API_BASE_URL}/images/${cleanPath}`;
  
  console.log(`🖼️ Backend proxy URL created:`, { imagePath, cleanPath, proxyUrl });
  return proxyUrl;
};

/**
 * Get optimized image props for React components
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
      
      console.warn(`🖼️ Image failed to load: ${currentSrc}`);
      
      // Only try fallback once to prevent infinite loops
      if (!e.target.hasTriedFallback && !currentSrc.includes('placeholder')) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        
        console.warn(`🖼️ Using fallback image: ${fallbackUrl}`);
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
  
  console.log(`🖼️ Image props created:`, { imagePath, imageUrl, alt, category });
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
 * Test if image URL is accessible through backend proxy
 * @param {string} imagePath - Image path to test
 * @param {string} category - Category for fallback
 * @returns {Promise<object>} Test result with accessibility info
 */
export const testImageUrl = async (imagePath, category = 'pet') => {
  const url = getGoogleStorageUrl(imagePath, 'medium', category);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
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
      },
      proxyWorking: true
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message,
      isCorsError: error.message.includes('CORS'),
      proxyWorking: false
    };
  }
};

/**
 * Legacy compatibility function
 * @param {string} imagePath - Image path
 * @param {string} size - Size preset
 * @returns {string} Image URL through backend proxy
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
 * Debug function to check image configuration
 * @returns {object} Debug information
 */
export const getImageDebugInfo = () => {
  return {
    apiBaseUrl: API_BASE_URL,
    proxyEndpoint: `${API_BASE_URL}/images/`,
    corsWorkaround: 'Backend Proxy (Required for free Google Cloud Storage)',
    defaultImages: DEFAULT_IMAGES,
    failedImages: window.failedImages || [],
    testUrls: {
      samplePetImage: `${API_BASE_URL}/images/pet/hedge-hog-A.jpg`,
      sampleProductImage: `${API_BASE_URL}/images/product/covered-litter-box.png`
    },
    instructions: 'All images MUST go through backend proxy to avoid CORS issues',
    timestamp: new Date().toISOString()
  };
};

/**
 * Force backend proxy for any URL (utility function)
 * @param {string} anyImageUrl - Any image URL
 * @returns {string} Backend proxy URL
 */
export const forceBackendProxy = (anyImageUrl) => {
  if (!anyImageUrl) return DEFAULT_IMAGES.pet;
  
  // If already backend proxy, return as-is
  if (anyImageUrl.includes(`${API_BASE_URL}/images/`)) {
    return anyImageUrl;
  }
  
  // Extract path from Google Cloud Storage URL
  if (anyImageUrl.includes('storage.googleapis.com/furbabies-petstore/')) {
    const pathMatch = anyImageUrl.match(/furbabies-petstore\/(.+)$/);
    if (pathMatch) {
      return `${API_BASE_URL}/images/${pathMatch[1]}`;
    }
  }
  
  // If it looks like a relative path, use it directly
  if (!anyImageUrl.startsWith('http')) {
    const cleanPath = anyImageUrl.replace(/^\/+/, '');
    return `${API_BASE_URL}/images/${cleanPath}`;
  }
  
  // Fallback
  return DEFAULT_IMAGES.pet;
};

/**
 * Configuration object for external access
 */
export const imageConfig = {
  apiBaseUrl: API_BASE_URL,
  proxyEndpoint: `${API_BASE_URL}/images/`,
  bucketName: 'furbabies-petstore',
  corsWorkaround: 'Backend Proxy',
  defaults: DEFAULT_IMAGES,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  maxFileSize: '10MB',
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
  getImageUrl,
  getImageDebugInfo,
  forceBackendProxy,
  imageConfig,
};

export default imageUtils;