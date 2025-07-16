// client/src/components/SafeImage.js - NEW COMPONENT
import React, { useState, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';

const SafeImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  showSpinner = true,
  fallbackSrc = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80',
  onLoad,
  onError,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setLoading(false);
    
    // Try fallback if we haven't already
    if (!error && currentSrc !== fallbackSrc) {
      setError(true);
      setCurrentSrc(fallbackSrc);
      console.warn(`Image failed: ${src}, using fallback`);
    } else {
      setError(true);
      onError?.(e);
    }
  }, [error, currentSrc, fallbackSrc, src, onError]);

  return (
    <div className={`position-relative ${className}`} style={style}>
      {/* Loading spinner */}
      {loading && showSpinner && (
        <div className="position-absolute top-50 start-50 translate-middle">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      )}
      
      {/* Image */}
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
          width: '100%',
          height: 'auto'
        }}
      />
      
      {/* Error overlay */}
      {error && currentSrc === fallbackSrc && (
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="text-muted">
            <i className="fas fa-image fa-2x mb-2"></i>
            <br />
            <small>Image unavailable</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeImage;