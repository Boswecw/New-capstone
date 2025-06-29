// client/src/utils/imageUtils.js
/**
 * Fixed Google Cloud Storage Image Utilities
 * Handles all image URL generation, optimization, and fallback logic
 */

// Environment configuration with better defaults
const GCS_CONFIG = {
  bucketName: process.env.REACT_APP_GCS_BUCKET_NAME || 'furbabies-petstore',
  baseUrl: process.env.REACT_APP_GCS_BASE_URL || 'https://storage.googleapis.com',
  cdnUrl: process.env.REACT_APP_GCS_CDN_URL, // Optional CDN URL for better performance
};

// Local fallback paths (in public folder)
const LOCAL_FALLBACKS = {
  'brand/FurBabiesIcon.png': '/images/logo.png',
  'brand/PawLoveicon.png': '/images/paw-icon.png',
  'defaults/default-pet.png': '/images/default-pet.png',
  'defaults/default-dog.png': '/images/default-dog.png',
  'defaults/default-cat.png': '/images/default-cat.png',
  'defaults/default-fish.png': '/images/default-fish.png',
  'defaults/default-bird.png': '/images/default-bird.png',
  'defaults/default-smallpet.png': '/images/default-smallpet.png',
  'defaults/default-supply.png': '/images/default-supply.png',
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
 * Check if we should use GCS (properly configured)
 */
const shouldUseGCS = () => {
  // Only use GCS if we have a real bucket name (not the default)
  return process.env.REACT_APP_GCS_BUCKET_NAME && 
         process.env.REACT_APP_GCS_BUCKET_NAME !== 'furbabies-petstore';
};

/**
 * Generate Google Cloud Storage URL (only if properly configured)
 */
const generateGCSUrl = (imagePath, size = 'medium', options = {}) => {
  if (!shouldUseGCS()) return null;
  
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
 * Get local fallback image path
 */
const getLocalFallback = (imagePath) => {
  return LOCAL_FALLBACKS[imagePath] || '/images/placeholder.png';
};

/**
 * Main function: Generate optimized image URL with intelligent fallback
 * Priority: GCS (if configured) → Local fallback
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', options = {}) => {
  if (!imagePath) return getLocalFallback('defaults/default-pet.png');
  
  // Strategy 1: Use GCS if properly configured
  if (shouldUseGCS()) {
    const gcsUrl = generateGCSUrl(imagePath, size, options);
    if (gcsUrl) return gcsUrl;
  }
  
  // Strategy 2: Use local fallback (skip backend to avoid connection errors)
  const localUrl = getLocalFallback(imagePath);
  console.log(`Using local fallback: ${localUrl} for ${imagePath}`);
  return localUrl;
};

/**
 * Generate srcset for responsive images
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
 */
export const getDefaultPetImage = (petType = 'pet') => {
  const fallbackMap = {
    dog: 'defaults/default-dog.png',
    cat: 'defaults/default-cat.png',
    fish: 'defaults/default-fish.png',
    bird: 'defaults/default-bird.png',
    'small-pet': 'defaults/default-smallpet.png',
    supply: 'defaults/default-supply.png',
    pet: 'defaults/default-pet.png'
  };
  
  const imagePath = fallbackMap[petType] || fallbackMap.pet;
  return getGoogleStorageUrl(imagePath);
};

/**
 * Handle image loading errors with fallback logic
 */
export const handleImageError = (event, petType = 'pet') => {
  const img = event.target;
  
  // Prevent infinite error loops
  if (img.dataset.fallbackCount >= 3) {
    console.warn('All image fallbacks exhausted, hiding image');
    img.style.display = 'none';
    return;
  }
  
  const fallbackCount = parseInt(img.dataset.fallbackCount || '0') + 1;
  img.dataset.fallbackCount = fallbackCount;
  
  // Try different fallbacks
  switch (fallbackCount) {
    case 1:
      // Try pet-type specific local fallback
      img.src = getLocalFallback(`defaults/default-${petType}.png`);
      console.warn(`Image failed, trying pet-specific fallback: ${img.src}`);
      break;
    case 2:
      // Try generic local fallback
      img.src = getLocalFallback('defaults/default-pet.png');
      console.warn(`Pet-specific fallback failed, trying generic: ${img.src}`);
      break;
    case 3:
      // Try absolute generic fallback
      img.src = '/images/placeholder.png';
      console.warn(`Generic fallback failed, trying placeholder: ${img.src}`);
      break;
    default:
      // Give up
      img.style.display = 'none';
      console.error('All image fallbacks failed');
  }
};

/**
 * Get brand logo URL
 */
export const getBrandLogo = (size = 'medium') => {
  return getGoogleStorageUrl('brand/FurBabiesIcon.png', size);
};

/**
 * Get paw love icon URL
 */
export const getPawLoveIcon = () => {
  return getGoogleStorageUrl('brand/PawLoveicon.png');
};

/**
 * Check if browser supports WebP format
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
 * Validate configuration and provide helpful debugging
 */
export const validateGCSConfig = () => {
  const issues = [];
  
  if (!shouldUseGCS()) {
    issues.push('GCS not properly configured - using local fallbacks');
    issues.push('Set REACT_APP_GCS_BUCKET_NAME to enable GCS');
  }
  
  if (!GCS_CONFIG.baseUrl) {
    issues.push('REACT_APP_GCS_BASE_URL is not configured');
  }
  
  return {
    isValid: shouldUseGCS(),
    usingGCS: shouldUseGCS(),
    usingLocal: !shouldUseGCS(),
    issues,
    config: { 
      gcs: GCS_CONFIG,
      localFallbacks: Object.keys(LOCAL_FALLBACKS).length 
    }
  };
};

// Debug function for development
export const debugImageConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🖼️ Image Configuration Debug');
    console.log('Validation:', validateGCSConfig());
    console.log('Environment Variables:');
    console.log('- REACT_APP_GCS_BUCKET_NAME:', process.env.REACT_APP_GCS_BUCKET_NAME);
    console.log('- REACT_APP_GCS_BASE_URL:', process.env.REACT_APP_GCS_BASE_URL);
    console.log('WebP Support:', supportsWebP());
    console.groupEnd();
  }
};

// Initialize debug in development
if (process.env.NODE_ENV === 'development') {
  debugImageConfig();
}