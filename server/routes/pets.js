// server/routes/pets.js - FIXED IMAGE URL CONSTRUCTION

// 🚨 CRITICAL FIX: Helper function to correct image paths
const getCorrectImageUrl = (imagePath, type = 'pet') => {
  if (!imagePath) return null;
  
  // Clean and correct the path
  let cleanPath = imagePath.trim();
  
  // Fix plural paths to singular
  cleanPath = cleanPath.replace(/^pets\//, 'pet/');
  cleanPath = cleanPath.replace(/^products\//, 'product/');
  
  // If path doesn't start with correct folder, add it
  if (!cleanPath.includes('/')) {
    const folder = type === 'product' ? 'product' : 'pet';
    cleanPath = `${folder}/${cleanPath}`;
  }
  
  return `https://storage.googleapis.com/furbabies-petstore/${cleanPath}`;
};

// In your GET /api/pets route - REPLACE the imageUrl construction:
const enrichedPets = pets.map(pet => ({
  ...pet.toObject(),
  // 🚨 FIXED: Use corrected image URL construction
  imageUrl: getCorrectImageUrl(pet.image, 'pet'),
  hasImage: !!pet.image,
  displayName: pet.name || 'Unnamed Pet',
  isAvailable: pet.status === 'available',
  daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
}));

// For single pet route - REPLACE:
const enrichedPet = {
  ...pet.toObject(),
  // 🚨 FIXED: Use corrected image URL construction  
  imageUrl: getCorrectImageUrl(pet.image, 'pet'),
  hasImage: !!pet.image,
  displayName: pet.name || 'Unnamed Pet',
  isAvailable: pet.status === 'available',
  daysSincePosted: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
};

// ============================================
// server/routes/products.js - FIXED IMAGE URL CONSTRUCTION
// ============================================

// In your GET /api/products route - REPLACE the imageUrl construction:
const enrichedProducts = products.map(product => ({
  ...product.toObject(),
  // 🚨 FIXED: Use corrected image URL construction
  imageUrl: getCorrectImageUrl(product.image, 'product'),
  hasImage: !!product.image,
  displayName: product.name || product.title || 'Unnamed Product'
}));

// For single product route - REPLACE:
const enrichedProduct = {
  ...product.toObject(),
  // 🚨 FIXED: Use corrected image URL construction
  imageUrl: getCorrectImageUrl(product.image, 'product'),
  hasImage: !!product.image,
  displayName: product.name || product.title || 'Unnamed Product'
};

// ============================================
// ALTERNATIVE: If you can't modify backend routes immediately,
// you can fix this in your frontend imageUtils.js:
// ============================================

// Add this to client/src/utils/imageUtils.js - in getCardImageProps function:
export const getCardImageProps = (item, size = 'medium') => {
  // ... existing code ...

  // 🚨 FIX: Correct backend-constructed imageUrl if it has wrong paths
  let imagePath = item?.imageUrl || item?.image;
  
  if (imagePath && typeof imagePath === 'string') {
    // Fix URLs that backend constructed incorrectly
    imagePath = imagePath.replace('/pets/', '/pet/');
    imagePath = imagePath.replace('/products/', '/product/');
  }

  const altText = `${itemName} - ${category}`;
  
  return getOptimizedImageProps(imagePath, altText, size, category, true);
};