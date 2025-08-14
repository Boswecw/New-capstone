// client/src/components/SafeImage.js - UPDATED WITH CONSOLIDATED IMAGE UTILITY
import React, { useState, useCallback, useEffect } from 'react';
import { getImageUrl, generateAltText } from '../utils/imageUtils';

const SafeImage = ({ 
  // Image source options
  src,
  item,
  entityType = 'default',
  category = null,
  
  // Display options
  size = 'medium',
  showLoader = true,
  showErrorMessage = false,
  
  // Styling
  className = '',
  style = {},
  
  // Events
  onLoad,
  onError,
  onLoadStart,
  
  // Image props
  alt,
  ...imgProps 
}) => {
  const [loading, setLoading] = useState(showLoader);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Determine the image source
  const getImageSource = useCallback(() => {
    if (src) {
      // Direct src provided
      return getImageUrl(src, entityType, category);
    } else if (item) {
      // Extract from item object  
      const itemImagePath = item.image || item.imageUrl || item.photo || item.picture;
      const itemEntityType = entityType || item.type || 'default';
      const itemCategory = category || item.category;
      return getImageUrl(itemImagePath, itemEntityType, itemCategory);
    } else {
      // No source, use fallback
      return getImageUrl(null, entityType, category);
    }
  }, [src, item, entityType, category]);

  // Generate alt text
  const getAltText = useCallback(() => {
    if (alt) return alt;
    if (item) return generateAltText(item);
    return 'Image';
  }, [alt, item]);

  const [currentSrc, setCurrentSrc] = useState(getImageSource());
  const altText = getAltText();

  // Update source when props change
  useEffect(() => {
    const newSrc = getImageSource();
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
      setLoading(showLoader);
      setError(false);
      setRetryCount(0);
    }
  }, [getImageSource, currentSrc, showLoader]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback((event) => {
    setLoading(false);
    setError(false);
    setRetryCount(0);
    onLoad?.(event);
    
    console.log('🖼️ SafeImage loaded successfully:', {
      src: currentSrc,
      entityType,
      category,
      naturalWidth: event.target.naturalWidth,
      naturalHeight: event.target.naturalHeight
    });
  }, [onLoad, currentSrc, entityType, category]);

  const handleError = useCallback((event) => {
    console.warn('🖼️ SafeImage failed to load:', {
      src: currentSrc,
      entityType,
      category,
      retryCount,
      maxRetries
    });

    setLoading(false);
    
    if (retryCount < maxRetries) {
      // Try to get a fallback image
      setTimeout(() => {
        const fallbackSrc = getImageUrl(null, entityType, category);
        if (fallbackSrc !== currentSrc) {
          setCurrentSrc(fallbackSrc);
          setRetryCount(prev => prev + 1);
          setLoading(showLoader);
        } else {
          setError(true);
        }
      }, 500 * (retryCount + 1)); // Exponential backoff
    } else {
      setError(true);
    }
    
    onError?.(event);
  }, [currentSrc, entityType, category, retryCount, maxRetries, onError, showLoader]);

  // Size-based styling
  const getSizeStyles = () => {
    const sizeMap = {
      small: { maxWidth: '200px', maxHeight: '150px' },
      medium: { maxWidth: '400px', maxHeight: '300px' },
      large: { maxWidth: '800px', maxHeight: '600px' },
      xl: { maxWidth: '1200px', maxHeight: '900px' },
      responsive: { width: '100%', height: 'auto' }
    };
    return sizeMap[size] || sizeMap.medium;
  };

  const sizeStyles = getSizeStyles();

  return (
    <div 
      className={`safe-image-container ${className}`} 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        ...sizeStyles,
        ...style 
      }}
    >
      {/* Loading Indicator */}
      {loading && showLoader && (
        <div 
          className="safe-image-loader"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            color: '#666'
          }}
          aria-live="polite"
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          ></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Error Indicator */}
      {error && showErrorMessage && (
        <div 
          className="safe-image-error"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            color: '#dc3545',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}
          aria-live="assertive"
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Image unavailable</span>
        </div>
      )}

      {/* Main Image */}
      <img
        {...imgProps}
        src={currentSrc}
        alt={altText}
        className={`safe-image ${loading ? 'safe-image-loading' : ''} ${error ? 'safe-image-error' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          borderRadius: '8px',
          transition: 'opacity 0.3s ease-in-out',
          opacity: loading ? 0.3 : 1,
          ...imgProps.style
        }}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        loading={imgProps.loading || 'lazy'}
        decoding={imgProps.decoding || 'async'}
      />

      {/* CSS Animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .safe-image-loading {
          opacity: 0.5;
        }
        
        .safe-image-error {
          opacity: 0.7;
          filter: grayscale(50%);
        }
        
        .safe-image-container:hover .safe-image {
          transition: transform 0.3s ease-in-out;
        }
        
        .safe-image-container:hover .safe-image:not(.safe-image-error) {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

// Predefined size variants for common use cases
SafeImage.Small = (props) => <SafeImage {...props} size="small" />;
SafeImage.Medium = (props) => <SafeImage {...props} size="medium" />;
SafeImage.Large = (props) => <SafeImage {...props} size="large" />;
SafeImage.XL = (props) => <SafeImage {...props} size="xl" />;
SafeImage.Responsive = (props) => <SafeImage {...props} size="responsive" />;

// Predefined entity variants
SafeImage.Pet = (props) => <SafeImage {...props} entityType="pet" />;
SafeImage.Product = (props) => <SafeImage {...props} entityType="product" />;

export default SafeImage;