// server/utils/imageUtils.js

// Public base URL for your GCS bucket (no trailing slash)
const BASE_URL = 'https://storage.googleapis.com/furbabies-petstore';

/**
 * Build a public GCS URL from a stored image path.
 * - Returns null if no path
 * - Returns as-is if already an http(s) URL
 * - Strips leading slashes, no encodeURIComponent (paths are already web-safe)
 * @param {string|null|undefined} imagePath
 * @returns {string|null}
 */
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (typeof imagePath !== 'string') return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/^\/+/, ''); // remove leading slashes
  return `${BASE_URL}/${cleanPath}`;
}

/**
 * Attach derived image URLs to a plain object (e.g., from doc.toObject()).
 * Adds:
 *  - imageUrl: resolved public URL (or null)
 *  - fallbackImageUrl: API fallback endpoint based on entityType
 * @param {object} item
 * @param {'pet'|'product'|'general'} [entityType='general']
 * @returns {object}
 */
function addImageFields(item, entityType = 'general') {
  const src =
    (item && (item.image || item.imageUrl)) || null;

  const imageUrl = getImageUrl(src);

  return {
    ...item,
    imageUrl,
    fallbackImageUrl: `/api/images/fallback/${entityType}`,
  };
}

module.exports = {
  getImageUrl,
  addImageFields,
};
