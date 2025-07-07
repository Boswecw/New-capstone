// client/src/utils/imageUtils.js
import { getPublicImageUrl } from './bucketUtils';

/**
 * Optimized image size configurations
 */
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 300, quality: 75 },
  medium: { width: 600, height: 400, quality: 80 },
  large: { width: 1200, height: 800, quality: 85 },
  full: { width: null, height: null, quality: 90 }
};

/**
 * Default fallback images for different categories
 */
const DEFAULT_IMAGES = {
  pet: '/images/pet/default-pet.png',
  product: '/images/product/default-product.png',
  brand: '/images/brand/default-brand.png',
  user: '/images/user/default-avatar.png'
};

/**
 * Get optimized Google Cloud Storage URL for images
 * Enhanced with size optimization and better fallbacks
 * @param {string} imagePath - Image path or filename
 * @param {string} size - Size preset (thumbnail, small, medium, large, full)
 * @param {string} category - Image category for fallback (pet, product, brand, user)
 * @returns {string} Optimized image URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  // Return fallback if no image path
  if (!imagePath) return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  
  // If it's already a full URL, add optimization parameters if possible
  if (imagePath.startsWith('http')) {
    return addOptimizationParams(imagePath, size);
  }
  
  // If it's a relative path starting with /, build the full URL using API base
  if (imagePath.startsWith('/')) {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const fullUrl = `${baseURL.replace('/api', '')}${imagePath}`;
    return addOptimizationParams(fullUrl, size);
  }
  
  // Use your existing bucket utils for GCS URLs and add optimization
  const gcsUrl = getPublicImageUrl(imagePath);
  return addOptimizationParams(gcsUrl, size);
};

/**
 * Add optimization parameters to image URLs
 * Works with Google Cloud Storage and other CDNs
 * @param {string} url - Base image URL
 * @param {string} size - Size preset
 * @returns {string} URL with optimization parameters
 */
const addOptimizationParams = (url, size) => {
  if (!url || !IMAGE_SIZES[size]) return url;
  
  const config = IMAGE_SIZES[size];
  const params = new URLSearchParams();
  
  // For Google Cloud Storage, we can add transformation parameters
  // Note: This requires enabling Cloud Storage image transformation
  if (url.includes('storage.googleapis.com')) {
    // Add basic optimization params that work with GCS
    if (config.width) params.set('w', config.width);
    if (config.height) params.set('h', config.height);
    if (config.quality) params.set('q', config.quality);
    
    // Add format optimization
    params.set('fm', 'webp'); // Use WebP format for better compression
    params.set('fit', 'cover'); // Maintain aspect ratio
    
    return params.toString() ? `${url}?${params.toString()}` : url;
  }
  
  // For other URLs, return as-is (could be enhanced for other CDNs)
  return url;
};

/**
 * Generate responsive image srcSet for better performance
 * Creates multiple image sizes for responsive design
 * @param {string} imagePath - Image path or filename
 * @param {string} category - Image category for fallback
 * @returns {string} srcSet string for responsive images
 */
