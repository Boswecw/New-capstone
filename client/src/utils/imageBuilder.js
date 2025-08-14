// client/src/utils/imageBuilder.js
/**
 * Build absolute image URLs safely in the browser.
 * Atlas JSON has image: "pet/..." or "product/..."
 * Example: https://storage.googleapis.com/furbabies-petstore/pet/black-gold-fish.png
 */

const DEFAULT_BASE = 'https://storage.googleapis.com/furbabies-petstore';
const IMAGE_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta &&
    import.meta.env &&
    import.meta.env.VITE_PUBLIC_IMAGE_BASE) ||
  DEFAULT_BASE;

// Simple fallbacks
const FALLBACK_URLS = {
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
  hamster: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
};

/** Normalize "pet/black-gold-fish.png" (no lowercasing/encoding) */
function normalizePath(path) {
  if (!path || typeof path !== 'string') return null;
  let cleaned = path.trim();
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(/^furbabies-petstore\//, '');
  cleaned = cleaned.replace(/^images\//, '');
  if (!cleaned.includes('/')) return null; // must be "category/filename"
  return cleaned;
}

/** Absolute URL from DB path, or as-is if already absolute. */
export function buildImageUrl(imagePath, opts = {}) {
  const { entityType = 'default', category = null, cacheKey } = opts;

  if (imagePath && /^https?:\/\//i.test(imagePath)) {
    return cacheKey ? `${imagePath}?v=${cacheKey}` : imagePath;
  }

  const normalized = normalizePath(imagePath);
  if (!normalized) {
    return getFallbackUrl(entityType, category);
  }

  const url = `${IMAGE_BASE_URL}/${normalized}`;
  return cacheKey ? `${url}?v=${cacheKey}` : url;
}

export function getFallbackUrl(entityType, category) {
  const key = (entityType || category || 'default').toString().toLowerCase();
  return FALLBACK_URLS[key] || FALLBACK_URLS.default;
}

/** Helper for typical entity shapes */
export function getEntityImageUrls(entity, opts = {}) {
  if (!entity) {
    const fallback = getFallbackUrl('default');
    return { primary: fallback, fallback };
  }

  const entityType = entity.type || opts.entityType || 'default';
  const category = entity.category || opts.category || null;

  const imagePath =
    entity.image ||
    entity.imagePath ||
    entity.imageUrl ||
    null;

  const cacheKey =
    opts.cacheKey ??
    (entity.updatedAt && (entity.updatedAt.$date || entity.updatedAt)) ??
    entity.updatedAt ??
    entity._id;

  return {
    primary: buildImageUrl(imagePath, { entityType, category, cacheKey }),
    fallback: getFallbackUrl(entityType, category),
  };
}

// Export both named and default to avoid import style mismatches
const imageBuilder = { buildImageUrl, getFallbackUrl, getEntityImageUrls };
export default imageBuilder;
