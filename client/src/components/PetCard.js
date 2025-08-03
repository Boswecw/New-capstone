import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import styles from './Card.module.css';

const PetCard = ({ 
  pet, 
  showFavoriteButton = false,
  showAdoptionStatus = true,
  onClick = null,
  className = ""
}) => {
  const [containerType, setContainerType] = useState('square');

  // ✅ DEFENSIVE CHECK: Return early if pet is undefined or null
  if (!pet) {
    console.warn('⚠️ PetCard: pet prop is undefined or null');
    return (
      <Card className={`h-100 ${styles.enhancedCard} ${className}`}>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center text-muted">
            <i className="fas fa-exclamation-triangle fa-2x mb-2"></i>
            <div>Pet data unavailable</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // ✅ DEFENSIVE CHECK: Ensure pet has minimum required properties
  const safePet = {
    _id: pet._id || 'unknown',
    name: pet.name || 'Unknown Pet',
    type: pet.type || 'pet',
    breed: pet.breed || '',
    age: pet.age || '',
    gender: pet.gender || '',
    size: pet.size || '',
    description: pet.description || pet.bio || 'Adorable pet looking for a loving home!',
    location: pet.location || 'FurBabies',
    adopted: pet.adopted || false,
    featured: pet.featured || false,
    status: pet.status || '',
    ...pet // Spread original pet to preserve other properties
  };

  // Handle click event if onClick is provided, otherwise use Link
  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(safePet._id);
    }
  };

  const CardContent = () => (
    <>
      {/* 🆕 ENHANCED: Dynamic container that adapts to image aspect ratio */}
      <div className={`${styles.petImgContainer} ${styles[containerType]} position-relative`}>
        <SafeImage
          item={safePet}
          category={safePet.type}
          size="card"
          showLoader={true}
          className={styles.petImg}
          onContainerTypeDetected={setContainerType}
        />
        
        {/* Status Badges Overlay */}
        {showAdoptionStatus && (
          <div className="position-absolute top-0 start-0 p-2">
            {safePet.featured && (
              <Badge bg="warning" className="me-1">
                <i className="fas fa-star me-1"></i>
                Featured
              </Badge>
            )}
            {safePet.status === 'adopted' && (
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
                console.log('Favorite clicked for:', safePet.name);
              }}
            >
              <i className="fas fa-heart"></i>
            </Button>
          </div>
        )}
      </div>
      
      <Card.Body className={`d-flex flex-column ${styles.enhancedCardBody}`}>
        <Card.Title className={styles.enhancedCardTitle}>
          {safePet.name}
        </Card.Title>
        
        {/* Enhanced: Show breed, age, gender info */}
        {(safePet.breed || safePet.age || safePet.gender) && (
          <Card.Text className="text-muted mb-2">
            {[safePet.breed, safePet.age, safePet.gender].filter(Boolean).join(' • ')}
          </Card.Text>
        )}
        
        <Card.Text className={`text-muted small mb-2 flex-grow-1 ${styles.enhancedCardText}`}>
          {safePet.description}
        </Card.Text>

        {/* Enhanced Badges */}
        <div className={styles.enhancedBadges}>
          {safePet.type && (
            <Badge 
              bg="primary" 
              className={styles.enhancedBadge}
            >
              {safePet.type}
            </Badge>
          )}
          {safePet.size && (
            <Badge 
              bg="secondary" 
              className={styles.enhancedBadge}
            >
              {safePet.size}
            </Badge>
          )}
        </div>

        {/* Enhanced Button */}
        <Button 
          variant="warning" 
          className={`w-100 ${styles.enhancedButton}`}
        >
          <i className="fas fa-heart me-2"></i>
          Learn More
        </Button>
      </Card.Body>
    </>
  );

  // Return either a Link or a clickable div based on onClick prop
  return onClick ? (
    <Card 
      className={`h-100 ${styles.enhancedCard} ${className}`}
      style={{ cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      <CardContent />
    </Card>
  ) : (
    <Link 
      to={`/pets/${safePet._id}`} 
      className="text-decoration-none"
    >
      <Card className={`h-100 ${styles.enhancedCard} ${className}`}>
        <CardContent />
      </Card>
    </Link>
  );
};

export default PetCard;