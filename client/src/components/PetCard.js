// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/image';
import styles from './Card.module.css';

const PetCard = ({ pet }) => {
  const [containerType, setContainerType] = useState('square');
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageSrc =
    normalizeImageUrl(pet?.image || pet?.imageUrl) ||
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop&q=80';

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
      console.log(`🖼️ Pet "${pet?.name}" - Aspect ratio: ${aspectRatio.toFixed(2)}, Container: ${detectedType}`);
    }
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop&q=80';
    setImageLoaded(true);
  };

  return (
    <Card className={`${styles.enhancedCard} h-100`}>
      <div className={`${styles.petImgContainer} ${styles[containerType]}`}>
        <img
          src={imageSrc}
          alt={pet?.name || 'Pet'}
          className={`${styles.petImg} ${!imageLoaded ? styles.loading : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && (
          <div className={styles.imageError}>
            <i className="fas fa-paw"></i>
            <span>Loading...</span>
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
              <i className="fas fa-star me-1"></i>Featured
            </Badge>
          )}
          {pet?.status && (
            <Badge 
              className={styles.enhancedBadge} 
              bg={pet.status === 'available' ? 'success' : 'secondary'}
            >
              {pet.status}
            </Badge>
          )}
        </div>
        
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
              <i className="fas fa-ruler-combined me-1"></i>
              Size: {pet.size}
            </small>
          </div>
        )}
        
        {pet?.gender && (
          <div className="mb-2">
            <small className="text-muted">
              <i className={`fas ${pet.gender === 'male' ? 'fa-mars' : 'fa-venus'} me-1`}></i>
              {pet.gender}
            </small>
          </div>
        )}
        
        {pet?.description && (
          <Card.Text className={styles.enhancedCardText}>
            {pet.description.length > 120 
              ? `${pet.description.substring(0, 120)}...` 
              : pet.description}
          </Card.Text>
        )}
        
        <div className="text-center mb-3">
          <span className="text-success fw-bold fs-5">
            {pet?.price ? `$${pet.price}` : 'Adoption Fee Varies'}
          </span>
        </div>
        
        <Link 
          to={`/pets/${pet?._id}`} 
          className={`btn btn-primary ${styles.enhancedButton} w-100`}
        >
          <i className="fas fa-heart me-2"></i>
          Learn More
        </Link>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
