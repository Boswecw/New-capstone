// src/utils/imageUtils.js

/**
 * Default fallback image for when pet images fail to load
 */
export const DEFAULT_PET_IMAGE = '/images/default-pet.jpg';

/**
 * Default fallback image for products
 */
export const DEFAULT_PRODUCT_IMAGE = '/images/default-product.jpg';

/**
 * Build a complete image URL from a relative path or filename
 * @param {string} imagePath - The image path or filename
 * @param {string} baseUrl - Optional base URL (defaults to current origin)
 * @returns {string} Complete image URL
 */
export const buildImageUrl = (imagePath, baseUrl = '') => {
  if (!imagePath) {
    return DEFAULT_PET_IMAGE;
  }

  // If it's already a complete URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it starts with '/', it's an absolute path
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }

  // Otherwise, assume it's a relative path that needs /images/ prefix
  return `${baseUrl}/images/${imagePath}`;
};

/**
 * Build image URL specifically for pets
 * @param {string} imagePath - The pet image path
 * @param {string} fallback - Optional fallback image
 * @returns {string} Complete pet image URL
 */
export const buildPetImageUrl = (imagePath, fallback = DEFAULT_PET_IMAGE) => {
  if (!imagePath) {
    return fallback;
  }
  return buildImageUrl(imagePath);
};

/**
 * Build image URL specifically for products
 * @param {string} imagePath - The product image path
 * @param {string} fallback - Optional fallback image
 * @returns {string} Complete product image URL
 */
export const buildProductImageUrl = (imagePath, fallback = DEFAULT_PRODUCT_IMAGE) => {
  if (!imagePath) {
    return fallback;
  }
  return buildImageUrl(imagePath);
};

/**
 * Validate if an image URL is accessible
 * @param {string} imageUrl - The image URL to validate
 * @returns {Promise<boolean>} Promise that resolves to true if image is accessible
 */
export const validateImageUrl = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};

/**
 * Get optimized image URL with size parameters
 * @param {string} imagePath - The original image path
 * @param {Object} options - Size options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.quality - Image quality (low, medium, high)
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, options = {}) => {
  const baseUrl = buildImageUrl(imagePath);
  const { width, height, quality = 'medium' } = options;
  
  // If no optimization needed, return base URL
  if (!width && !height) {
    return baseUrl;
  }

  // Add query parameters for image optimization
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality);

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Extract filename from image path
 * @param {string} imagePath - The image path
 * @returns {string} The filename
 */
export const getImageFilename = (imagePath) => {
  if (!imagePath) return '';
  return imagePath.split('/').pop() || '';
};

/**
 * Check if image path has a valid image extension
 * @param {string} imagePath - The image path to check
 * @returns {boolean} True if has valid image extension
 */
export const hasValidImageExtension = (imagePath) => {
  if (!imagePath) return false;
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerPath = imagePath.toLowerCase();
  return validExtensions.some(ext => lowerPath.endsWith(ext));
};

/**
 * Generate responsive image srcSet for different screen sizes
 * @param {string} imagePath - The base image path
 * @param {Array<number>} widths - Array of widths for different breakpoints
 * @returns {string} srcSet string for responsive images
 */
export const generateSrcSet = (imagePath, widths = [320, 640, 768, 1024, 1280]) => {
  if (!imagePath) return '';
  
  return widths
    .map(width => `${getOptimizedImageUrl(imagePath, { width })} ${width}w`)
    .join(', ');
};

// Legacy exports for backward compatibility
export const imageUrlBuilder = buildImageUrl;
export const imageBuilder = buildPetImageUrl;

const imageUtils = {
  buildImageUrl,
  buildPetImageUrl,
  buildProductImageUrl,
  validateImageUrl,
  getOptimizedImageUrl,
  getImageFilename,
  hasValidImageExtension,
  generateSrcSet,
  DEFAULT_PET_IMAGE,
  DEFAULT_PRODUCT_IMAGE
};

export default imageUtils;