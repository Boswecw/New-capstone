// server/utils/imageUtils.js
/**
 * Server-side Image Utilities for FurBabies Pet Store
 * Uses your environment variables for GCS configuration
 */

// Use your environment variables
const GCS_BASE_URL = process.env.GCS_PUBLIC_BASE_URL || 'https://storage.googleapis.com/furbabies-petstore';
const BUCKET_NAME = process.env.GCS_BUCKET || 'furbabies-petstore';

// Fallback images
const FALLBACK_IMAGES = {
  // Pet types
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
  
  // Product categories (normalized)
  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  'aquarium & fish care': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
  'grooming & health': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'training & behavior': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  
  // Generic fallbacks
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400'
};

/**
 * Clean and normalize image path - NO URL ENCODING!
 */
function cleanImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  let cleaned = imagePath.trim();
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(new RegExp(`^${BUCKET_NAME}/`, 'i'), '');
  cleaned = cleaned.replace(/^images\//, '');
  
  // Must have category/filename structure
  if (!cleaned.includes('/')) {
    console.warn(`Invalid image path structure: ${imagePath}`);
    return null;
  }
  
  return cleaned;
}

/**
 * Build complete GCS URL from image path - CRITICAL: NO ENCODING
 */
function getImageUrl(imagePath, fallbackCategory = null, fallbackType = 'default') {
  // If already a full URL, return as-is
  if (imagePath && /^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }
  
  const cleanPath = cleanImagePath(imagePath);
  
  if (!cleanPath) {
    return getFallbackImage(fallbackCategory, fallbackType);
  }
  
  // Build full GCS URL - NO encoding!
  const url = `${GCS_BASE_URL}/${cleanPath}`;
  console.log(`Image URL built: ${url} from path: ${imagePath}`);
  return url;
}

/**
 * Get appropriate fallback image
 */
function getFallbackImage(category, type) {
  // Try category first (normalize to lowercase)
  if (category) {
    const categoryKey = category.toLowerCase();
    if (FALLBACK_IMAGES[categoryKey]) {
      return FALLBACK_IMAGES[categoryKey];
    }
  }
  
  // Try type
  if (type) {
    const typeKey = type.toLowerCase();
    if (FALLBACK_IMAGES[typeKey]) {
      return FALLBACK_IMAGES[typeKey];
    }
  }
  
  return FALLBACK_IMAGES.default;
}

/**
 * Enrich entity with image URLs
 */
function enrichEntityWithImages(entity, entityType = 'general') {
  if (!entity) return entity;
  
  const obj = entity.toObject ? entity.toObject() : entity;
  
  // Extract image path
  const imagePath = obj.image || obj.imagePath || obj.imageUrl || obj.photo || obj.picture || null;
  
  // Determine fallback parameters
  const fallbackCategory = obj.category || null;
  const fallbackType = obj.type || entityType;
  
  // Build the image URL
  const imageUrl = getImageUrl(imagePath, fallbackCategory, fallbackType);
  
  return {
    ...obj,
    imageUrl,
    fallbackImageUrl: `/api/images/fallback/${entityType}`,
    originalImagePath: imagePath,
    hasImage: Boolean(imagePath)
  };
}

/**
 * Enrich multiple entities
 */
function enrichEntitiesWithImages(entities, entityType = 'general') {
  if (!Array.isArray(entities)) return entities;
  return entities.map(entity => enrichEntityWithImages(entity, entityType));
}

/**
 * Test helper to validate URLs
 */
function generateTestUrls() {
  const testPaths = [
    'pet/black-gold-fish.png',
    'pet/tabby-cat.png',
    'pet/dog-a.png',
    'product/interactive-cat-toy.png',
    'product/clicker.png'
  ];
  
  console.log('\n🔍 Test URLs for validation:');
  testPaths.forEach(path => {
    const url = getImageUrl(path);
    console.log(`  ${path} → ${url}`);
  });
}

module.exports = {
  getImageUrl,
  getFallbackImage,
  cleanImagePath,
  enrichEntityWithImages,
  enrichEntitiesWithImages,
  generateTestUrls,
  GCS_BASE_URL,
  BUCKET_NAME
};