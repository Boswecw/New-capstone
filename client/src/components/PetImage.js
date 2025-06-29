// src/components/PetImage.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const PetImage = ({ 
  petType, 
  imageName, 
  alt, 
  className = '', 
  style = {},
  showPlaceholder = true 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const getImageSrc = () => {
    if (imageError && showPlaceholder) {
      return `${process.env.PUBLIC_URL}/images/placeholders/pet-placeholder.jpg`;
    }
    return `${process.env.PUBLIC_URL}/images/pets/${petType}/${imageName}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

PetImage.propTypes = {
  petType: PropTypes.oneOf(['dogs', 'cats', 'aquatics']).isRequired,
  imageName: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  showPlaceholder: PropTypes.bool
};

export default PetImage;