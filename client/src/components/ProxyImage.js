// client/src/components/ProxyImage.js - Reliable Image Component with Proxy Support
import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { getGoogleStorageUrl } from '../utils/imageUtils';

const ProxyImage = ({ 
  item = null,
  imagePath = null,
  category = 'pet',
  alt = 'Image',
  className = '',
  style = {},
  showSpinner = false,
  containerStyle = {},
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [loading, setLoading] = useState(showSpinner);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => {
    // Priority: explicit imagePath > item.imageUrl > item.image
    if (imagePath) {
      return getGoogleStorageUrl(imagePath, category);
    }
    if (item?.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
      return item.imageUrl;
    }
    if (item?.image) {
      return getGoogleStorageUrl(item.image, category);
    }
    // Fallback images
    const fallbacks = {
      pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
      product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
      default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
    };
    return fallbacks[category] || fallbacks.default;
  });

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setLoading(false);
    
    if (!error) {
      // Try fallback only once
      setError(true);
      const fallbacks = {
        pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
        product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
        default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
      };
      const fallbackSrc = fallbacks[category] || fallbacks.default;
      
      if (currentSrc !== fallbackSrc) {
        console.warn(`Image failed: ${currentSrc}, using fallback`);
        setCurrentSrc(fallbackSrc);
      }
    }
    
    if (onError) onError();
  };

  // Generate alt text if not provided
  const altText = alt || (() => {
    if (item) {
      const isProduct = item.price !== undefined;
      return isProduct 
        ? `${item.name || 'Product'} - ${item.category || 'Pet Store Item'}`
        : `${item.name || 'Pet'} - ${item.breed || ''} ${item.type || ''}`.trim();
    }
    return 'Image';
  })();

  return (
    <div 
      className={`position-relative ${className}`} 
      style={{ overflow: 'hidden', ...containerStyle }}
    >
      {/* Loading spinner */}
      {loading && showSpinner && (
        <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      )}
      
      {/* Main image */}
      <img
        {...props}
        src={currentSrc}
        alt={altText}
        className={`${className}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease',
          opacity: loading ? 0.7 : 1,
          ...style
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Error state indicator (optional) */}
      {error && process.env.NODE_ENV === 'development' && (
        <div 
          className="position-absolute bottom-0 start-0 bg-warning text-dark px-2 py-1"
          style={{ fontSize: '0.7rem', opacity: 0.8, zIndex: 5 }}
        >
          Fallback
        </div>
      )}
    </div>
  );
};

export default ProxyImage;