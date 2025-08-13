// client/src/utils/imageUtils.js - FIXED VERSION (NO URL ENCODING)
const BUCKET_NAME = 'furbabies-petstore';
const GCS_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Enhanced fallback images for both pets and products
const FALLBACK_IMAGES = {
  // Pet fallbacks by type
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  hamster: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format',
  'small-pet': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format',
  other: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  
  // Product fallbacks by category
  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&q=80&auto=format',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  'aquarium & fish care': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80&auto=format',
  'grooming & health': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  'training & behavior': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  
  // Generic fallbacks
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
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

  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(category, type);
  }

  // ✅ FIXED: No encoding for proxy path either
  const proxyUrl = `/api/images/gcs/${cleanPath}`;
  
  console.log('🔄 Building proxy URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: proxyUrl
  });

  return proxyUrl;
};

/**
 * Validate if an image URL is accessible
 */
export const validateImageUrl = async (url) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('🖼️ Image validation failed:', url, error);
    return false;
  }
};

/**
 * Get optimized image URL with size parameters
 */
export const getOptimizedImageUrl = (imagePath, size = 'medium', category = null, type = null) => {
  const baseUrl = getImageUrl(imagePath, category, type);
  
  if (!baseUrl || baseUrl.includes('unsplash.com')) {
    // Already optimized or fallback
    return baseUrl;
  }
  
  // Add size optimization for GCS images if needed
  const sizeParams = {
    small: '?w=200&h=150',
    medium: '?w=400&h=300', 
    large: '?w=800&h=600',
    xl: '?w=1200&h=900'
  };
  
  return baseUrl + (sizeParams[size] || '');
};

/**
 * Extract file extension from image path
 */
export const getImageExtension = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  
  const cleanPath = cleanImagePath(imagePath);
  const parts = cleanPath.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Check if image format is supported
 */
export const isSupportedImageFormat = (imagePath) => {
  const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'];
  const extension = getImageExtension(imagePath);
  return supportedFormats.includes(extension);
};

/**
 * Generate image alt text from item data
 */
export const generateAltText = (item, fallback = 'Image') => {
  if (!item) return fallback;
  
  const name = item.name || item.title || '';
  const type = item.type || item.category || '';
  
  if (name && type) {
    return `${name} - ${type}`;
  }
  
  return name || type || fallback;
};

// Default export object for easier importing
const imageUtilsDefault = {
  getImageUrl,
  getProxyImageUrl,
  getFallbackImage,
  cleanImagePath,
  validateImageUrl,
  getOptimizedImageUrl,
  generateAltText,
  isSupportedImageFormat
};

export default imageUtilsDefault;