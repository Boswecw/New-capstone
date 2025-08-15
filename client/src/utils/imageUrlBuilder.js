// client/src/utils/imageUrlBuilder.js

// Resolve base once. Prefer env; fallback to your GCS bucket.
const IMAGE_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_PUBLIC_IMAGE_BASE ||
     import.meta.env?.VITE_IMAGE_BASE_URL)) ||
  'https://storage.googleapis.com/furbabies-petstore';

// Fallbacks for when an explicit image path/URL is missing or fails.
const FALLBACK_URLS = {
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  hamster: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',

  'dog care': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
  'cat care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  'grooming & health': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',

  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
};

/**
 * Normalize and validate a storage path.
 * Accepts values like:
 *   "pet/black-gold-fish.png"
 *   "/pet/black-gold-fish.png"
 *   "images/pet/black-gold-fish.png"
 * Returns "pet/black-gold-fish.png" or null if invalid.
 */
function normalizePath(path) {
  if (!path || typeof path !== 'string') return null;

  let cleaned = path.trim();
  cleaned = cleaned.replace(/^\/+/, '');           // leading slashes
  cleaned = cleaned.replace(/^images\//, '');      // strip "images/" prefix
  cleaned = cleaned.replace(/^furbabies-petstore\//, ''); // safety: strip bucket prefix

  // Require at least "category/filename"
  if (!cleaned.includes('/')) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid image path format: ${path}`);
    return null;
  }

  return cleaned;
}

/**
 * Return a fallback image URL for an entity type and optional category.
 */
export function getFallbackUrl(entityType, category) {
  if (category) {
    const normalizedCategory = String(category).toLowerCase();
    if (FALLBACK_URLS[normalizedCategory]) {
      return FALLBACK_URLS[normalizedCategory];
    }
  }

  const normalizedType =
    (entityType && String(entityType).toLowerCase()) || 'default';

  return FALLBACK_URLS[normalizedType] || FALLBACK_URLS.default;
}

/**
 * Build a full image URL.
 * - If `imagePath` is already an absolute URL, return it.
 * - Otherwise normalize and join with IMAGE_BASE_URL.
 * - If invalid/missing, return fallback.
 */
export function buildImageUrl(imagePath, options = {}) {
  const { entityType = 'default', category = null } = options;

  // Absolute URL? Return as-is.
  if (
    typeof imagePath === 'string' &&
    (imagePath.startsWith('http://') || imagePath.startsWith('https://'))
  ) {
    return imagePath;
  }

  const normalized = normalizePath(imagePath);

  if (!normalized) {
    return getFallbackUrl(entityType, category);
  }

  const url = `${IMAGE_BASE_URL}/${normalized}`;

  // Dev logging only (tiny + safe)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('🖼️ Image URL built:', {
      input: imagePath,
      normalized,
      url,
    });
  }

  return url;
}

/**
 * Extract best-guess image fields from an entity and return
 * primary/fallback URLs for use in UI.
 */
export function getEntityImageUrls(entity) {
  if (!entity) {
    return { primary: FALLBACK_URLS.default, fallback: FALLBACK_URLS.default };
  }

  const entityType = entity.type || 'default';
  const category = entity.category;

  // Try several common fields (pets + products)
  const path =
    entity.image ||
    entity.imageUrl ||
    entity.imagePath ||
    entity.photo ||
    entity.picture;

  return {
    primary: buildImageUrl(path, { entityType, category }),
    fallback: getFallbackUrl(entityType, category),
  };
}

// Named + default export (assigned to a variable to satisfy eslint rule)
const imageUrlBuilder = {
  buildImageUrl,
  getFallbackUrl,
  getEntityImageUrls,
};

export default imageUrlBuilder;
