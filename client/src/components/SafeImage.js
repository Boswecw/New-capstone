import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Fallback images that work
const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  chinchilla: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
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
  ...otherProps
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get fallback image based on category
  const getFallbackImage = useCallback(() => {
    let fallbackCategory = category?.toLowerCase() || 'default';
    
    // If we have an item, try to get category from it
    if (item) {
      if (item.type) {
        fallbackCategory = item.type.toLowerCase();
      } else if (item.category) {
        const cat = item.category.toLowerCase();
        if (cat.includes('dog')) fallbackCategory = 'dog';
        else if (cat.includes('cat')) fallbackCategory = 'cat';
        else fallbackCategory = 'product';
      } else if (item.price !== undefined) {
        fallbackCategory = 'product';
      }
    }
    
    return FALLBACK_IMAGES[fallbackCategory] || FALLBACK_IMAGES.default;
  }, [category, item]);

  // Build the image URL
  const buildImageUrl = useCallback(() => {
    // Priority: src prop > item.image/imageUrl > fallback
    let imagePath = src;
    
    if (!imagePath && item) {
      imagePath = item.image || item.imageUrl || item.imageFile || item.photo;
    }

    // If no image path, use fallback
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

    // Build the Google Cloud Storage URL
    const gcsUrl = `https://storage.googleapis.com/furbabies-petstore/${cleanPath}`;
    console.log(`🖼️ SafeImage - Building GCS URL: "${imagePath}" -> "${gcsUrl}"`);
    
    return gcsUrl;
  }, [src, item, getFallbackImage]);

  // Load the image
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      const imageUrl = buildImageUrl();
      console.log(`🖼️ SafeImage - Loading: "${imageUrl}"`);
      
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
          console.log(`❌ SafeImage - Error loading: "${imageUrl}"`);
          
          const fallbackUrl = getFallbackImage();
          console.log(`🔄 SafeImage - Switching to fallback: "${fallbackUrl}"`);
          
          // Try loading the fallback
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            if (isMounted) {
              setImageSrc(fallbackUrl);
              setLoading(false);
              setError(false);
              
              // Even fallback images should detect container type
              if (onContainerTypeDetected) {
                onContainerTypeDetected('square'); // Fallback images are typically square
              }
            }
          };
          
          fallbackImg.onerror = () => {
            if (isMounted) {
              console.log(`💥 SafeImage - Fallback also failed`);
              setLoading(false);
              setError(true);
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
  }, [buildImageUrl, getFallbackImage, onLoad, onError, onContainerTypeDetected]);

  // Loading state
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
          <div className="small text-muted">Loading image...</div>
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
  onContainerTypeDetected: PropTypes.func
};

export default SafeImage;