// client/src/utils/bucketUtils.js
/**
 * Utilities for furbabies-petstore public bucket operations
 */

const BUCKET_NAME = 'furbabies-petstore'; // ✅ FIXED: All lowercase
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

export const bucketFolders = {
  BRAND: 'brand',
  PET: 'pet', 
  PRODUCT: 'product'
};
/**
 * Generate public URL for bucket file
 * @param {string} fileName - Full file path (e.g., "pet/pet123_1640995200000_image.jpg")
 * @returns {string} Public URL
 */
export const getPublicImageUrl = (fileName) => {
  return `${BUCKET_BASE_URL}/${encodeURIComponent(fileName)}`;
};

/**
 * Generate file path for upload
 * @param {string} folder - Folder name (brand, pet, product)
 * @param {string} entityId - Pet ID, brand ID, or product ID
 * @param {string} originalFileName - Original file name
 * @returns {string} Full file path
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
  return filePath.split('/')[0];
};

/**
 * Extract filename from file path
 * @param {string} filePath - Full file path
 * @returns {string} File name only
 */
export const getFileNameFromPath = (filePath) => {
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
 * Find best matching image from array for given search terms
 * @param {Array} images - Array of image objects with fileName property
 * @param {Array} searchTerms - Array of terms to search for
 * @param {string} fallbackImage - Fallback image path if no match found
 * @returns {string} Best matching image URL or fallback
 */
export const findBestMatchingImage = (images, searchTerms, fallbackImage) => {
  if (!images || images.length === 0) {
    return fallbackImage;
  }

  // Look for images that match the search terms
  const matchingImage = images.find(image => {
    const fileName = image.fileName.toLowerCase();
    return searchTerms.some(term => 
      fileName.includes(term.toLowerCase())
    );
  });

  if (matchingImage) {
    return getPublicImageUrl(matchingImage.name);
  }

  // If no specific match, return the first available image
  const anyImage = images[0];
  return anyImage ? getPublicImageUrl(anyImage.name) : fallbackImage;
};

/**
 * Get images filtered by folder
 * @param {Array} images - Array of all images
 * @param {string} folder - Folder to filter by
 * @returns {Array} Filtered images
 */
export const getImagesByFolder = (images, folder) => {
  return images.filter(image => image.folder === folder);
};

/**
 * Sort images by creation date (newest first)
 * @param {Array} images - Array of image objects
 * @returns {Array} Sorted images
 */
export const sortImagesByDate = (images) => {
  return [...images].sort((a, b) => new Date(b.created) - new Date(a.created));
};

/**
 * Create thumbnail URL (for future CDN integration)
 * @param {string} imageUrl - Original image URL
 * @param {string} size - Thumbnail size (small, medium, large)
 * @returns {string} Thumbnail URL (currently returns original)
 */
export const getThumbnailUrl = (imageUrl, size = 'medium') => {
  // For future implementation with image transformation service
  // For now, return original URL
  return imageUrl;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Bucket configuration
 */
export const bucketConfig = {
  name: BUCKET_NAME,
  baseUrl: BUCKET_BASE_URL,
  isPublic: true,
  folders: bucketFolders,
  maxFileSize: 10, // MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

const bucketUtils = {
  getPublicImageUrl,
  generateFilePath,
  getFolderFromPath,
  getFileNameFromPath,
  isValidImage,
  isValidFileSize,
  formatFileSize,
  findBestMatchingImage,
  getImagesByFolder,
  sortImagesByDate,
  getThumbnailUrl,
  bucketFolders,
  bucketConfig
};

export default bucketUtils;