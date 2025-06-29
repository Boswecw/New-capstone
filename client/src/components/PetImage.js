// client/src/components/PetImage.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from 'react-bootstrap';
import { 
  getGoogleStorageUrl, 
  handleImageError as handleImageErrorUtil, 
  generateSrcSet, 
  getDefaultPetImage 
} from '../utils/imageUtils';

/**
 * Enhanced PetImage component with Google Cloud Storage support
 * Handles loading states, error fallbacks, and responsive images
 */
const PetImage = ({ 
  petType = 'pet',
  imagePath,
  alt, 
  className = '', 
  style = {},
  size = 'medium',
  showPlaceholder = true,
  showSpinner = true,
  responsive = true,
  lazyLoad = true,
  onClick,
  onLoad,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Generate optimized image URLs
  const imageUrl = imagePath ? getGoogleStorageUrl(imagePath, size) : getDefaultPetImage(petType);
  const srcSet = responsive && imagePath ? generateSrcSet(imagePath) : '';
  const fallbackUrl = getDefaultPetImage(petType);
  
  // Handle image load success
  const handleImageLoad = (event) => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad(event);
  };

  // Handle image load error with retry logic
  const handleImageErrorEvent = (event) => {
    setLoading(false);
    
    // Try fallback image if original fails and we haven't retried yet
    if (!error && retryCount < 2 && imagePath) {
      setRetryCount(prev => prev + 1);
      event.target.src = retryCount === 0 ? fallbackUrl : getDefaultPetImage();
      return;
    }
    
    setError(true);
    
    // Use utility function for consistent error handling
    handleImageErrorUtil(event, petType);
    
    if (onError) onError(event);
  };

  // Handle click events
  const handleClick = (event) => {
    if (onClick) onClick(event);
  };

  // Determine the image source
  const getImageSrc = () => {
    if (error && showPlaceholder) {
      return getDefaultPetImage(petType);
    }
    return imageUrl;
  };

  // Calculate responsive sizes
  const getSizes = () => {
    if (!responsive) return undefined;
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  };

  return (
    <div className={`pet-image-container position-relative ${className}`} style={style}>
      {/* Loading Spinner */}
      {loading && showSpinner && (
        <div 
          className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
          style={{ zIndex: 2 }}
        >
          <Spinner 
            animation="border" 
            size="sm" 
            variant="primary"
            role="status"
          >
            <span className="visually-hidden">Loading image...</span>
          </Spinner>
        </div>
      )}
      
      {/* Error State Overlay */}
      {error && !showPlaceholder && (
        <div 
          className="position-absolute top-50 start-50 translate-middle text-center p-3"
          style={{ zIndex: 2 }}
        >
          <i className="fas fa-image text-muted fa-2x mb-2"></i>
          <p className="text-muted small mb-0">Image not available</p>
        </div>
      )}
      
      {/* Main Image */}
      <img
        src={getImageSrc()}
        srcSet={srcSet}
        sizes={getSizes()}
        alt={alt || `${petType} image`}
        className={`w-100 h-100 object-fit-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        style={{ 
          transition: 'opacity 0.3s ease',
          objectFit: 'cover'
        }}
        onLoad={handleImageLoad}
        onError={handleImageErrorEvent}
        onClick={handleClick}
        loading={lazyLoad ? 'lazy' : 'eager'}
        // Accessibility improvements
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick ? 0 : -1}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e);
          }
        }}
      />
      
      {/* Image Attribution Overlay (if needed) */}
      {imagePath && process.env.NODE_ENV === 'development' && (
        <div 
          className="position-absolute bottom-0 start-0 bg-dark bg-opacity-75 text-white p-1"
          style={{ fontSize: '0.7rem', zIndex: 3 }}
        >
          {imagePath}
        </div>
      )}
    </div>
  );
};

PetImage.propTypes = {
  petType: PropTypes.oneOf(['dog', 'cat', 'fish', 'bird', 'small-pet', 'supply', 'pet']),
  imagePath: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.oneOf(['thumbnail', 'small', 'medium', 'large', 'hero']),
  showPlaceholder: PropTypes.bool,
  showSpinner: PropTypes.bool,
  responsive: PropTypes.bool,
  lazyLoad: PropTypes.bool,
  onClick: PropTypes.func,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default PetImage;