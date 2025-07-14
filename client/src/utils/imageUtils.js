// client/src/utils/imageUtils.js - CORRECTED VERSION

/**
 * Google Cloud Storage configuration - FIXED
 */
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

/**
 * CORRECT folder structure (singular, not plural!)
 */
const BUCKET_FOLDERS = {
  pet: 'pet',        // NOT 'pets'
  product: 'product', // NOT 'products'
  brand: 'brand'
};

/**
 * Map of working images in your bucket for fallbacks
 */
const WORKING_BUCKET_IMAGES = {
  pet: [
    'pet/betas-fish.jpg',
    'pet/kitten.png'
  ],
  product: [
    'product/clicker.png', 
    'product/dog-harness.png'
  ]
};

/**
 * Fallback images for when bucket images fail
 * Using reliable base64 SVG since via.placeholder.com is failing
 */
const DEFAULT_IMAGES = {
  pet: `https://storage.googleapis.com/furbabies-petstore/${WORKING_BUCKET_IMAGES.pet[0]}`,
  product: `https://storage.googleapis.com/furbabies-petstore/${WORKING_BUCKET_IMAGES.product[0]}`,
  brand: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOWI1OWI2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn48iIEJyYW5kPC90ZXh0Pgo8L3N2Zz4K',
  user: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzQ5OGRiIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5GkIFVzZXI8L3RleHQ+Cjwvc3ZnPgo='
};

/**
 * Get correct Google Cloud Storage URL
 * @param {string} imagePath - Path from database (e.g., "pet/cat.png" or just the filename)
 * @param {string} size - Size preset (unused for now)
 * @param {string} category - Category for fallbacks (pet, product, brand)
 * @returns {string} Complete Google Storage URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  // Handle invalid input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.warn('⚠️ No image path provided, using fallback');
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }

  // Return complete URLs as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Clean the path and ensure correct structure
  let cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  
  // 🚨 CRITICAL FIX: Correct plural paths to singular
  // Your database/API is returning "pets/" and "products/" but bucket uses "pet/" and "product/"
  cleanPath = cleanPath.replace(/^pets\//, 'pet/');
  cleanPath = cleanPath.replace(/^products\//, 'product/');
  
  console.log(`🔧 Path correction: "${imagePath}" → "${cleanPath}"`);
  
  // If path doesn't start with a folder, add the category folder
  if (!cleanPath.includes('/')) {
    cleanPath = `${BUCKET_FOLDERS[category] || 'pet'}/${cleanPath}`;
  }

  const finalUrl = `${BUCKET_BASE_URL}/${cleanPath}`;
  console.log('🔧 Generated URL:', finalUrl, 'from path:', imagePath);
  
  return finalUrl;
};

/**
 * Enhanced image props with proper error handling
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  const baseProps = {
    src: imageUrl,
    alt: alt || 'Image',
    onError: (e) => {
      const currentSrc = e.target.src;
      
      // Try fallback only once
      if (!e.target.hasTriedFallback && !currentSrc.includes('picsum')) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        e.target.src = fallbackUrl;
        
        console.warn(`🚫 Image failed to load: ${currentSrc}`);
        console.log(`🔄 Using fallback: ${fallbackUrl}`);
      } else {
        console.error(`❌ All fallbacks failed for: ${imagePath}`);
      }
    },
    onLoad: (e) => {
      if (e?.target) {
        delete e.target.hasTriedFallback;
        console.log('✅ Image loaded successfully:', e.target.src);
      }
    },
  };
  
  if (lazy) {
    baseProps.loading = 'lazy';
  }
  
  return baseProps;
};

/**
 * Get card image props - main function for components
 */
export const getCardImageProps = (item, size = 'medium') => {
  // Determine category from item
  let category = 'pet';
  
  if (item?.category) {
    if (['product', 'brand', 'user'].includes(item.category)) {
      category = item.category;
    }
  } else if (item?.type === 'product' || item?.price !== undefined) {
    category = 'product';
  }

  // Use imageUrl if available (from backend), otherwise use image field
  let imagePath = item?.imageUrl || item?.image;
  
  // 🚨 CRITICAL FIX: Correct backend-constructed URLs with wrong plural paths
  if (imagePath && typeof imagePath === 'string') {
    imagePath = imagePath.replace('/pets/', '/pet/');
    imagePath = imagePath.replace('/products/', '/product/');
  }
  
  const itemName = item?.name || item?.title || 'Item';
  const altText = `${itemName} - ${category}`;
  
  return getOptimizedImageProps(imagePath, altText, size, category, true);
};

/**
 * Debug function to test specific URLs
 */
export const debugSpecificUrls = async () => {
  const testUrls = [
    // Test from your console logs
    'https://storage.googleapis.com/furbabies-petstore/pet/persian-cat.jpg',
    'https://storage.googleapis.com/furbabies-petstore/product/dog-food.jpg',
    'https://storage.googleapis.com/furbabies-petstore/pet/golden-retriever.jpg',
    'https://storage.googleapis.com/furbabies-petstore/pet/labrador-mix.jpg',
    'https://storage.googleapis.com/furbabies-petstore/product/pet-carrier.jpg',
    'https://storage.googleapis.com/furbabies-petstore/product/scratching-post.jpg'
  ];

  console.log('🔍 Testing specific bucket URLs...');
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${response.ok ? '✅' : '❌'} ${url} - ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
};

/**
 * Test image paths from your JSON data
 */
export const testImagePaths = () => {
  const samplePaths = [
    'pet/betas-fish.jpg',
    'pet/persian-cat.jpg', 
    'product/clicker.png',
    'product/dog-harness.png'
  ];

  console.log('🔧 Testing path conversion:');
  samplePaths.forEach(path => {
    const url = getGoogleStorageUrl(path);
    console.log(`${path} → ${url}`);
  });
};

/**
 * Configuration object
 */
export const imageConfig = {
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  folders: BUCKET_FOLDERS,
  defaults: DEFAULT_IMAGES,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
};

// Test on module load
if (process.env.NODE_ENV === 'development') {
  console.log('📋 FurBabies Image Utils loaded with correct bucket structure:');
  console.log('   Pet folder: pet/ (not pets/)');
  console.log('   Product folder: product/ (not products/)');
  console.log('   Run testImagePaths() to verify path conversion');
}

export default {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  debugSpecificUrls,
  testImagePaths,
  imageConfig
};