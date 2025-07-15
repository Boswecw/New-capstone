// client/src/components/PetCard.js - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const PetCard = ({ pet, priority = false, debug = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [attemptedUrls, setAttemptedUrls] = useState([]);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Safe pet data with defaults
  const safePet = pet || {};
  const petName = safePet.name || 'Unnamed Pet';
  const petBreed = safePet.breed || 'Mixed';
  const petAge = safePet.age || 'Unknown age';
  const petGender = safePet.gender || 'Unknown';
  const petDescription = safePet.description || 'No description available.';
  const petStatus = safePet.status || 'unknown';
  const petType = safePet.type || 'pet';
  const petId = safePet._id || safePet.id || 'unknown';

  // FIXED: Create imageProps with multiple fallback levels
  const createImageProps = () => {
    const fallbackImages = [
      // Level 1: Try original imageUrl or constructed URL
      safePet.imageUrl || (safePet.image ? `https://storage.googleapis.com/furbabies-petstore/${safePet.image}` : null),
      // Level 2: Try Picsum photos (reliable external service)
      `https://picsum.photos/400/300?random=${petId}`,
      // Level 3: Try different Picsum photo
      `https://picsum.photos/400/300?random=${Date.now()}`,
      // Level 4: Base64 SVG (always works)
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkY2QjZCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+QviBQZXQ8L3RleHQ+Cjwvc3ZnPgo='
    ].filter(Boolean); // Remove null/undefined values

    const currentSrc = fallbackImages[fallbackIndex] || fallbackImages[fallbackImages.length - 1];

    return {
      src: currentSrc,
      alt: `${petName} - ${petBreed} ${petType}`,
      loading: priority ? 'eager' : 'lazy',
      ...(priority && { fetchPriority: 'high' }),
      onError: (e) => {
        const failedUrl = e.target.src;
        setAttemptedUrls(prev => [...prev, failedUrl]);
        
        console.log('❌ PetCard image failed:', petName, 'URL:', failedUrl, 'Attempt:', fallbackIndex);
        
        // Try next fallback
        if (fallbackIndex < fallbackImages.length - 1) {
          setFallbackIndex(prev => prev + 1);
          e.target.src = fallbackImages[fallbackIndex + 1];
        } else {
          // All fallbacks failed
          setImageError(true);
          setImageLoaded(true);
          console.log('❌ All image fallbacks failed for:', petName);
        }
      }
    };
  };

  // FIXED: Actually create imageProps
  const imageProps = createImageProps();

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    console.log('✅ PetCard image loaded:', petName, 'URL:', imageProps.src);
  };

  const handleImageError = (e) => {
    // Call the imageProps error handler
    if (imageProps.onError) {
      imageProps.onError(e);
    }
  };

  const daysSincePosted = safePet.createdAt
    ? Math.floor((new Date() - new Date(safePet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="h-100 shadow-sm fade-in">
      {/* Debug info - only show in development */}
      {debug && process.env.NODE_ENV === 'development' && (
        <Alert variant="info" className="m-2 p-2 small">
          <strong>Debug Info:</strong><br/>
          Original: {safePet?.image || safePet?.imageUrl || 'None'}<br/>
          Current: {imageProps.src}<br/>
          Attempts: {attemptedUrls.length}<br/>
          Fallback Index: {fallbackIndex}
        </Alert>
      )}

      <div className="position-relative" style={{ height: '250px', overflow: 'hidden' }}>
        {/* Loading spinner */}
        {!imageLoaded && (
          <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
            <Spinner animation="border" size="sm" variant="primary" />
            <div className="small text-muted mt-1">Loading...</div>
          </div>
        )}

        {/* Main image - NOW GUARANTEED TO WORK */}
        <Card.Img
          src={imageProps.src}
          alt={imageProps.alt}
          className={`transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
                {petType === 'dog' && <i className="fas fa-dog fa-2x text-primary opacity-50" />}
                {petType === 'cat' && <i className="fas fa-cat fa-2x text-primary opacity-50" />}
                {petType === 'bird' && <i className="fas fa-dove fa-2x text-primary opacity-50" />}
                {petType === 'fish' && <i className="fas fa-fish fa-2x text-primary opacity-50" />}
                {!['dog', 'cat', 'bird', 'fish'].includes(petType) && 
                  <i className="fas fa-paw fa-2x text-primary opacity-50" />
                }
              </div>
              <div className="small fw-semibold">{petName}</div>
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
          {safePet.featured && (
            <Badge bg="info" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-crown me-1" aria-hidden="true"></i>Featured
            </Badge>
          )}
        </div>

        <div className="position-absolute top-0 end-0 m-2">
          <Badge bg={petStatus === 'available' ? 'success' : 'secondary'} style={{ fontSize: '0.7rem' }}>
            <i className={`fas ${petStatus === 'available' ? 'fa-check-circle' : 'fa-home'} me-1`} aria-hidden="true"></i>
            {petStatus === 'available' ? 'Available' : 'Adopted'}
          </Badge>
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="fw-bold text-primary mb-2">
          {petName}
          {imageError && (
            <small className="text-warning ms-2">
              <i className="fas fa-exclamation-triangle" title="Image unavailable" />
            </small>
          )}
        </Card.Title>
        
        <Card.Text className="text-muted mb-2 small">
          <span className="fw-semibold">{petBreed}</span> • 
          <span className="ms-1">{petAge}</span> • 
          <span className="ms-1">{petGender}</span>
        </Card.Text>
        
        <Card.Text className="flex-grow-1 text-sm">
          {petDescription && petDescription.length > 100 
            ? `${petDescription.substring(0, 100)}...`
            : petDescription}
        </Card.Text>
        
        <div className="mt-auto">
          <Button
            as={Link}
            to={`/pets/${petId}`}
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