// client/src/components/SafeImage.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { buildImageUrl, getFallbackUrl } from '../utils/imageUrlBuilder';

/**
 * SafeImage Component - Handles image loading with fallbacks
 * Uses the unified image URL builder for consistent URL construction
 */
const SafeImage = ({ 
  src, 
  alt = 'Image', 
  item = null,
  entityType = 'default',
  category = null,
  className = '',
  style = {},
  imgProps = {},
  showLoading = true,
  retryCount = 2,
  onLoad = null,
  onError = null
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retries, setRetries] = useState(0);

  // Determine the image source
  useEffect(() => {
    // Extract image path from various sources
    const imagePath = src || 
                     item?.image || 
                     item?.imagePath || 
                     item?.imageUrl || 
                     item?.photo || 
                     item?.picture;
    
    // Determine entity type and category from item if not provided
    const finalEntityType = entityType || item?.type || 'default';
    const finalCategory = category || item?.category || null;
    
    // Build the image URL using our unified builder
    const url = buildImageUrl(imagePath, {
      entityType: finalEntityType,
      category: finalCategory
    });
    
    console.log('SafeImage: Building URL', {
      imagePath,
      finalEntityType,
      finalCategory,
      resultUrl: url
    });
    
    setImageSrc(url);
    setIsLoading(true);
    setHasError(false);
  }, [src, item, entityType, category]);

  // Handle image load success
  const handleLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    setRetries(0);
    
    if (onLoad) {
      onLoad(e);
    }
  };

  // Handle image load error
  const handleError = (e) => {
    console.warn('SafeImage: Load error', {
      src: imageSrc,
      retries,
      maxRetries: retryCount
    });
    
    // Try retry if we haven't exceeded the retry count
    if (retries < retryCount) {
      setRetries(retries + 1);
      
      // Add a cache buster to retry
      const url = new URL(imageSrc);
      url.searchParams.set('retry', retries + 1);
      setImageSrc(url.toString());
      
      return;
    }
    
    // All retries failed, use fallback
    setIsLoading(false);
    setHasError(true);
    
    // Determine fallback URL
    const finalEntityType = entityType || item?.type || 'default';
    const finalCategory = category || item?.category || null;
    const fallbackUrl = getFallbackUrl(finalEntityType, finalCategory);
    
    // Set fallback image
    if (imageSrc !== fallbackUrl) {
      console.log('SafeImage: Using fallback', fallbackUrl);
      setImageSrc(fallbackUrl);
      setHasError(false); // Reset error for fallback attempt
    }
    
    if (onError) {
      onError(e);
    }
  };

  // Loading placeholder
  if (isLoading && showLoading) {
    return (
      <div 
        className={`safe-image-loading ${className}`}
        style={{
          ...style,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: style.height || 200,
          borderRadius: style.borderRadius || 0
        }}
      >
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error placeholder (only shown if fallback also fails)
  if (hasError && !imageSrc) {
    return (
      <div 
        className={`safe-image-error ${className}`}
        style={{
          ...style,
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: style.height || 200,
          borderRadius: style.borderRadius || 0,
          color: '#666'
        }}
      >
        <div className="text-center">
          <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
          <div className="small mt-2">Image unavailable</div>
        </div>
      </div>
    );
  }

  // Render the image
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...imgProps}
    />
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  item: PropTypes.object,
  entityType: PropTypes.string,
  category: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  imgProps: PropTypes.object,
  showLoading: PropTypes.bool,
  retryCount: PropTypes.number,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default SafeImage;