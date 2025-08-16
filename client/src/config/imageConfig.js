// client/src/config/imageConfig.js

// Base URL for your Google Cloud Storage bucket
const GCS_BASE_URL = 'https://storage.googleapis.com/furbabies-petstore';

// Hardcoded image mappings from your JSON data
export const PET_IMAGES = {
  // Dogs
  'pet/blue-heeler-pup.png': `${GCS_BASE_URL}/pet/blue-heeler-pup.png`,
  'pet/chihuahua.jpg': `${GCS_BASE_URL}/pet/chihuahua.jpg`,
  'pet/dachshund-pup.png': `${GCS_BASE_URL}/pet/dachshund-pup.png`,
  'pet/dog-b.png': `${GCS_BASE_URL}/pet/dog-b.png`,
  'pet/german-shepherd-pup-medium-hair.png': `${GCS_BASE_URL}/pet/german-shepherd-pup-medium-hair.png`,
  'pet/german-shepherd-pup-long-hair.png': `${GCS_BASE_URL}/pet/german-shepherd-pup-long-hair.png`,
  'pet/golden-retriever-pup.png': `${GCS_BASE_URL}/pet/golden-retriever-pup.png`,
  'pet/golden-retriever.png': `${GCS_BASE_URL}/pet/golden-retriever.png`,
  'pet/lab-puppy-B.png': `${GCS_BASE_URL}/pet/lab-puppy-B.png`,
  'pet/labadoodle.png': `${GCS_BASE_URL}/pet/labadoodle.png`,
  'pet/saint-bernard-pup.png': `${GCS_BASE_URL}/pet/saint-bernard-pup.png`,
  'pet/terrier-pup.png': `${GCS_BASE_URL}/pet/terrier-pup.png`,
  'pet/dog-a.png': `${GCS_BASE_URL}/pet/dog-a.png`,
  'pet/yellow-lab-pups.png': `${GCS_BASE_URL}/pet/yellow-lab-pups.png`,
  'pet/yellow-lab-pup-A.png': `${GCS_BASE_URL}/pet/yellow-lab-pup-A.png`,
  'pet/yellow-lab-pup.png': `${GCS_BASE_URL}/pet/yellow-lab-pup.png`,

  // Cats
  'pet/cat.png': `${GCS_BASE_URL}/pet/cat.png`,
  'pet/grey-kitten.png': `${GCS_BASE_URL}/pet/grey-kitten.png`,
  'pet/himalayan.jpg': `${GCS_BASE_URL}/pet/himalayan.jpg`,
  'pet/russian-blue-cat.png': `${GCS_BASE_URL}/pet/russian-blue-cat.png`,
  'pet/russian-Blue.png': `${GCS_BASE_URL}/pet/russian-Blue.png`,
  'pet/siamese.png': `${GCS_BASE_URL}/pet/siamese.png`,
  'pet/tabby-cat.png': `${GCS_BASE_URL}/pet/tabby-cat.png`,
  'pet/tiger-cat.png': `${GCS_BASE_URL}/pet/tiger-cat.png`,
  'pet/tiger-cat-A.png': `${GCS_BASE_URL}/pet/tiger-cat-A.png`,
  'pet/young-tiger-kitten.png': `${GCS_BASE_URL}/pet/young-tiger-kitten.png`,

  // Fish & Aquatic
  'pet/beta-fish.jpg': `${GCS_BASE_URL}/pet/beta-fish.jpg`,
  'pet/black-gold-fish.png': `${GCS_BASE_URL}/pet/black-gold-fish.png`,
  'pet/clown-fish.png': `${GCS_BASE_URL}/pet/clown-fish.png`,
  'pet/fish.png': `${GCS_BASE_URL}/pet/fish.png`,
  'pet/glow-fish.jpg': `${GCS_BASE_URL}/pet/glow-fish.jpg`,
  'pet/purple-fish.jpg': `${GCS_BASE_URL}/pet/purple-fish.jpg`,
  'pet/red-white-fish.jpg': `${GCS_BASE_URL}/pet/red-white-fish.jpg`,

  // Birds
  'pet/macaw.png': `${GCS_BASE_URL}/pet/macaw.png`,

  // Small Animals
  'pet/chinchilla.png': `${GCS_BASE_URL}/pet/chinchilla.png`,
  'pet/chinchilla-A.png': `${GCS_BASE_URL}/pet/chinchilla-A.png`,
  'pet/fancy-rat-A.png': `${GCS_BASE_URL}/pet/fancy-rat-A.png`,
  'pet/fancy-rat.png': `${GCS_BASE_URL}/pet/fancy-rat.png`,
  'pet/ferret-A.png': `${GCS_BASE_URL}/pet/ferret-A.png`,
  'pet/ferret.png': `${GCS_BASE_URL}/pet/ferret.png`,
  'pet/ferret-long-coat.jpg': `${GCS_BASE_URL}/pet/ferret-long-coat.jpg`,
  'pet/gerbil.png': `${GCS_BASE_URL}/pet/gerbil.png`,
  'pet/grey-rat.png': `${GCS_BASE_URL}/pet/grey-rat.png`,
  'pet/guinea-pig.png': `${GCS_BASE_URL}/pet/guinea-pig.png`,
  'pet/hamster.png': `${GCS_BASE_URL}/pet/hamster.png`,
  'pet/hedge-hog-A.jpg': `${GCS_BASE_URL}/pet/hedge-hog-A.jpg`,
  'pet/hedge-hog.png': `${GCS_BASE_URL}/pet/hedge-hog.png`,
  'pet/long-hair-rat.png': `${GCS_BASE_URL}/pet/long-hair-rat.png`,
  'pet/rabbit.png': `${GCS_BASE_URL}/pet/rabbit.png`,
  'pet/long-coat-rabbit.png': `${GCS_BASE_URL}/pet/long-coat-rabbit.png`,
  'pet/rat.png': `${GCS_BASE_URL}/pet/rat.png`,
  'pet/stoat.png': `${GCS_BASE_URL}/pet/stoat.png`,
  'pet/sugar-glider.png': `${GCS_BASE_URL}/pet/sugar-glider.png`,
  'pet/teddy-bear-hamster.png': `${GCS_BASE_URL}/pet/teddy-bear-hamster.png`,
  'pet/tricolor-guinea-pig-A.png': `${GCS_BASE_URL}/pet/tricolor-guinea-pig-A.png`,
  'pet/tricolor-guinea-pig.png': `${GCS_BASE_URL}/pet/tricolor-guinea-pig.png`,
  'pet/white-hamster.png': `${GCS_BASE_URL}/pet/white-hamster.png`,
};

