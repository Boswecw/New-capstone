// client/src/utils/imageUtils.js - FIXED VERSION - Corrects image path structure

const BUCKET_NAME = 'furbabies-petstore';

// ✅ FIXED: Use correct backend URL consistently
const getProxyBaseUrl = () => {
  // Always use the backend URL for image requests
  if (process.env.NODE_ENV === 'production') {
    return 'https://furbabies-backend.onrender.com/api/images/gcs';
  }
  return 'http://localhost:5000/api/images/gcs';
};

// Working fallback images that don't require CORS
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

/**
 * ✅ FIXED: Normalize image paths to use correct folder structure
 * @param {string} imagePath - Original image path
 * @returns {string} Normalized image path
 */
const normalizeImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }
  
  let cleanPath = imagePath.trim();
  
  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Fix common path issues
  cleanPath = cleanPath.replace(/\/+/g, '/');
  
  // ✅ FIXED: Convert singular "pet" to plural "pets" in path
  if (cleanPath.startsWith('pet/')) {
    cleanPath = cleanPath.replace('pet/', 'pets/');
  }
  
  // ✅ FIXED: Ensure pets folder structure
  if (!cleanPath.startsWith('pets/') && !cleanPath.startsWith('products/')) {
    // If no folder specified, assume it's a pet image
    cleanPath = `pets/${cleanPath}`;
  }
  
  return cleanPath;
};

/**
 * Get image URL using the proxy route (solves CORS issues)
 * @param {string} imagePath - Path to image in GCS bucket
 * @param {string} category - Category for fallback selection
 * @returns {string} Proxied image URL or fallback
 */
export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.fallback;
  }
  
  // If already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // ✅ FIXED: Normalize the path to correct folder structure
  const cleanPath = normalizeImagePath(imagePath);
  const proxyBaseUrl = getProxyBaseUrl();
  
  console.log(`🖼️ Image URL: ${imagePath} → ${proxyBaseUrl}/${cleanPath}`);
  
  return `${proxyBaseUrl}/${cleanPath}`;
};

/**
 * Get fallback image URL through proxy
 * @param {string} category - Image category (pet, product, default)
 * @returns {string} Fallback image URL
 */
export const getFallbackImageUrl = (category = 'default') => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api/images/fallback'
    : 'http://localhost:5000/api/images/fallback';
  
  return `${baseUrl}/${category}`;
};

/**
 * Get optimized image props for React components
 * @param {object} item - Pet or product object
 * @param {string} size - Image size (for future optimization)
 * @returns {object} Image props including src, alt, and error handling
 */
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.default,
      alt: 'Content unavailable',
      onError: () => {},
      onLoad: () => {}
    };
  }

  // Determine if this is a product or pet
  const isProduct = item.price !== undefined || 
                   (item.category && 
                    ['Dog Care', 'Cat Care', 'Grooming', 'Training', 'Aquarium'].some(cat => 
                      item.category.includes(cat)
                    ));
  
  const category = isProduct ? 'product' : 'pet';
  
  // Get image path from various possible fields
  const imagePath = item.image || item.imageUrl || item.imagePath || item.photo || '';
  
  return {
    src: getGoogleStorageUrl(imagePath, category),
    alt: item.name || item.title || 'Image',
    onError: (e) => {
      console.warn(`Image load error for ${item.name}:`, imagePath);
      e.target.src = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.default;
    },
    onLoad: () => {
      console.log(`✅ Image loaded successfully for ${item.name}`);
    }
  };
};

/**
 * Build optimized image URL with parameters
 * @param {string} imagePath - Base image path
 * @param {object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, options = {}) => {
  const baseUrl = getGoogleStorageUrl(imagePath);
  
  // If no optimization options, return base URL
  if (!options.width && !options.height && !options.quality) {
    return baseUrl;
  }
  
  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width);
  if (options.height) params.set('h', options.height);
  if (options.quality) params.set('q', options.quality);
  if (options.format) params.set('format', options.format);
  if (options.fit) params.set('fit', options.fit);
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Get preset image URL for common sizes
 * @param {string} imagePath - Base image path
 * @param {string} preset - Preset name (thumbnail, small, medium, large, card, hero)
 * @returns {string} Preset image URL
 */
export const getPresetImageUrl = (imagePath, preset = 'medium') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES.default;
  }
  
  const cleanPath = normalizeImagePath(imagePath);
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api/images/preset'
    : 'http://localhost:5000/api/images/preset';
  
  return `${baseUrl}/${preset}/gcs/${cleanPath}`;
};

/**
 * Check if image path needs normalization
 * @param {string} imagePath - Image path to check
 * @returns {boolean} True if path needs fixing
 */
export const needsPathNormalization = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return false;
  }
  
  // Check for common issues that need fixing
  return imagePath.includes('pet/') || // Should be pets/
         imagePath.startsWith('/') || // Shouldn't start with /
         imagePath.includes('//'); // Double slashes
};

/**
 * Debug image loading issues
 * @param {string} imagePath - Image path to debug
 * @param {string} category - Image category
 */
export const debugImagePath = (imagePath, category = 'pet') => {
  console.group(`🔍 Image Debug: ${imagePath}`);
  console.log('Original path:', imagePath);
  console.log('Category:', category);
  console.log('Normalized path:', normalizeImagePath(imagePath));
  console.log('Final URL:', getGoogleStorageUrl(imagePath, category));
  console.log('Fallback URL:', getFallbackImageUrl(category));
  console.log('Needs normalization:', needsPathNormalization(imagePath));
  console.groupEnd();
};

// Export utility functions
export default {
  getGoogleStorageUrl,
  getFallbackImageUrl,
  getCardImageProps,
  getOptimizedImageUrl,
  getPresetImageUrl,
  normalizeImagePath,
  needsPathNormalization,
  debugImagePath,
  DEFAULT_IMAGES
};