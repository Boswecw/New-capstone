// client/src/components/PetCard.js - ENHANCED VERSION
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCardImageProps } from '../utils/imageUtils';
import styles from './Card.module.css';

const PetCard = ({ pet, priority = false, debug = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [attemptedUrls, setAttemptedUrls] = useState([]);

  // Get proper image props with enhanced error handling
  const baseImageProps = getCardImageProps(pet, 'medium');
  
  const imageProps = {
    ...baseImageProps,
    ...(priority && {
      loading: 'eager',
      fetchPriority: 'high'
    })
  };

  // Enhanced error handler that tracks attempts
  const handleImageError = (e) => {
    const failedUrl = e.target.src;
    setAttemptedUrls(prev => [...prev, failedUrl]);
    
    console.log('❌ PetCard image failed:', pet.name, 'URL:', failedUrl);
    
    // Call the original error handler for fallbacks
    if (imageProps.onError) {
      imageProps.onError(e);
    }
    
    // If this looks like the final fallback (SVG), mark as error
    if (failedUrl.includes('data:image/svg') || e.target.fallbackIndex >= 2) {
      setImageError(true);
      setImageLoaded(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    console.log('✅ PetCard image loaded:', pet.name, 'URL:', imageProps.src);
  };

  const daysSincePosted = pet.createdAt
    ? Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className={`h-100 shadow-sm ${styles.card} fade-in`}>
      {/* Debug info - only show in development */}
      {debug && process.env.NODE_ENV === 'development' && (
        <Alert variant="info" className="m-2 p-2 small">
          <strong>Debug Info:</strong><br/>
          Original: {pet?.image || pet?.imageUrl || 'None'}<br/>
          Current: {imageProps.src}<br/>
          Attempts: {attemptedUrls.length}
        </Alert>
      )}

      <div className={`${styles.cardImgContainer || styles.petImgContainer} position-relative`}>
        {/* Loading spinner */}
        {!imageLoaded && (
          <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
            <Spinner animation="border" size="sm" variant="primary" />
            <div className="small text-muted mt-1">Loading...</div>
          </div>
        )}

        {/* Main image */}
        <Card.Img
          src={imageProps.src}
          alt={imageProps.alt || `${pet.name}, ${pet.breed} ${pet.type}`}
          className={`${styles.cardImg || styles.petImg} transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ 
            width: '100%', 
            height: '250px', 
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'opacity 0.3s ease'
          }}
          loading={imageProps.loading}
          fetchPriority={imageProps.fetchPriority}
        />

        {/* Enhanced error fallback with better UX */}
        {imageError && imageLoaded && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light border">
            <div className="text-center text-muted p-3">
              <div className="mb-2">
                {/* Pet type specific icon */}
                {pet.type === 'dog' && <i className="fas fa-dog fa-2x text-primary opacity-50" />}
                {pet.type === 'cat' && <i className="fas fa-cat fa-2x text-primary opacity-50" />}
                {pet.type === 'bird' && <i className="fas fa-dove fa-2x text-primary opacity-50" />}
                {pet.type === 'fish' && <i className="fas fa-fish fa-2x text-primary opacity-50" />}
                {!['dog', 'cat', 'bird', 'fish'].includes(pet.type) && 
                  <i className="fas fa-paw fa-2x text-primary opacity-50" />
                }
              </div>
              <div className="small fw-semibold">{pet.name}</div>
              <div className="small text-muted">Photo coming soon</div>
            </div>
          </div>
        )}

        {/* Status badges */}
        <div className="position-absolute top-0 start-0 m-2">
          {daysSincePosted !== null && daysSincePosted <= 7 && (
            <Badge bg="warning" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-star me-1" aria-hidden="true"></i>New
            </Badge>
          )}
          {pet.featured && (
            <Badge bg="info" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-crown me-1" aria-hidden="true"></i>Featured
            </Badge>
          )}
        </div>

        <div className="position-absolute top-0 end-0 m-2">
          <Badge bg={pet.status === 'available' ? 'success' : 'secondary'} style={{ fontSize: '0.7rem' }}>
            <i className={`fas ${pet.status === 'available' ? 'fa-check-circle' : 'fa-home'} me-1`} aria-hidden="true"></i>
            {pet.status === 'available' ? 'Available' : 'Adopted'}
          </Badge>
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="fw-bold text-primary mb-2">
          {pet.name || 'Unnamed Pet'}
          {imageError && (
            <small className="text-warning ms-2">
              <i className="fas fa-exclamation-triangle" title="Image unavailable" />
            </small>
          )}
        </Card.Title>
        
        <Card.Text className="text-muted mb-2 small">
          <span className="fw-semibold">{pet.breed || 'Mixed'}</span> • 
          <span className="ms-1">{pet.age || 'Unknown age'}</span> • 
          <span className="ms-1">{pet.gender || 'Unknown'}</span>
        </Card.Text>
        
        <Card.Text className="flex-grow-1 text-sm">
          {pet.description && pet.description.length > 100 
            ? `${pet.description.substring(0, 100)}...`
            : pet.description || 'No description available.'}
        </Card.Text>
        
        <div className="mt-auto">
          <Button
            as={Link}
            to={`/pets/${pet._id}`}
            variant="primary"
            size="sm"
            className="w-100"
          >
            <i className="fas fa-info-circle me-2" />
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;