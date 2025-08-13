// client/src/components/PetCard.js - UPDATED FOR IMPROVED SAFEIMAGE

import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import styles from './Card.module.css';

// Helper function to safely pick the best image URL
const pickImage = (pet) => {
  const raw = pet.imageUrl || pet.image || (Array.isArray(pet.images) && pet.images.length ? pet.images[0] : "");
  if (!raw) return "";
  
  const isAbsolute = /^https?:\/\//i.test(raw);
  return isAbsolute ? raw : `/api/images/resolve?src=${encodeURIComponent(raw)}`;
};

const PetCard = ({ 
  pet, 
  showFavoriteButton = false,
  showAdoptionStatus = true,
  onClick = null,
  className = ""
}) => {
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

  // Create safe pet object with proper field mapping
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
    image: pet.image || pet.imageUrl || null,
    ...pet
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
      {/* Image container with normalized URL */}
      <div className={`${styles.petImgContainer} position-relative`}>
        <SafeImage
          alt={safePet.name}
          src={pickImage(safePet)}
          size="large"
          className={`${styles.petImg} w-100 rounded`}
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
            {safePet.status && (
              <Badge 
                bg={safePet.status === 'available' ? 'success' : 
                    safePet.status === 'adopted' ? 'info' : 
                    safePet.status === 'pending' ? 'warning' : 'secondary'}
                className="text-capitalize"
              >
                {safePet.status}
              </Badge>
            )}
          </div>
        )}

        {/* Favorite Button Overlay */}
        {showFavoriteButton && (
          <div className="position-absolute top-0 end-0 p-2">
            <Button
              variant="outline-light"
              size="sm"
              className="rounded-circle"
              style={{ width: '35px', height: '35px' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle favorite logic here
                console.log('Favorited:', safePet.name);
              }}
            >
              <i className="fas fa-heart"></i>
            </Button>
          </div>
        )}
      </div>

      <Card.Body className={`${styles.enhancedCardBody} d-flex flex-column`}>
        {/* Pet Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`${styles.enhancedCardTitle} mb-0 flex-grow-1`}>
            {safePet.name}
          </Card.Title>
          {safePet.age && (
            <Badge bg="light" text="dark" className="ms-2">
              {safePet.age}
            </Badge>
          )}
        </div>

        {/* Pet Details */}
        <div className="text-muted small mb-2">
          <span className="text-capitalize">{safePet.type}</span>
          {safePet.breed && (
            <>
              <span className="mx-1">•</span>
              <span>{safePet.breed}</span>
            </>
          )}
          {safePet.gender && (
            <>
              <span className="mx-1">•</span>
              <span className="text-capitalize">{safePet.gender}</span>
            </>
          )}
        </div>

        {/* Description */}
        <Card.Text className={`${styles.enhancedCardText} flex-grow-1`}>
          {safePet.description.length > 100 
            ? `${safePet.description.substring(0, 100)}...`
            : safePet.description
          }
        </Card.Text>

        {/* Location */}
        {safePet.location && (
          <div className="text-muted small mb-2">
            <i className="fas fa-map-marker-alt me-1"></i>
            {typeof safePet.location === 'string' 
              ? safePet.location 
              : `${safePet.location.city || ''}, ${safePet.location.state || ''}`.replace(/^,\s*/, '')
            }
          </div>
        )}

        {/* Adoption Fee */}
        {safePet.adoptionFee && safePet.adoptionFee > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small">Adoption Fee:</span>
            <Badge bg="success">${safePet.adoptionFee}</Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto pt-2">
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="sm"
              as={!onClick ? Link : 'button'}
              to={!onClick ? `/pets/${safePet._id}` : undefined}
              onClick={onClick ? handleCardClick : undefined}
            >
              <i className="fas fa-info-circle me-1"></i>
              Learn More
            </Button>
            
            {safePet.status === 'available' && (
              <Button 
                variant="outline-success" 
                size="sm"
                as={Link}
                to={`/adopt/${safePet._id}`}
              >
                <i className="fas fa-heart me-1"></i>
                Adopt Me
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </>
  );

  // Render with or without Link wrapper based on onClick prop
  if (onClick) {
    return (
      <Card 
        className={`h-100 ${styles.enhancedCard} ${className}`}
        style={{ cursor: 'pointer' }}
        onClick={handleCardClick}
      >
        <CardContent />
      </Card>
    );
  }

  return (
    <Card className={`h-100 ${styles.enhancedCard} ${className}`}>
      <CardContent />
    </Card>
  );
};

export default PetCard;