export const PRODUCT_IMAGES = {
  'product/clicker.png': `${GCS_BASE_URL}/product/clicker.png`,
  'product/covered-litter-box.png': `${GCS_BASE_URL}/product/covered-litter-box.png`,
  'product/dog-harness.png': `${GCS_BASE_URL}/product/dog-harness.png`,
  'product/harness.png': `${GCS_BASE_URL}/product/harness.png`,
  'product/interactive-cat-toy.png': `${GCS_BASE_URL}/product/interactive-cat-toy.png`,
  'product/kibble-dog-food.png': `${GCS_BASE_URL}/product/kibble-dog-food.png`,
  'product/large-breed-dog-bed.png': `${GCS_BASE_URL}/product/large-breed-dog-bed.png`,
  'product/large-fish-tank.png': `${GCS_BASE_URL}/product/large-fish-tank.png`,
  'product/leash.png': `${GCS_BASE_URL}/product/leash.png`,
  'product/litter-box.png': `${GCS_BASE_URL}/product/litter-box.png`,
  'product/medium-fish-tank.png': `${GCS_BASE_URL}/product/medium-fish-tank.png`,
  'product/nail-trimmers.png': `${GCS_BASE_URL}/product/nail-trimmers.png`,
  'product/premium-dog-food.png': `${GCS_BASE_URL}/product/premium-dog-food.png`,
  'product/red-spinner-cat-toy.png': `${GCS_BASE_URL}/product/red-spinner-cat-toy.png`,
  'product/small-fish-tank.png': `${GCS_BASE_URL}/product/small-fish-tank.png`,
};

// Fallback images for when the main image fails
export const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
};

/**
 * Get the correct image URL for a pet
 * @param {string} imagePath - The image path from the database
 * @param {string} petType - The type of pet (for fallback)
 * @returns {string} The full image URL
 */
export function getPetImageUrl(imagePath, petType = 'pet') {
  if (!imagePath) {
    return FALLBACK_IMAGES[petType] || FALLBACK_IMAGES.pet;
  }

  // Check if it's in our hardcoded mapping
  if (PET_IMAGES[imagePath]) {
    return PET_IMAGES[imagePath];
  }

  // If not found, construct URL directly
  const url = imagePath.startsWith('http') 
    ? imagePath 
    : `${GCS_BASE_URL}/${imagePath}`;

  return url;
}

/**
 * Get the correct image URL for a product
 * @param {string} imagePath - The image path from the database
 * @returns {string} The full image URL
 */
export function getProductImageUrl(imagePath) {
  if (!imagePath) {
    return FALLBACK_IMAGES.product;
  }

  // Check if it's in our hardcoded mapping
  if (PRODUCT_IMAGES[imagePath]) {
    return PRODUCT_IMAGES[imagePath];
  }

  // If not found, construct URL directly
  const url = imagePath.startsWith('http') 
    ? imagePath 
    : `${GCS_BASE_URL}/${imagePath}`;

  return url;
}

/**
 * Simple image component with error handling
 */
export function SafeImage({ src, alt, fallback, className, ...props }) {
  const handleError = (e) => {
    if (fallback && e.target.src !== fallback) {
      e.target.src = fallback;
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}