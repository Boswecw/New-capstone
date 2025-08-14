// client/src/utils/imageUtils.js - SINGLE CONSOLIDATED IMAGE UTILITY
// This replaces ALL other image utilities in the project

const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// ===== FALLBACK IMAGES =====
const FALLBACK_IMAGES = {
  // Pet fallbacks by type
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  
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

// ===== BUCKET FOLDER STRUCTURE =====
const BUCKET_FOLDERS = {
  pet: 'pet',
  product: 'product', 
  user: 'user',
  admin: 'admin',
  temp: 'temp'
};

// ===== CORE FUNCTIONS =====

/**
 * Clean image path - remove leading slashes, spaces, invalid characters
 * @param {string} imagePath - Raw image path
 * @returns {string} Clean path or empty string
 */
const cleanImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  
  return imagePath
    .trim()
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9.\-_/]/g, '') // Keep only safe characters
    .toLowerCase();
};

/**
 * Get fallback image URL by entity type and category
 * @param {string} entityType - pet, product, user, etc.
 * @param {string} category - specific category for better fallbacks
 * @returns {string} Fallback image URL
 */
const getFallbackImage = (entityType = 'default', category = null) => {
  // Try category first, then entity type, then default
  const key = category || entityType || 'default';
  return FALLBACK_IMAGES[key.toLowerCase()] || FALLBACK_IMAGES.default;
};

/**
 * MAIN IMAGE URL FUNCTION - Direct GCS URL (FIXED - No encoding)
 * @param {string} imagePath - Path to image in bucket
 * @param {string} entityType - pet, product, etc. (for fallbacks)
 * @param {string} category - specific category (for better fallbacks)
 * @returns {string} Complete image URL
 */
export const getImageUrl = (imagePath, entityType = 'default', category = null) => {
  // Return fallback if no path
  if (!imagePath) {
    return getFallbackImage(entityType, category);
  }

  // If already a complete URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Clean the path
  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(entityType, category);
  }

  // ✅ FIXED: Build direct GCS URL WITHOUT encodeURIComponent
  const directUrl = `${BUCKET_BASE_URL}/${cleanPath}`;
  
  console.log('🖼️ Image URL built:', {
    input: imagePath,
    cleaned: cleanPath,
    final: directUrl,
    entityType,
    category
  });

  return directUrl;
};

/**
 * Get proxy URL through your API (alternative to direct GCS)
 * @param {string} imagePath - Path to image in bucket
 * @param {string} entityType - For fallbacks
 * @param {string} category - For better fallbacks
 * @returns {string} Proxy URL or fallback
 */
export const getProxyImageUrl = (imagePath, entityType = 'default', category = null) => {
  if (!imagePath) {
    return getFallbackImage(entityType, category);
  }

  // If already a complete URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(entityType, category);
  }

  // ✅ FIXED: Build proxy URL without encoding
  const proxyUrl = `/api/images/gcs/${cleanPath}`;
  
  console.log('🔄 Proxy URL built:', {
    input: imagePath,
    cleaned: cleanPath,
    final: proxyUrl
  });

  return proxyUrl;
};

/**
 * Legacy support - maps to getProxyImageUrl
 * @param {string} src - Image source
 * @returns {string} Normalized URL or null
 */
export const normalizeImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/api/images')) return src;
  
  // Use proxy URL for relative paths
  return getProxyImageUrl(src);
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate a file path for uploading to bucket
 * @param {string} folder - Bucket folder (pet, product, etc.)
 * @param {string} entityId - ID of the entity
 * @param {string} originalFileName - Original file name
 * @returns {string} Generated file path
 */
export const generateFilePath = (folder, entityId, originalFileName) => {
  const timestamp = Date.now();
  const extension = originalFileName.split('.').pop();
  const baseName = originalFileName.replace(/\.[^/.]+$/, "");
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return `${folder}/${entityId}_${timestamp}_${sanitizedBaseName}.${extension}`;
};

/**
 * Extract folder from file path
 * @param {string} filePath - Full file path
 * @returns {string} Folder name
 */
export const getFolderFromPath = (filePath) => {
  if (!filePath) return '';
  return filePath.split('/')[0];
};

/**
 * Extract filename from file path
 * @param {string} filePath - Full file path
 * @returns {string} File name only
 */
export const getFileNameFromPath = (filePath) => {
  if (!filePath) return '';
  return filePath.split('/').pop();
};

/**
 * Validate if file is an image
 * @param {File} file - File object
 * @returns {boolean} Is valid image
 */
export const isValidImage = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate file size (default 10MB)
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Is valid size
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Find best matching image from array
 * @param {Array} images - Array of image objects
 * @param {Array} searchTerms - Terms to search for
 * @param {string} entityType - For fallbacks
 * @param {string} category - For better fallbacks  
 * @returns {string} Best matching image URL or fallback
 */
export const findBestMatchingImage = (images, searchTerms = [], entityType = 'default', category = null) => {
  if (!images || images.length === 0) {
    return getFallbackImage(entityType, category);
  }

  // Look for images that match the search terms
  const matchingImage = images.find(image => {
    const fileName = (image.fileName || image.name || '').toLowerCase();
    return searchTerms.some(term => 
      fileName.includes(term.toLowerCase())
    );
  });

  if (matchingImage) {
    return getImageUrl(matchingImage.name || matchingImage.fileName, entityType, category);
  }

  // Return first available image
  const firstImage = images[0];
  return firstImage ? 
    getImageUrl(firstImage.name || firstImage.fileName, entityType, category) :
    getFallbackImage(entityType, category);
};

/**
 * Get optimized image URL with size parameters
 * @param {string} imagePath - Original image path
 * @param {string} size - Size (small, medium, large, xl)
 * @param {string} entityType - For fallbacks
 * @param {string} category - For better fallbacks
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, size = 'medium', entityType = 'default', category = null) => {
  const baseUrl = getImageUrl(imagePath, entityType, category);
  
  // If it's already a fallback (Unsplash), return as-is
  if (!baseUrl || baseUrl.includes('unsplash.com')) {
    return baseUrl;
  }
  
  // For future: add size optimization parameters
  const sizeParams = {
    small: '?w=200&h=150',
    medium: '?w=400&h=300', 
    large: '?w=800&h=600',
    xl: '?w=1200&h=900'
  };
  
  return baseUrl + (sizeParams[size] || '');
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate alt text from item data
 * @param {object} item - Pet, product, etc.
 * @param {string} fallback - Default alt text
 * @returns {string} Generated alt text
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

/**
 * Validate if an image URL is accessible
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} Whether URL is accessible
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

// ===== CONFIGURATION =====
export const bucketConfig = {
  name: BUCKET_NAME,
  baseUrl: BUCKET_BASE_URL,
  folders: BUCKET_FOLDERS,
  maxFileSize: 10, // MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

// ===== DEFAULT EXPORT =====
const imageUtils = {
  // Main functions
  getImageUrl,
  getProxyImageUrl, 
  normalizeImageUrl,
  
  // Utilities
  getFallbackImage,
  generateFilePath,
  getFolderFromPath,
  getFileNameFromPath,
  findBestMatchingImage,
  getOptimizedImageUrl,
  generateAltText,
  
  // Validation
  isValidImage,
  isValidFileSize,
  validateImageUrl,
  
  // Helpers
  formatFileSize,
  
  // Config
  bucketConfig,
  BUCKET_FOLDERS
};

export default imageUtils;