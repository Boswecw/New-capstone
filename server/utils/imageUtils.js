// server/utils/imageUtils.js - FIXED VERSION (NO URL ENCODING)

// Public base URL for your GCS bucket (no trailing slash)
const BASE_URL = 'https://storage.googleapis.com/furbabies-petstore';
const BUCKET_NAME = 'furbabies-petstore';

// Server-side fallback images (same as client-side for consistency)
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
 * Clean image path - remove prefixes and normalize (server version)
 */
function cleanImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return '';
  
  let cleanPath = imagePath.trim();
  
  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Remove 'images/' prefix if present
  cleanPath = cleanPath.replace(/^images\//, '');
  
  // Remove bucket name if accidentally included
  cleanPath = cleanPath.replace(/^furbabies-petstore\//, '');
  
  return cleanPath;
}

/**
 * Get fallback image based on category/type (server version)
 */
function getFallbackImage(category = null, type = null) {
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
}

/**
 * ✅ CRITICAL FIX: Build a public GCS URL from a stored image path (NO ENCODING!)
 * - Returns null if no path
 * - Returns as-is if already an http(s) URL
 * - Strips leading slashes, no encodeURIComponent (paths are already web-safe)
 * @param {string|null|undefined} imagePath
 * @returns {string|null}
 */
function getImageUrl(imagePath, category = null, type = null) {
  if (!imagePath) return getFallbackImage(category, type);
  if (typeof imagePath !== 'string') return getFallbackImage(category, type);
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) return getFallbackImage(category, type);
  
  // ✅ CRITICAL FIX: Direct concatenation - NO encodeURIComponent!
  const gcsUrl = `${BASE_URL}/${cleanPath}`;
  
  console.log('🖼️ Server: Building GCS URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: gcsUrl
  });
  
  return gcsUrl;
}

/**
 * ✅ FIXED: Build proxy URL through API (NO ENCODING!)
 */
function getProxyImageUrl(imagePath, category = null, type = null) {
  if (!imagePath) return getFallbackImage(category, type);
  if (typeof imagePath !== 'string') return getFallbackImage(category, type);
  
  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) return getFallbackImage(category, type);
  
  // ✅ No encoding for proxy path
  return `/api/images/gcs/${cleanPath}`;
}

/**
 * ✅ FIXED: Attach derived image URLs to a plain object (e.g., from doc.toObject()).
 * Adds:
 *  - imageUrl: resolved public URL (or fallback)
 *  - fallbackImageUrl: API fallback endpoint based on entityType
 * @param {object} item
 * @param {'pet'|'product'|'general'} [entityType='general']
 * @returns {object}
 */
function addImageFields(item, entityType = 'general') {
  if (!item || typeof item !== 'object') {
    return item;
  }

  // Extract potential image sources
  const imageSources = [
    item.image,
    item.imageUrl,
    item.photo,
    item.picture,
    Array.isArray(item.images) ? item.images[0] : null,
    Array.isArray(item.photos) ? item.photos[0] : null
  ];

  // Find first valid image source
  const src = imageSources.find(source => 
    source && typeof source === 'string' && source.trim() !== ''
  ) || null;

  // Determine fallback type
  let fallbackType = entityType;
  let fallbackCategory = null;
  
  if (item.type) {
    fallbackType = item.type;
  } else if (item.category) {
    fallbackCategory = item.category;
  }

  const imageUrl = getImageUrl(src, fallbackCategory, fallbackType);

  return {
    ...item,
    imageUrl,
    fallbackImageUrl: `/api/images/fallback/${entityType}`,
  };
}

/**
 * Generate pet-specific image with enhanced fields
 */
function addPetImageFields(pet) {
  if (!pet) return pet;
  
  const petObj = pet.toObject ? pet.toObject() : pet;
  return addImageFields(petObj, petObj.type || 'pet');
}

/**
 * Generate product-specific image with enhanced fields
 */
function addProductImageFields(product) {
  if (!product) return product;
  
  const productObj = product.toObject ? product.toObject() : product;
  return addImageFields(productObj, 'product');
}

/**
 * Validate image path format
 */
function isValidImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  
  // Check if it's already a valid URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return true;
  }
  
  // Check if it has a valid file extension
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const hasValidExtension = supportedExtensions.some(ext => 
    imagePath.toLowerCase().endsWith(ext)
  );
  
  return hasValidExtension;
}

/**
 * Generate image metadata for API responses
 */
function getImageMetadata(imagePath, entityType = 'general') {
  const cleanPath = cleanImagePath(imagePath);
  
  return {
    originalPath: imagePath,
    cleanPath,
    publicUrl: getImageUrl(imagePath),
    proxyUrl: getProxyImageUrl(imagePath),
    fallbackUrl: getFallbackImage(null, entityType),
    isValid: isValidImagePath(imagePath),
    extension: cleanPath ? cleanPath.split('.').pop()?.toLowerCase() : null
  };
}

// Export all functions for Node.js
module.exports = {
  // Core functions
  getImageUrl,
  getProxyImageUrl,
  addImageFields,
  
  // Entity-specific helpers
  addPetImageFields,
  addProductImageFields,
  
  // Utility functions
  cleanImagePath,
  getFallbackImage,
  isValidImagePath,
  getImageMetadata,
  
  // Constants
  BASE_URL,
  BUCKET_NAME,
  FALLBACK_IMAGES
};