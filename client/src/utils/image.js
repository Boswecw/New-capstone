// Returns a usable image URL or null
export function normalizeImageUrl(src) {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/api/images')) return src;
  const clean = src.replace(/^\/+/, '');
  return `/api/images/gcs/${clean}`;
}

