import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import styles from './Card.module.css';

const PetCard = ({ 
  pet, 
  showFavoriteButton = false,
  showAdoptionStatus = true,
  onClick = null,
  className = ""
}) => {
  const [containerType, setContainerType] = useState('square');

  // Handle click event if onClick is provided, otherwise use Link
  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(pet._id);
    }
  };

  const CardContent = () => (
    <>
      {/* Enhanced: Dynamic container with status badges */}
      <div className={`${styles.petImgContainer} ${styles[containerType]} position-relative`}>
        <SafeImage
          item={pet}
          category={pet.type || 'pet'}
          size="card"
          showLoader={true}
          className={styles.petImg}
          onContainerTypeDetected={setContainerType}
        />
        
        {/* Status Badges Overlay */}
        {showAdoptionStatus && (
          <div className="position-absolute top-0 start-0 p-2">
            {pet.featured && (
              <Badge bg="warning" className="me-1">
                <i className="fas fa-star me-1"></i>
                Featured
              </Badge>
            )}
            {pet.adopted && (
              <Badge bg="success">
                <i className="fas fa-heart me-1"></i>
                Adopted
              </Badge>
            )}
          </div>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && (
          <div className="position-absolute top-0 end-0 p-2">
            <Button
              variant="outline-light"
              size="sm"
              className="rounded-circle"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Add favorite functionality here
                console.log('Favorite clicked for:', pet.name);
              }}
            >
              <i className="fas fa-heart"></i>
            </Button>
          </div>
        )}
      </div>
      
      <Card.Body className={`d-flex flex-column ${styles.enhancedCardBody}`}>
        <Card.Title className={styles.enhancedCardTitle}>
          {pet.name}
        </Card.Title>
        
        {/* Enhanced: Show breed, age, gender info */}
        {(pet.breed || pet.age || pet.gender) && (
          <Card.Text className="text-muted mb-2">
            {[pet.breed, pet.age, pet.gender].filter(Boolean).join(' • ')}
          </Card.Text>
        )}
        
        <Card.Text className={`text-muted small mb-2 flex-grow-1 ${styles.enhancedCardText}`}>
          {pet.description || pet.bio || 'Adorable pet looking for a loving home!'}
        </Card.Text>
        
        <div className={styles.enhancedBadges}>
          {pet.type && (
            <Badge bg="primary" className={styles.enhancedBadge}>
              <i className="fas fa-paw me-1"></i>
              {pet.type}
            </Badge>
          )}
          {pet.size && (
            <Badge bg="secondary" className={styles.enhancedBadge}>
              <i className="fas fa-ruler me-1"></i>
              {pet.size}
            </Badge>
          )}
          {pet.gender && (
            <Badge bg="info" className={styles.enhancedBadge}>
              <i className="fas fa-venus-mars me-1"></i>
              {pet.gender}
            </Badge>
          )}
        </div>
        
        {/* Enhanced: Button adapts based on adoption status */}
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <small className="text-muted">
            <i className="fas fa-map-marker-alt me-1"></i>
            {pet.location || 'FurBabies'}
          </small>
          
          <Button
            variant={pet.adopted ? "success" : "primary"}
            size="sm"
            disabled={pet.adopted}
            className={styles.enhancedButton}
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick(pet._id);
              }
            }}
            {...(!onClick && !pet.adopted && { as: Link, to: `/pets/${pet._id}` })}
          >
            {pet.adopted ? (
              <>
                <i className="fas fa-heart me-1"></i>
                Adopted
              </>
            ) : (
              <>
                <i className="fas fa-info-circle me-1"></i>
                Details
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </>
  );

  // If onClick is provided, make the whole card clickable
  if (onClick) {
    return (
      <Card 
        className={`h-100 shadow-sm pet-card ${styles.enhancedCard} ${className}`}
        style={{ cursor: 'pointer' }}
        onClick={handleCardClick}
      >
        <CardContent />
      </Card>
    );
  }

  // Otherwise, use Link wrapper for the card
  return (
    <Card className={`h-100 shadow-sm pet-card ${styles.enhancedCard} ${className}`}>
      <CardContent />
    </Card>
  );
};

export default PetCard;