export const generateSrcSet = (imagePath, category = 'pet') => {
  if (!imagePath) return '';
  
  const responsiveSizes = [
    { size: 'small', descriptor: '300w' },
    { size: 'medium', descriptor: '600w' },
    { size: 'large', descriptor: '1200w' }
  ];
  
  return responsiveSizes
    .map(({ size, descriptor }) => 
      `${getGoogleStorageUrl(imagePath, size, category)} ${descriptor}`
    )
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * Provides size hints to the browser for optimal loading
 * @param {string} breakpoints - Custom breakpoints or use default
 * @returns {string} sizes attribute value
 */
export const generateSizes = (breakpoints = null) => {
  if (breakpoints) return breakpoints;
  
  return [
    '(max-width: 576px) 100vw',    // Mobile: full width
    '(max-width: 768px) 50vw',     // Tablet: half width  
    '(max-width: 992px) 33vw',     // Small desktop: third width
    '25vw'                         // Large desktop: quarter width
  ].join(', ');
};

/**
 * Preload critical images for better performance
 * @param {Array} imagePaths - Array of image paths to preload
 * @param {string} size - Size to preload
 * @param {string} category - Image category
 */
export const preloadImages = (imagePaths, size = 'medium', category = 'pet') => {
  if (!Array.isArray(imagePaths)) return;
  
  imagePaths.forEach(imagePath => {
    if (!imagePath) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getGoogleStorageUrl(imagePath, size, category);
    
    // Add responsive preloading for better mobile performance
    if (size === 'medium') {
      link.imageSrcset = generateSrcSet(imagePath, category);
      link.imageSizes = generateSizes();
    }
    
    document.head.appendChild(link);
  });
};

/**
 * Get optimized image props for React components
 * Returns all necessary props for optimized image loading
 * @param {string} imagePath - Image path
 * @param {string} alt - Alt text
 * @param {string} size - Default size
 * @param {string} category - Image category
 * @param {boolean} lazy - Enable lazy loading
 * @returns {Object} Image props object
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const baseProps = {
    src: getGoogleStorageUrl(imagePath, size, category),
    alt: alt || 'Image',
    onError: (e) => {
      // Fallback to default image on error
      e.target.src = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
    }
  };
  
  // Add responsive props for better performance
  if (imagePath) {
    baseProps.srcSet = generateSrcSet(imagePath, category);
    baseProps.sizes = generateSizes();
  }
  
  // Add lazy loading for non-critical images
  if (lazy) {
    baseProps.loading = 'lazy';
    baseProps.decoding = 'async';
  }
  
  return baseProps;
};

/**
 * Create optimized background image CSS
 * For use with CSS background-image property
 * @param {string} imagePath - Image path
 * @param {string} size - Size preset
 * @param {string} category - Image category
 * @returns {Object} CSS style object
 */
export const getOptimizedBackgroundImage = (imagePath, size = 'large', category = 'pet') => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
};

/**
 * Check if image format is supported for optimization
 * @param {string} imagePath - Image path or URL
 * @returns {boolean} Whether the image can be optimized
 */
export const isOptimizableImage = (imagePath) => {
  if (!imagePath) return false;
  
  const optimizableFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  const lowerPath = imagePath.toLowerCase();
  
  return optimizableFormats.some(format => lowerPath.includes(format));
};

/**
 * Get image category from path
 * Automatically determines category based on path structure
 * @param {string} imagePath - Image path
 * @returns {string} Detected category
 */
export const getImageCategory = (imagePath) => {
  if (!imagePath) return 'pet';
  
  const lowerPath = imagePath.toLowerCase();
  
  if (lowerPath.includes('/pet/') || lowerPath.includes('pet-')) return 'pet';
  if (lowerPath.includes('/product/') || lowerPath.includes('product-')) return 'product';
  if (lowerPath.includes('/brand/') || lowerPath.includes('brand-')) return 'brand';
  if (lowerPath.includes('/user/') || lowerPath.includes('avatar')) return 'user';
  
  return 'pet'; // Default fallback
};

/**
 * Enhanced image utility for your existing components
 * Drop-in replacement that maintains compatibility
 * @param {string} imagePath - Image path
 * @param {string} size - Size preset
 * @returns {string} Optimized image URL
 */
export const getImageUrl = (imagePath, size = 'medium') => {
  const category = getImageCategory(imagePath);
  return getGoogleStorageUrl(imagePath, size, category);
};

/**
 * Utility for PetCard and ProductCard components
 * Returns optimized props ready for use
 * @param {Object} item - Pet or Product object
 * @param {string} size - Size preset
 * @returns {Object} Optimized image props
 */
export const getCardImageProps = (item, size = 'medium') => {
  const imagePath = item?.image || item?.imageUrl || item?.photo;
  const category = item?.category ? 'product' : 'pet';
  const alt = item?.name || item?.title || 'Image';
  
  return getOptimizedImageProps(imagePath, alt, size, category, true);
};

// Export default configuration for easy access
export const imageConfig = {
  sizes: IMAGE_SIZES,
  defaults: DEFAULT_IMAGES,
  formats: {
    preferred: 'webp',
    fallback: 'jpeg'
  }
};

// Backward compatibility - maintain your existing function signature
export { getGoogleStorageUrl as getImageUrlCompat };

// Export as module default
const imageUtils = {
  getGoogleStorageUrl,
  generateSrcSet,
  generateSizes,
  preloadImages,
  getOptimizedImageProps,
  getOptimizedBackgroundImage,
  isOptimizableImage,
  getImageCategory,
  getImageUrl,
  getCardImageProps,
  imageConfig
};

export default imageUtils;