// client/src/components/PetImage.js
import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { getGoogleStorageUrl } from '../utils/imageUtils';

const PetImage = ({ 
  petType, 
  imagePath, 
  alt = 'Pet image', 
  className = '', 
  size = 'medium',
  style = {},
  onLoad,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    if (onError) onError();
  };

  // Get fallback image based on pet type
  const getFallbackImage = () => {
    const fallbacks = {
      dog: '/images/pet/default-dog.png',
      cat: '/images/pet/default-cat.png',
      bird: '/images/pet/default-bird.png',
      fish: '/images/pet/default-fish.png',
      rabbit: '/images/pet/default-rabbit.png',
      'small-pet': '/images/pet/default-small-pet.png',
      other: '/images/pet/default-pet.png'
    };
    return fallbacks[petType] || fallbacks.other;
  };

  const imageUrl = error ? getFallbackImage() : getGoogleStorageUrl(imagePath, size) || getFallbackImage();

  return (
    <div className={`position-relative ${className}`} style={style}>
      {loading && (
        <div className="position-absolute top-50 start-50 translate-middle">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={`${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
        style={{
          ...style,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {error && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center text-muted">
            <i className="fas fa-image fa-2x mb-2"></i>
            <div>Image not available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetImage;