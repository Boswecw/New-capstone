// client/src/utils/imageUtils.js
/**
 * Google Cloud Storage Image Utilities
 * Handles all image URL generation, optimization, and fallback logic
 */

// Environment configuration
const GCS_CONFIG = {
  bucketName: process.env.REACT_APP_GCS_BUCKET_NAME || 'furbabies-petstore',
  baseUrl: process.env.REACT_APP_GCS_BASE_URL || 'https://storage.googleapis.com',
  cdnUrl: process.env.REACT_APP_GCS_CDN_URL, // Optional CDN URL for better performance
};

// Image size configurations for responsive images
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 200, quality: 85 },
  medium: { width: 600, height: 400, quality: 90 },
  large: { width: 1200, height: 800, quality: 95 },
  hero: { width: 1920, height: 1080, quality: 95 }
};

/**
 * Generate optimized Google Cloud Storage URL
 * @param {string} imagePath - Original image path (e.g., '/assets/GoldenRetriever.png')
 * @param {string} size - Image size variant ('thumbnail', 'small', 'medium', 'large', 'hero')
 * @param {object} options - Additional options (webp, quality, etc.)
 * @returns {string} - Optimized GCS URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', options = {}) => {
  if (!imagePath) return getDefaultPetImage();
  
  // Remove leading slash and /assets/ prefix if present
  const cleanPath = imagePath.replace(/^\/?(assets\/)?/, '');
  
  // Use CDN URL if available, otherwise use direct GCS URL
  const baseUrl = GCS_CONFIG.cdnUrl || `${GCS_CONFIG.baseUrl}/${GCS_CONFIG.bucketName}`;
  
  // Get size configuration
  const sizeConfig = IMAGE_SIZES[size] || IMAGE_SIZES.medium;
  
  // Build query parameters for image transformation
  const params = new URLSearchParams();
  
  // Add size parameters if transformation is supported
  if (GCS_CONFIG.cdnUrl) {
    params.append('w', sizeConfig.width);
    params.append('h', sizeConfig.height);
    params.append('q', options.quality || sizeConfig.quality);
    
    // Enable WebP if supported and not explicitly disabled
    if (options.webp !== false && supportsWebP()) {
      params.append('fm', 'webp');
    }
    
    // Add any custom parameters
    if (options.fit) params.append('fit', options.fit);
    if (options.crop) params.append('crop', options.crop);
  }
  
  const queryString = params.toString();
  const url = `${baseUrl}/${cleanPath}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`Generated GCS URL: ${url}`);
  return url;
};

/**
 * Generate srcset for responsive images
 * @param {string} imagePath - Original image path
 * @param {array} sizes - Array of size names to include
 * @returns {string} - Srcset string for responsive images
 */
export const generateSrcSet = (imagePath, sizes = ['small', 'medium', 'large']) => {
  if (!imagePath) return '';
  
  return sizes
    .map(size => {
      const url = getGoogleStorageUrl(imagePath, size);
      const config = IMAGE_SIZES[size];
      return `${url} ${config.width}w`;
    })
    .join(', ');
};

/**
 * Get default placeholder image based on pet type
 * @param {string} petType - Type of pet ('dog', 'cat', 'fish', 'bird', 'small-pet', 'supply')
 * @returns {string} - Default image URL
 */
export const getDefaultPetImage = (petType = 'pet') => {
  const defaultImages = {
    dog: getGoogleStorageUrl('defaults/default-dog.png'),
    cat: getGoogleStorageUrl('defaults/default-cat.png'),
    fish: getGoogleStorageUrl('defaults/default-fish.png'),
    bird: getGoogleStorageUrl('defaults/default-bird.png'),
    'small-pet': getGoogleStorageUrl('defaults/default-smallpet.png'),
    supply: getGoogleStorageUrl('defaults/default-supply.png'),
    pet: getGoogleStorageUrl('defaults/default-pet.png')
  };
  
  return defaultImages[petType] || defaultImages.pet;
};

/**
 * Handle image loading errors with fallback logic
 * @param {Event} event - Image error event
 * @param {string} petType - Type of pet for fallback
 */
export const handleImageError = (event, petType = 'pet') => {
  const img = event.target;
  
  // Prevent infinite error loops
  if (img.dataset.fallbackApplied) {
    console.warn('Fallback image also failed to load');
    return;
  }
  
  // Mark fallback as applied
  img.dataset.fallbackApplied = 'true';
  
  // Set fallback image
  img.src = getDefaultPetImage(petType);
  img.alt = `Default ${petType} image`;
  
  console.warn(`Image failed to load, using fallback for ${petType}`);
};

/**
 * Check if browser supports WebP format
 * @returns {boolean} - True if WebP is supported
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  // Check if we've already determined WebP support
  if (window.webpSupport !== undefined) {
    return window.webpSupport;
  }
  
  // Create a simple WebP image to test support
  const webp = new Image();
  webp.onload = webp.onerror = () => {
    window.webpSupport = (webp.height === 2);
  };
  webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  
  return false; // Default to false until determined
};

/**
 * Preload critical images for better performance
 * @param {array} imagePaths - Array of image paths to preload
 * @param {string} size - Size variant to preload
 */
export const preloadImages = (imagePaths, size = 'medium') => {
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getGoogleStorageUrl(path, size);
    document.head.appendChild(link);
  });
};

/**
 * Get brand logo URL
 * @param {string} size - Size variant
 * @returns {string} - Brand logo URL
 */
export const getBrandLogo = (size = 'medium') => {
  return getGoogleStorageUrl('brand/FurBabiesIcon.png', size);
};

/**
 * Get paw love icon URL
 * @returns {string} - Paw love icon URL
 */
export const getPawLoveIcon = () => {
  return getGoogleStorageUrl('brand/PawLoveicon.png');
};

/**
 * Validate GCS configuration
 * @returns {object} - Configuration status and any issues
 */
export const validateGCSConfig = () => {
  const issues = [];
  
  if (!GCS_CONFIG.bucketName) {
    issues.push('REACT_APP_GCS_BUCKET_NAME is not configured');
  }
  
  if (!GCS_CONFIG.baseUrl) {
    issues.push('REACT_APP_GCS_BASE_URL is not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    config: GCS_CONFIG
  };
};

// Debug function for development
export const debugImageConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🖼️ Image Configuration Debug');
    console.log('GCS Config:', GCS_CONFIG);
    console.log('Validation:', validateGCSConfig());
    console.log('WebP Support:', supportsWebP());
    console.groupEnd();
  }
};

// Initialize debug in development
if (process.env.NODE_ENV === 'development') {
  debugImageConfig();
}