// client/src/components/PetCard.js - UPDATED WITH CONSOLIDATED IMAGE UTILITY
import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getImageUrl, generateAltText } from '../utils/imageUtils';
import styles from './Card.module.css';

const PetCard = ({ pet }) => {
  const [containerType, setContainerType] = useState('square');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ FIXED: Use consolidated image utility with proper fallbacks
  const imageSrc = getImageUrl(
    pet?.image || pet?.imageUrl || pet?.photo, 
    'pet', 
    pet?.type
  );

  // Generate proper alt text
  const altText = generateAltText(pet, `Photo of ${pet?.name || 'pet'}`);

  const handleImageLoad = (e) => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      let detectedType = 'square';
      if (aspectRatio > 1.5) {
        detectedType = 'landscape';
      } else if (aspectRatio < 0.6) {
        detectedType = 'tall';
      } else if (aspectRatio < 0.8) {
        detectedType = 'portrait';
      }

      setContainerType(detectedType);
      console.log(
        `🖼️ Pet "${pet?.name}" - Aspect ratio: ${aspectRatio.toFixed(2)}, Container: ${detectedType}`
      );
    }
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.warn(`🖼️ Pet image failed to load for ${pet?.name}:`, imageSrc);
    setImageError(true);
    setImageLoaded(true);
    
    // Set fallback image
    const fallbackSrc = getImageUrl(null, 'pet', pet?.type);
    if (e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
  };

  // Status badge configuration
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return { variant: 'success', icon: 'check-circle', text: 'Available' };
      case 'pending':
        return { variant: 'warning', icon: 'clock', text: 'Pending' };
      case 'adopted':
        return { variant: 'secondary', icon: 'heart', text: 'Adopted' };
      case 'hold':
        return { variant: 'info', icon: 'pause-circle', text: 'On Hold' };
      default:
        return { variant: 'primary', icon: 'info-circle', text: status || 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(pet?.status);

  return (
    <Card className={`${styles.enhancedCard} h-100`}>
      <div className={`${styles.petImgContainer} ${styles[containerType]}`}>
        <img
          src={imageSrc}
          alt={altText}
          className={`${styles.petImg} ${!imageLoaded ? styles.loading : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {!imageLoaded && (
          <div className={styles.imageError} aria-live="polite">
            <i className="fas fa-paw" aria-hidden="true"></i>
            <span>Loading...</span>
          </div>
        )}
        {imageError && imageLoaded && (
          <div className={styles.imageError} aria-live="polite">
            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>Using fallback image</span>
          </div>
        )}
      </div>

      <Card.Body className={styles.enhancedCardBody}>
        <Card.Title className={styles.enhancedCardTitle}>
          {pet?.name || 'Unnamed Pet'}
        </Card.Title>

        <div className={styles.enhancedBadges}>
          <Badge className={styles.enhancedBadge} bg="info">
            {pet?.type || 'Pet'}
          </Badge>
          {pet?.breed && (
            <Badge className={styles.enhancedBadge} bg="secondary">
              {pet.breed}
            </Badge>
          )}
          {pet?.featured && (
            <Badge className={styles.enhancedBadge} bg="warning" text="dark">
              <i className="fas fa-star me-1" aria-hidden="true"></i>
              Featured
            </Badge>
          )}
          {pet?.status && (
            <Badge
              className={styles.enhancedBadge}
              bg={statusInfo.variant}
            >
              <i className={`fas fa-${statusInfo.icon} me-1`} aria-hidden="true"></i>
              {statusInfo.text}
            </Badge>
          )}
        </div>

        {/* Pet Details */}
        {pet?.breed && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-dna me-1"></i>
              Breed: {pet.breed}
            </small>
          </div>
        )}

        {pet?.age && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-birthday-cake me-1"></i>
              Age: {pet.age}
            </small>
          </div>
        )}

        {pet?.size && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-ruler me-1"></i>
              Size: {pet.size}
            </small>
          </div>
        )}

        {pet?.gender && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-venus-mars me-1"></i>
              Gender: {pet.gender}
            </small>
          </div>
        )}

        {pet?.description && (
          <Card.Text className={styles.enhancedCardText}>
            {pet.description.length > 100 
              ? `${pet.description.substring(0, 100)}...` 
              : pet.description}
          </Card.Text>
        )}

        {/* Personality Traits */}
        {pet?.personalityTraits && pet.personalityTraits.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">Personality:</small>
            <div className="d-flex flex-wrap gap-1">
              {pet.personalityTraits.slice(0, 3).map((trait, index) => (
                <Badge 
                  key={index} 
                  bg="light" 
                  text="dark" 
                  className="text-capitalize"
                  style={{ fontSize: '0.75rem' }}
                >
                  {trait}
                </Badge>
              ))}
              {pet.personalityTraits.length > 3 && (
                <Badge bg="light" text="muted" style={{ fontSize: '0.75rem' }}>
                  +{pet.personalityTraits.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Heart Rating Display */}
        {pet?.hearts && pet.hearts > 0 && (
          <div className="mb-3 text-center">
            <small className="text-muted d-block">Community Rating</small>
            <div className="text-warning">
              {[...Array(Math.min(5, pet.hearts))].map((_, i) => (
                <i key={i} className="fas fa-heart me-1"></i>
              ))}
              {pet.hearts > 5 && (
                <span className="text-muted ms-1">({pet.hearts})</span>
              )}
            </div>
          </div>
        )}

        <Link 
          to={`/pets/${pet?._id}`} 
          className={`btn btn-primary ${styles.enhancedButton} w-100`}
        >
          <i className="fas fa-heart me-2"></i>
          Meet {pet?.name || 'Pet'}
        </Link>
      </Card.Body>
    </Card>
  );
};

export default PetCard;