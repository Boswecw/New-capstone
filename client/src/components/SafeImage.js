// client/src/components/SafeImage.js - Simple image component with fallback
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SafeImage = ({ 
  src, 
  alt = 'Image', 
  fallbackSrc = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80',
  className = '',
  style = {},
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      console.warn(`❌ Image failed to load: ${imageSrc}`);
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    if (!hasError) {
      console.log(`✅ Image loaded successfully: ${alt}`);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  fallbackSrc: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

export default SafeImage;