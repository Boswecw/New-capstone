// client/src/utils/imageUrlBuilder.js
/**
 * Client-side Image URL Builder for FurBabies Pet Store
 * NO URL ENCODING - Preserves filenames exactly as stored
 */

// Use Vite environment variable
const GCS_BASE_URL = import.meta.env.VITE_PUBLIC_IMAGE_BASE || 'https://storage.googleapis.com/furbabies-petstore';

console.log('Image URL Builder initialized with base:', GCS_BASE_URL);

// Fallback images by type/category
const FALLBACK_URLS = {
  // Pet types from your data
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  hamster: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
  'sugar-glider': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  rat: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
  gerbil: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
  other: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  
  // Product categories from your data
  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  'aquarium & fish care': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
  'grooming & health': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'training & behavior': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  
  // Generic fallbacks
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
};

/**
 * Clean path - remove prefixes but DO NOT encode
 */
function normalizePath(path) {
  if (!path || typeof path !== 'string') return null;
  
  let cleaned = path.trim();
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(/^furbabies-petstore\//, '');
  cleaned = cleaned.replace(/^images\//, '');
  
  // Must have category/filename structure
  if (!cleaned.includes('/')) {
    console.warn(`Invalid image path: ${path} (missing category/filename structure)`);
    return null;
  }
  
  return cleaned;
}

/**
 * Get fallback URL by entity type or category
 */
export function getFallbackUrl(entityType, category) {
  // Try category first (case-insensitive)
  const categoryKey = category?.toLowerCase();
  if (categoryKey && FALLBACK_URLS[categoryKey]) {
    return FALLBACK_URLS[categoryKey];
  }
  
  // Try entity type
  const typeKey = entityType?.toLowerCase();
  if (typeKey && FALLBACK_URLS[typeKey]) {
    return FALLBACK_URLS[typeKey];
  }
  
  return FALLBACK_URLS.default;
}

/**
 * Build complete image URL - MAIN FUNCTION
 * @param {string} imagePath - Path from database (e.g., "pet/black-gold-fish.png")
 * @param {Object} options - { entityType, category, cacheKey }
 * @returns {string} Complete GCS URL or fallback
 */
export function buildImageUrl(imagePath, options = {}) {
  const { entityType = 'default', category = null, cacheKey = null } = options;
  
  // If already a full URL, return as-is
  if (imagePath && /^https?:\/\//i.test(imagePath)) {
    console.log('Already full URL:', imagePath);
    return cacheKey ? `${imagePath}?v=${cacheKey}` : imagePath;
  }
  
  // Normalize the path
  const normalized = normalizePath(imagePath);
  
  // If invalid path, return fallback
  if (!normalized) {
    const fallback = getFallbackUrl(entityType, category);
    console.log('Using fallback for invalid path:', { imagePath, fallback });
    return fallback;
  }
  
  // Build the full GCS URL - NO ENCODING!
  const url = `${GCS_BASE_URL}/${normalized}`;
  
  // Log for debugging
  console.log('Built image URL:', {
    input: imagePath,
    normalized,
    output: url
  });
  
  // Add cache key if provided
  return cacheKey ? `${url}?v=${cacheKey}` : url;
}

/**
 * Helper to extract and build URLs from entity objects
 */
export function getEntityImageUrls(entity, options = {}) {
  if (!entity) {
    const fallback = getFallbackUrl('default', null);
    return { primary: fallback, fallback };
  }
  
  // Determine entity type and category
  const entityType = entity.type || options.entityType || 'default';
  const category = entity.category || options.category || null;
  
  // Try various image field names
  const imagePath = entity.image || 
                    entity.imagePath || 
                    entity.imageUrl || 
                    entity.photo || 
                    entity.picture || 
                    null;
  
  // Build primary URL
  const primary = buildImageUrl(imagePath, {
    entityType,
    category,
    cacheKey: options.cacheKey
  });
  
  // Get fallback URL
  const fallback = getFallbackUrl(entityType, category);
  
  return { primary, fallback };
}

/**
 * Validate image URL by attempting to load it
 */
export async function validateImageUrl(url) {
  if (!url) return false;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log('✅ Image loaded successfully:', url);
      resolve(true);
    };
    img.onerror = () => {
      console.error('❌ Image failed to load:', url);
      resolve(false);
    };
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.warn('⏱️ Image load timeout:', url);
      resolve(false);
    }, 5000);
  });
}

/**
 * Test function to verify URLs are built correctly
 */
export function testImageUrls() {
  console.log('\n🧪 Testing Image URL Builder:');
  console.log('Base URL:', GCS_BASE_URL);
  console.log('-'.repeat(60));
  
  const testCases = [
    { path: 'pet/black-gold-fish.png', type: 'fish', category: 'aquatic' },
    { path: 'pet/tabby-cat.png', type: 'cat', category: 'cat' },
    { path: 'product/interactive-cat-toy.png', type: 'product', category: 'Cat Care' },
    { path: 'product/clicker.png', type: 'product', category: 'Training & Behavior' },
    { path: null, type: 'dog', category: null }, // Should use fallback
  ];
  
  testCases.forEach((test, index) => {
    const url = buildImageUrl(test.path, {
      entityType: test.type,
      category: test.category
    });
    console.log(`Test ${index + 1}:`, {
      input: test.path,
      output: url,
      isFallback: url.includes('unsplash')
    });
  });
  
  console.log('-'.repeat(60));
  console.log('✅ Test complete\n');
}

// Create named export object
const imageUrlBuilder = {
  buildImageUrl,
  getFallbackUrl,
  getEntityImageUrls,
  validateImageUrl,
  testImageUrls,
  GCS_BASE_URL
};

// Export as default with a name
export default imageUrlBuilder;