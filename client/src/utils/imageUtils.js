// client/src/utils/imageUtils.js
import { getPublicImageUrl } from './bucketUtils';

/**
 * Get Google Cloud Storage URL for images
 * Compatible with your existing PetCard.js
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium') => {
  if (!imagePath) return '/images/pet/default-pet.png';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // If it's a relative path starting with /, build the full URL using API base
  if (imagePath.startsWith('/')) {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseURL.replace('/api', '')}${imagePath}`;
  }
  
  // Use your existing bucket utils for GCS URLs
  return getPublicImageUrl(imagePath);
};

/**
 * Generate responsive image srcSet
 * Compatible with your existing PetCard.js
 */
export const generateSrcSet = (imagePath) => {
  if (!imagePath) return '';
  
  const sizes = [
    { suffix: 'small', width: 300 },
    { suffix: 'medium', width: 600 },
    { suffix: 'large', width: 1200 }
  ];
  
  return sizes
    .map(({ suffix, width }) => `${getGoogleStorageUrl(imagePath, suffix)} ${width}w`)
    .join(', ');
};