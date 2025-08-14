// client/src/utils/imageBuilder.js
/**
 * Unified image URL builder for browser environments
 * NO Node.js dependencies allowed
 */

const IMAGE_BASE_URL =
  import.meta?.env?.VITE_PUBLIC_IMAGE_BASE ||
  'https://storage.googleapis.com/furbabies-petstore';

const FALLBACK_URLS = {
  // Pet fallbacks by type
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  hamster: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',

  // Product fallbacks by category (normalized)
  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  'grooming & health':
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',

  // Generic fallbacks
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
};

/**
 * Normalize and validate image path
 * @param {string} path - Raw path from database
 * @returns {string|null} Cleaned path or null if invalid
 */
function normalizePath(path) {
  if (!path || typeof path !== 'string') return null;

  // Trim whitespace
  let cleaned = path.trim();

  // Remove leading slashes or common prefixes if present
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(/^images\//, '');
  cleaned = cleaned.replace(/^furbabies-petstore\//, '');

  // Validate format (should be category/filename)
  if (!cleaned.includes('/')) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid image path format: ${path}`);
    return null;
  }

  return cleaned;
}

/**
 * Build full GCS URL from path
 * @param {string} imagePath - Path from database (e.g., "pets/dog.png")
 * @param {object} options - { entityType, category }
 * @returns {string} Full URL or fallback
 */
export function buildImageUrl(imagePath, options = {}) {
  const { entityType = 'default', category = null } = options;

  // If already a full URL, return as-is
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }

  // Normalize the path
  const normalizedPath = normalizePath(imagePath);

  // Return fallback if path is invalid
  if (!normalizedPath) {
    return getFallbackUrl(entityType, category);
  }

  // Build the full URL - NO ENCODING! (GCS paths should already be web‑safe)
  const fullUrl = `${IMAGE_BASE_URL}/${normalizedPath}`;

  // eslint-disable-next-line no-console
  console.log('Built image URL:', {
    input: imagePath,
    normalized: normalizedPath,
    output: fullUrl,
  });

  return fullUrl;
}

/**
 * Get appropriate fallback URL
 * @param {string} entityType - Type of entity (dog, cat, product, etc.)
 * @param {string} category - Category for products
 * @returns {string} Fallback URL
 */
export function getFallbackUrl(entityType, category) {
  // Try category first (for products)
  if (category) {
    const normalizedCategory = String(category).toLowerCase();
    if (FALLBACK_URLS[normalizedCategory]) {
      return FALLBACK_URLS[normalizedCategory];
    }
  }

  // Then try entity type
  const normalizedType = (entityType || 'default').toLowerCase();
  return FALLBACK_URLS[normalizedType] || FALLBACK_URLS.default;
}

/**
 * Extract image info from entity
 * @param {object} entity - Pet or Product document
 * @returns {{primary: string, fallback: string}} Image URLs
 */
export function getEntityImageUrls(entity) {
  if (!entity) {
    return {
      primary: FALLBACK_URLS.default,
      fallback: FALLBACK_URLS.default,
    };
  }

  const entityType = entity.type || 'default';
  const category = entity.category;

  // Try multiple possible image fields
  const imagePath = entity.image || entity.imageUrl || entity.imagePath;

  return {
    primary: buildImageUrl(imagePath, { entityType, category }),
    fallback: getFallbackUrl(entityType, category),
  };
}

// Named exports for tree-shaking
const imageBuilder = {
  buildImageUrl,
  getFallbackUrl,
  getEntityImageUrls,
};

export default imageBuilder;
