// client/src/components/PetCard.js - ENHANCED VERSION (Works with your CSS)
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaPaw, FaMars, FaVenus, FaMapMarkerAlt } from 'react-icons/fa';
import { getPetImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

const PetCard = ({ 
  pet, 
  showFavoriteButton = false,
  showAdoptionStatus = true,
  className = '',
  variant = 'vertical',
  onClick,
  onFavorite
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ✅ SAME IMAGE HANDLING AS BEFORE
  const imageUrl = getPetImageUrl(pet.image, pet.type);
  const fallbackUrl = FALLBACK_IMAGES[pet.type] || FALLBACK_IMAGES.pet;

  // 🆕 DETERMINE IMAGE ASPECT RATIO for dynamic containers
  const getImageContainerClass = () => {
    // You can enhance this logic based on actual image dimensions if available
    // For now, using pet type and breed to make educated guesses
    const petType = pet.type?.toLowerCase();
    const breed = pet.breed?.toLowerCase();
    
    // Portrait pets (taller images)
    if (petType === 'cat' && (breed?.includes('maine') || breed?.includes('long'))) {
      return 'portrait';
    }
    if (petType === 'dog' && (breed?.includes('great dane') || breed?.includes('saint bernard'))) {
      return 'portrait';
    }
    
    // Landscape pets (wider images)  
    if (petType === 'fish' || petType === 'reptile') {
      return 'landscape';
    }
    if (petType === 'dog' && (breed?.includes('dachshund') || breed?.includes('corgi'))) {
      return 'landscape';
    }
    
    // Default to square
    return 'square';
  };

  const handleImageError = (e) => {
    if (!imageError && e.target.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(pet, !isFavorited);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(pet);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { variant: 'success', icon: '✨', text: 'Available' },
      pending: { variant: 'warning', icon: '⏳', text: 'Pending' },
      adopted: { variant: 'secondary', icon: '❤️', text: 'Adopted' }
    };
    return badges[status] || badges.available;
  };

  const getGenderIcon = (gender) => {
    if (gender === 'male') return <FaMars className="text-primary" />;
    if (gender === 'female') return <FaVenus className="text-danger" />;
    return <FaPaw className="text-muted" />;
  };

  const renderHeartRating = (rating) => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      hearts.push(
        <FaHeart
          key={i}
          className={i <= (rating || 0) ? 'text-danger' : 'text-muted'}
          size={12}
        />
      );
    }
    return hearts;
  };

  const statusBadge = getStatusBadge(pet.status);
  const imageContainerClass = getImageContainerClass();

  return (
    <Card 
      className={`enhancedCard modernPetCard ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 🆕 DYNAMIC IMAGE CONTAINER - Uses your CSS classes */}
      <div className={`petImgContainer ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={pet.name}
          className={`petImg ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Favorite Button Overlay */}
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={handleFavoriteClick}
            style={{ 
              width: '35px', 
              height: '35px',
              zIndex: 10,
              opacity: 0.9
            }}
          >
            <FaHeart size={14} />
          </Button>
        )}
      </div>

      {/* 🆕 ENHANCED CARD BODY - Uses your CSS classes */}
      <Card.Body className="enhancedCardBody">
        {/* Pet Name & Gender */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Title className="enhancedCardTitle text-capitalize mb-0">
            {pet.name}
          </Card.Title>
          <div className="d-flex align-items-center">
            {getGenderIcon(pet.gender)}
          </div>
        </div>

        {/* Pet Details */}
        <div className="mb-3">
          <small className="text-muted text-capitalize">
            {pet.breed} • {pet.age} • {pet.size}
          </small>
        </div>

        {/* Location */}
        {pet.location && (
          <div className="mb-2">
            <small className="text-muted">
              <FaMapMarkerAlt className="me-1" />
              {pet.location}
            </small>
          </div>
        )}

        {/* Heart Rating */}
        <div className="mb-3 d-flex justify-content-center">
          <div className="d-flex align-items-center gap-1">
            {renderHeartRating(pet.heartRating)}
            <small className="text-muted ms-1">
              ({pet.heartRating || 0}/5)
            </small>
          </div>
        </div>

        {/* Description */}
        <Card.Text className="enhancedCardText">
          {pet.description && pet.description.length > 100 
            ? `${pet.description.slice(0, 100)}...`
            : pet.description || 'This adorable pet is looking for a loving home.'}
        </Card.Text>

        {/* 🆕 ENHANCED BADGES - Uses your CSS classes */}
        <div className="enhancedBadges">
          {showAdoptionStatus && (
            <Badge 
              bg={statusBadge.variant}
              className="enhancedBadge"
            >
              {statusBadge.icon} {statusBadge.text}
            </Badge>
          )}
          
          {pet.featured && (
            <Badge bg="primary" className="enhancedBadge">
              ⭐ Featured
            </Badge>
          )}
          
          {pet.isVaccinated && (
            <Badge bg="info" className="enhancedBadge" title="Vaccinated">
              💉 Vaccinated
            </Badge>
          )}
          
          {pet.isSpayedNeutered && (
            <Badge bg="success" className="enhancedBadge" title="Spayed/Neutered">
              ✂️ Fixed
            </Badge>
          )}
          
          {pet.needsSpecialCare && (
            <Badge bg="warning" className="enhancedBadge" title="Needs Special Care">
              ⚠️ Special Care
            </Badge>
          )}
        </div>

        {/* Adoption Fee */}
        <div className="text-center mb-3">
          <div className="fw-bold text-success fs-5">
            ${pet.adoptionFee || 0} Adoption Fee
          </div>
        </div>

        {/* 🆕 ENHANCED BUTTON - Uses your CSS classes */}
        <div className="d-grid">
          <Link 
            to={`/pets/${pet._id}`} 
            className="btn btn-warning enhancedButton"
            onClick={(e) => e.stopPropagation()}
          >
            <FaPaw className="me-2" />
            Meet {pet.name}
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;