// client/src/utils/imageUtils.js - CORRECTED to match actual GCS structure

const BUCKET_NAME = 'furbabies-petstore';

// ✅ CORRECTED: Use actual backend URL
const getProxyBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://furbabies-backend.onrender.com/api/images/gcs';
  }
  return 'http://localhost:5000/api/images/gcs';
};

// Working fallback images
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
 * ✅ CORRECTED: Keep paths as-is since GCS has pet/ (singular)
 * @param {string} imagePath - Original image path
 * @returns {string} Cleaned image path (no normalization)
 */
const cleanImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }
  
  let cleanPath = imagePath.trim();
  
  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Fix double slashes
  cleanPath = cleanPath.replace(/\/+/g, '/');
  
  // ✅ CORRECTED: DON'T change pet/ to pets/ since GCS actually has pet/
  // Keep the path exactly as it is in the database
  
  return cleanPath;
};

/**
 * Get image URL using the proxy route
 * @param {string} imagePath - Path to image in GCS bucket
 * @param {string} category - Category for fallback selection
 * @returns {string} Proxied image URL or fallback
 */
export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.log('🔍 No image path provided, using fallback');
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.default;
  }
  
  // If already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // ✅ CORRECTED: Keep exact path from database (should be pet/image.png)
  const cleanPath = cleanImagePath(imagePath);
  const proxyBaseUrl = getProxyBaseUrl();
  
  const finalUrl = `${proxyBaseUrl}/${cleanPath}`;
  
  console.log(`🖼️ Image URL: ${imagePath} → ${finalUrl}`);
  
  return finalUrl;
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
      console.warn(`❌ Image load error for ${item.name}:`, imagePath);
      console.warn('🔄 Switching to fallback image');
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
  
  const cleanPath = cleanImagePath(imagePath);
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api/images/preset'
    : 'http://localhost:5000/api/images/preset';
  
  return `${baseUrl}/${preset}/gcs/${cleanPath}`;
};

/**
 * Test if image exists at given URL
 * @param {string} imageUrl - Image URL to test
 * @returns {Promise<boolean>} True if image exists
 */
export const testImageExists = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
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
  console.log('Cleaned path:', cleanImagePath(imagePath));
  console.log('Final URL:', getGoogleStorageUrl(imagePath, category));
  console.log('Fallback URL:', getFallbackImageUrl(category));
  console.log('Direct GCS URL:', `https://storage.googleapis.com/furbabies-petstore/${cleanImagePath(imagePath)}`);
  console.groupEnd();
};

// Export utility functions
export default {
  getGoogleStorageUrl,
  getFallbackImageUrl,
  getCardImageProps,
  getOptimizedImageUrl,
  getPresetImageUrl,
  cleanImagePath,
  testImageExists,
  debugImagePath,
  DEFAULT_IMAGES
};