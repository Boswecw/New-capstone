// client/src/components/SafeImage.js - FIXED VERSION

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SafeImage = ({ 
  item, 
  category = 'general',
  className = '',
  style = {},
  alt = '',
  onContainerTypeChange, // ✅ Custom prop name that won't conflict with DOM
  size = 'medium',
  ...otherProps // ✅ Spread remaining props to img element
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ✅ Build image URL based on item data
  useEffect(() => {
    if (!item) {
      setError(true);
      setLoading(false);
      return;
    }

    // Try to get image URL from various sources
    let url = '';
    
    if (item.imageUrl) {
      url = item.imageUrl;
    } else if (item.image) {
      // Handle Google Cloud Storage URLs
      if (item.image.startsWith('http')) {
        url = item.image;
      } else {
        url = `https://storage.googleapis.com/furbabies-petstore/${item.image}`;
      }
    } else if (item.photos && item.photos.length > 0) {
      url = item.photos[0].url || item.photos[0];
    } else {
      // ✅ Enhanced fallback logic for products
      if (category === 'product' || item.category === 'product' || item.price !== undefined) {
        // This is a product - try to construct a GCS URL based on product name
        const productName = item.name || 'placeholder';
        const cleanName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        url = `https://storage.googleapis.com/furbabies-petstore/product/${cleanName}.jpg`;
      } else {
        // This is a pet - use pet placeholder
        url = `https://storage.googleapis.com/furbabies-petstore/${category}/placeholder.png`;
      }
    }

    console.log('🖼️ SafeImage URL for', item.name || 'item', ':', url);
    setImageUrl(url);
    setLoading(false);
  }, [item, category]);

  // ✅ Detect container type based on image dimensions
  const handleImageLoad = (e) => {
    const img = e.target;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    let detectedType = 'square';
    
    if (aspectRatio > 1.5) {
      detectedType = 'landscape';
    } else if (aspectRatio < 0.6) {
      detectedType = 'tall';
    } else if (aspectRatio < 0.8) {
      detectedType = 'portrait';
    }
    
    // ✅ Call the callback if provided
    if (onContainerTypeChange) {
      onContainerTypeChange(detectedType);
    }
    
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
      >
        <div className="text-center text-muted">
          <div className="spinner-border spinner-border-sm mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error || !imageUrl) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
      >
        <div className="text-center text-muted">
          <i className="fas fa-image fa-2x mb-2 opacity-50"></i>
          <div>No image available</div>
        </div>
      </div>
    );
  }

  // ✅ Filter out ALL custom props before passing to img element
  const validImgProps = {};
  const validHtmlProps = [
    'alt', 'src', 'className', 'style', 'onLoad', 'onError', 'onClick',
    'onMouseEnter', 'onMouseLeave', 'id', 'role', 'aria-label', 'title',
    'width', 'height', 'loading', 'decoding', 'crossOrigin', 'referrerPolicy'
  ];

  // Only pass through valid HTML img attributes
  Object.keys(otherProps).forEach(key => {
    if (validHtmlProps.includes(key)) {
      validImgProps[key] = otherProps[key];
    }
  });

  return (
    <img
      src={imageUrl}
      alt={alt || item?.name || 'Image'}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      {...validImgProps} // ✅ Only valid img props
    />
  );
};

SafeImage.propTypes = {
  item: PropTypes.object.isRequired,
  category: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  alt: PropTypes.string,
  onContainerTypeChange: PropTypes.func, // ✅ Custom callback for container type
  size: PropTypes.string
};

export default SafeImage;