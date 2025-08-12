// client/src/utils/imageUtils.js - FIXED VERSION (NO URL ENCODING)
const BUCKET_NAME = 'furbabies-petstore';
const GCS_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Enhanced fallback images for both pets and products
const FALLBACK_IMAGES = {
  // Pet fallbacks
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  
  // Product fallbacks - category specific
  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&q=80&auto=format',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  'aquarium & fish care': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80&auto=format',
  'grooming & health': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  'training & behavior': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  
  // Generic fallbacks
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  other: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

/**
 * Clean image path - remove prefixes and normalize
 */
export const cleanImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  
  let cleanPath = imagePath.trim();
  
  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Remove 'images/' prefix if present
  cleanPath = cleanPath.replace(/^images\//, '');
  
  // Remove bucket name if accidentally included
  cleanPath = cleanPath.replace(/^furbabies-petstore\//, '');
  
  return cleanPath;
};

/**
 * Get fallback image based on category/type
 */
export const getFallbackImage = (category = null, type = null) => {
  // Try to match by type first (for pets)
  if (type && FALLBACK_IMAGES[type.toLowerCase()]) {
    return FALLBACK_IMAGES[type.toLowerCase()];
  }
  
  // Then try by category (for products)
  if (category && FALLBACK_IMAGES[category.toLowerCase()]) {
    return FALLBACK_IMAGES[category.toLowerCase()];
  }
  
  // Default fallback
  return FALLBACK_IMAGES.default;
};

/**
 * 🚨 CRITICAL FIX: Build direct GCS URL (NO ENCODING!)
 */
export const getImageUrl = (imagePath, category = null, type = null) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return getFallbackImage(category, type);
  }

  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(category, type);
  }

  // ✅ CRITICAL FIX: Don't encode the path - just build URL properly
  const gcsUrl = `${GCS_BASE_URL}/${cleanPath}`;
  
  console.log('🖼️ Building GCS URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: gcsUrl
  });

  return gcsUrl;
};

/**
 * 🚨 CRITICAL FIX: Build proxy URL (NO ENCODING!)
 */
export const getProxyImageUrl = (imagePath, category = null, type = null) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return getFallbackImage(category, type);
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(category, type);
  }

  const getProxyBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_IMAGE_PROXY_URL || 
             (process.env.REACT_APP_API_URL?.replace('/api', '') + '/api/images/gcs') ||
             'https://new-capstone.onrender.com/api/images/gcs';
    }
    return 'http://localhost:5000/api/images/gcs';
  };

  // ✅ CRITICAL FIX: Don't encode the path
  const proxyUrl = `${getProxyBaseUrl()}/${cleanPath}`;
  
  console.log('🛡️ Building proxy URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: proxyUrl
  });

  return proxyUrl;
};

/**
 * Check if an image URL is accessible
 */
export const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 10 seconds
    setTimeout(() => resolve(false), 10000);
  });
};

/**
 * Get best available image URL with fallback chain
 */
export const getBestImageUrl = async (imagePath, category = null, type = null) => {
  // Try direct GCS URL first
  const gcsUrl = getImageUrl(imagePath, category, type);
  const gcsWorks = await validateImageUrl(gcsUrl);
  if (gcsWorks) {
    console.log('✅ Direct GCS URL works:', gcsUrl);
    return gcsUrl;
  }

  // Try proxy URL
  const proxyUrl = getProxyImageUrl(imagePath, category, type);
  const proxyWorks = await validateImageUrl(proxyUrl);
  if (proxyWorks) {
    console.log('✅ Proxy URL works:', proxyUrl);
    return proxyUrl;
  }

  // Return fallback
  const fallbackUrl = getFallbackImage(category, type);
  console.log('🔄 Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

/**
 * Preload images for better performance
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

// Default export with all utilities
const imageUtils = {
  getImageUrl,
  getProxyImageUrl,
  getBestImageUrl,
  validateImageUrl,
  preloadImages,
  cleanImagePath,
  getFallbackImage,
  FALLBACK_IMAGES
};

export default imageUtils;