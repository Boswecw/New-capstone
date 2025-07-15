// client/src/utils/imageUtils.js - COMPLETELY FIXED VERSION

/**
 * Google Cloud Storage configuration
 */
const BUCKET_NAME = "furbabies-petstore";
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

/**
 * Default fallback images based on content type
 */
const DEFAULT_IMAGES = {
  pet: "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+Pet",
  product: "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=🛍️+Product",
  brand: "https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=🏢+Brand",
  user: "https://via.placeholder.com/300x300/3498DB/FFFFFF?text=👤+User",
  news: "https://via.placeholder.com/400x300/E67E22/FFFFFF?text=📰+News",
};

/**
 * Get Google Cloud Storage URL from image path
 * @param {string} imagePath - Image path from database (e.g., "pet/cat.png")
 * @param {string} size - Size preset (unused for now, for future optimization)
 * @param {string} category - Category for fallback selection
 * @returns {string} Complete image URL
 */
export const getGoogleStorageUrl = (
  imagePath,
  size = "medium",
  category = "pet"
) => {
  // Handle invalid input
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }

  // Return complete URLs as-is (from backend imageUrl field)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Clean relative paths and construct full GCS URL
  const cleanPath = imagePath.trim().replace(/^\/+/, "").replace(/\/+/g, "/");
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

/**
 * Get optimized image props for React components
 * @param {string} imagePath - Image path or full URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} size - Size preset
 * @param {string} category - Category for fallback
 * @param {boolean} lazy - Enable lazy loading
 * @returns {object} Complete image props with error handling
 */
export const getOptimizedImageProps = (
  imagePath,
  alt,
  size = "medium",
  category = "pet",
  lazy = true
) => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);

  const baseProps = {
    src: imageUrl,
    alt: alt || "Content",
    onError: (e) => {
      const currentSrc = e.target.src;

      // Only try fallback once to prevent infinite loops
      if (!e.target.hasTriedFallback && !currentSrc.includes("placeholder")) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        e.target.src = fallbackUrl;
        console.warn(
          `Image failed to load: ${currentSrc}, using fallback: ${fallbackUrl}`
        );
      }
    },
    onLoad: (e) => {
      // Clean up retry flag on successful load
      if (e && e.target) {
        delete e.target.hasTriedFallback;
      }
    },
  };

  // ✅ FIXED: Add lazy loading attributes if requested (was missing closing brace)
  if (lazy) {
    baseProps.loading = "lazy";
    baseProps.decoding = "async";
  }

  return baseProps;
};

/**
 * Smart utility for card components (pets and products)
 * Prioritizes backend-constructed URLs over raw database paths
 * @param {object} item - Pet or product object from API
 * @param {string} size - Size preset
 * @returns {object} Complete image props ready for React components
 */
export const getCardImageProps = (item, size = "medium") => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.pet,
      alt: "Content unavailable",
      loading: "lazy",
    };
  }

  // 🚀 KEY FIX: Prioritize backend-constructed imageUrl over raw image path
  // Backend should send both:
  // - image: "pet/cat.png" (raw database path)
  // - imageUrl: "https://storage.googleapis.com/furbabies-petstore/pet/cat.png" (constructed URL)
  const imagePath = item.imageUrl || item.image || item.photo;

  // Determine content category for appropriate fallbacks
  const isProduct =
    item.price !== undefined ||
    item.category === "product" ||
    (item.category &&
      typeof item.category === "string" &&
      [
        "food",
        "toy",
        "accessory",
        "care",
        "training",
        "grooming",
        "aquarium",
      ].some((keyword) => item.category.toLowerCase().includes(keyword)));

  const category = isProduct ? "product" : "pet";

  // Generate meaningful alt text
  let alt;
  if (category === "pet") {
    const petName = item.name || "";
    const petBreed = item.breed || "";
    const petType = item.type || "";
    alt =
      [petName, petBreed, petType].filter(Boolean).join(", ") ||
      "Pet available for adoption";
  } else {
    const productName = item.name || "";
    const productCategory = item.category || "";
    alt =
      [productName, productCategory].filter(Boolean).join(" - ") ||
      "Pet product";
  }

  return getOptimizedImageProps(imagePath, alt, size, category, true);
};

/**
 * Background image CSS generator for hero sections, banners, etc.
 * @param {string} imagePath - Image path or URL
 * @param {string} category - Category for fallback
 * @returns {object} CSS styles for background image
 */
export const getBackgroundImageStyle = (imagePath, category = "pet") => {
  const imageUrl = getGoogleStorageUrl(imagePath, "large", category);

  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
};

/**
 * Preload critical images for better performance
 * @param {Array<string>} imagePaths - Array of image paths to preload
 * @param {string} category - Category for fallbacks
 */
export const preloadImages = (imagePaths, category = "pet") => {
  if (!Array.isArray(imagePaths)) return;

  imagePaths.forEach((path) => {
    if (path) {
      const img = new Image();
      img.src = getGoogleStorageUrl(path, "medium", category);
    }
  });
};

/**
 * Check if an image URL is likely to load successfully
 * @param {string} imageUrl - Full image URL
 * @returns {Promise<boolean>} Promise that resolves to true if image loads
 */
export const checkImageExists = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl || typeof imageUrl !== "string") {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;

    // Timeout after 10 seconds
    setTimeout(() => resolve(false), 10000);
  });
};

/**
 * Get image dimensions without loading the full image
 * @param {string} imageUrl - Full image URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
};

/**
 * Utility to handle image loading states in components
 * @param {string} imageUrl - Image URL to load
 * @returns {object} Loading state and handlers
 */
export const useImageLoadingState = (imageUrl) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    setLoaded(false);
  }, []);

  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setError(false);
      setLoaded(false);
    }
  }, [imageUrl]);

  return {
    loading,
    error,
    loaded,
    handleLoad,
    handleError,
  };
};

// Export common image URLs for convenience
export const COMMON_IMAGES = {
  // Pet placeholders
  DOG_PLACEHOLDER: DEFAULT_IMAGES.pet.replace("🐾+Pet", "🐕+Dog"),
  CAT_PLACEHOLDER: DEFAULT_IMAGES.pet.replace("🐾+Pet", "🐱+Cat"),
  FISH_PLACEHOLDER: DEFAULT_IMAGES.pet.replace("🐾+Pet", "🐠+Fish"),

  // Product placeholders
  FOOD_PLACEHOLDER: DEFAULT_IMAGES.product.replace("🛍️+Product", "🥫+Food"),
  TOY_PLACEHOLDER: DEFAULT_IMAGES.product.replace("🛍️+Product", "🎾+Toy"),
  ACCESSORY_PLACEHOLDER: DEFAULT_IMAGES.product.replace(
    "🛍️+Product",
    "👔+Accessory"
  ),
};

export default {
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getCardImageProps,
  getBackgroundImageStyle,
  preloadImages,
  checkImageExists,
  getImageDimensions,
  useImageLoadingState,
  DEFAULT_IMAGES,
  COMMON_IMAGES,
};
