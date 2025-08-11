// client/src/components/SafeImage.js - ENHANCED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Enhanced fallback images - more comprehensive
const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  chinchilla: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  ferret: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  'guinea pig': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

const SafeImage = ({
  src,
  item,
  category = 'default',
  alt = '',
  className = '',
  style = {},
  size = 'medium',
  showLoader = false,
  onLoad,
  onError,
  onContainerTypeDetected,
  useProxy = false,  // ✅ NEW: Option to use proxy for CORS
  maxRetries = 2,    // ✅ NEW: Maximum retry attempts
  ...otherProps
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Get fallback image based on category - enhanced logic
  const getFallbackImage = useCallback(() => {
    let fallbackCategory = category?.toLowerCase() || 'default';
    
    // Enhanced item analysis for better fallback selection
    if (item) {
      if (item.type) {
        const itemType = item.type.toLowerCase();
        fallbackCategory = itemType;
        
        // Handle compound types
        if (itemType.includes('guinea pig')) fallbackCategory = 'guinea pig';
        else if (itemType.includes('hedge hog')) fallbackCategory = 'small-pet';
        else if (itemType.includes('fancy rat')) fallbackCategory = 'small-pet';
        
      } else if (item.category) {
        const cat = item.category.toLowerCase();
        if (cat.includes('dog')) fallbackCategory = 'dog';
        else if (cat.includes('cat')) fallbackCategory = 'cat';
        else if (cat.includes('aquatic') || cat.includes('fish')) fallbackCategory = 'fish';
        else if (cat.includes('other')) fallbackCategory = 'other';
        else fallbackCategory = 'product';
      } else if (item.price !== undefined || item.brand) {
        fallbackCategory = 'product';
      }
    }
    
    const fallbackUrl = FALLBACK_IMAGES[fallbackCategory] || FALLBACK_IMAGES.default;
    console.log(`🖼️ SafeImage - Fallback selected: "${fallbackCategory}" -> "${fallbackUrl}"`);
    return fallbackUrl;
  }, [category, item]);

  // ✅ ENHANCED: Build URL with multiple strategies
  const buildImageUrl = useCallback((attempt = 0) => {
    let imagePath = src;
    
    if (!imagePath && item) {
      imagePath = item.image || item.imageUrl || item.imageFile || item.photo;
    }

    // If no image path, use fallback immediately
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
      const fallbackUrl = getFallbackImage();
      console.log(`🖼️ SafeImage - No image path, using fallback: "${fallbackUrl}"`);
      return fallbackUrl;
    }

    // Clean the path
    let cleanPath = imagePath.trim();
    
    // Remove leading slashes
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Remove 'images/' prefix if present
    if (cleanPath.startsWith('images/')) {
      cleanPath = cleanPath.substring(7);
    }
    
    // If it's already a full URL, return it
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      console.log(`🖼️ SafeImage - Already full URL: "${cleanPath}"`);
      return cleanPath;
    }

    // ✅ NEW: Multiple URL strategies based on attempt
    if (attempt === 0 || !useProxy) {
      // First attempt: Direct GCS URL
      const gcsUrl = `https://storage.googleapis.com/furbabies-petstore/${encodeURIComponent(cleanPath)}`;
      console.log(`🖼️ SafeImage - Building GCS URL (attempt ${attempt}): "${imagePath}" -> "${gcsUrl}"`);
      return gcsUrl;
    } else {
      // Second attempt: Proxy URL (if available)
      const proxyBaseUrl = process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL?.replace('/api', '') + '/api/images/gcs'
        : 'http://localhost:5000/api/images/gcs';

      const proxyUrl = `${proxyBaseUrl}/${encodeURIComponent(cleanPath)}`;
      console.log(`🖼️ SafeImage - Building Proxy URL (attempt ${attempt}): "${imagePath}" -> "${proxyUrl}"`);
      return proxyUrl;
    }
  }, [src, item, getFallbackImage, useProxy]);

  // ✅ ENHANCED: Load image with retry logic
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      const imageUrl = buildImageUrl(retryCount);
      console.log(`🖼️ SafeImage - Loading (attempt ${retryCount + 1}): "${imageUrl}"`);
      
      const img = new Image();
      
      img.onload = () => {
        if (isMounted) {
          setImageSrc(imageUrl);
          setLoading(false);
          setError(false);
          console.log(`✅ SafeImage - Image loaded successfully: "${imageUrl}"`);
          
          // Detect container type based on image aspect ratio
          if (onContainerTypeDetected) {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let containerType = 'square'; // default
            
            if (aspectRatio < 0.6) {
              containerType = 'tall';     // Very tall/narrow images (< 0.6)
            } else if (aspectRatio < 0.85) {
              containerType = 'portrait'; // Moderately tall images (0.6 - 0.85)
            } else if (aspectRatio > 1.5) {
              containerType = 'landscape'; // Wide images (> 1.5)
            } else {
              containerType = 'square';    // Square-ish images (0.85 - 1.5)
            }
            
            console.log(`📐 SafeImage - Aspect ratio: ${aspectRatio.toFixed(2)} -> Container: ${containerType}`);
            onContainerTypeDetected(containerType);
          }
          
          if (onLoad) onLoad();
        }
      };
      
      img.onerror = () => {
        if (isMounted) {
          console.log(`❌ SafeImage - Error loading (attempt ${retryCount + 1}): "${imageUrl}"`);
          
          // ✅ ENHANCED: Retry logic before falling back
          if (retryCount < maxRetries && (useProxy || retryCount === 0)) {
            console.log(`🔄 SafeImage - Retrying with different strategy (${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);
            return;
          }
          
          // All retries failed, use fallback
          const fallbackUrl = getFallbackImage();
          console.log(`🔄 SafeImage - All attempts failed, switching to fallback: "${fallbackUrl}"`);
          
          // Try loading the fallback
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            if (isMounted) {
              setImageSrc(fallbackUrl);
              setLoading(false);
              setError(false);
              setRetryCount(0); // Reset for next image
              
              if (onContainerTypeDetected) {
                onContainerTypeDetected('square');
              }
            }
          };
          
          fallbackImg.onerror = () => {
            if (isMounted) {
              console.log(`💥 SafeImage - Fallback also failed`);
              setLoading(false);
              setError(true);
              setRetryCount(0); // Reset for next image
              if (onError) onError();
              if (onContainerTypeDetected) onContainerTypeDetected('square');
            }
          };
          
          fallbackImg.src = fallbackUrl;
        }
      };
      
      img.src = imageUrl;
    };

    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [buildImageUrl, getFallbackImage, onLoad, onError, onContainerTypeDetected, retryCount, maxRetries, useProxy]);

  // Reset retry count when src changes
  useEffect(() => {
    setRetryCount(0);
  }, [src, item]);

  // ✅ ENHANCED: Better loading state
  if (loading && showLoader) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ 
          ...style, 
          minHeight: style.height || '200px',
          width: style.width || '100%'
        }}
      >
        <div className="text-center">
          <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="small text-muted">
            Loading image...
            {retryCount > 0 && <div className="tiny">Retry {retryCount}/{maxRetries}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ 
          ...style, 
          minHeight: style.height || '200px',
          width: style.width || '100%'
        }}
      >
        <div className="text-center text-muted">
          <i className="fas fa-image fa-2x mb-2"></i>
          <div className="small">Image not available</div>
        </div>
      </div>
    );
  }

  // Clean props to avoid passing non-DOM props to img element
  const cleanProps = { ...otherProps };
  delete cleanProps.item;
  delete cleanProps.category;
  delete cleanProps.size;
  delete cleanProps.showLoader; 
  delete cleanProps.onContainerTypeDetected;
  delete cleanProps.useProxy;
  delete cleanProps.maxRetries;

  return (
    <img
      src={imageSrc}
      alt={alt || (item?.name ? `Photo of ${item.name}` : 'Image')}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style
      }}
      loading="lazy"
      {...cleanProps}
    />
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  item: PropTypes.object,
  category: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.string,
  showLoader: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  onContainerTypeDetected: PropTypes.func,
  useProxy: PropTypes.bool,
  maxRetries: PropTypes.number
};

export default SafeImage;