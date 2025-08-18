// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaPaw, FaMars, FaVenus, FaMapMarkerAlt } from 'react-icons/fa';

// ✅ Add this line to load the “second” CSS globally
import './EnhancedCards.css';

// Fallback image handling since getPetImageUrl might not exist
const buildPetImageUrl = (imagePath, petType) => {
  if (!imagePath) return `https://via.placeholder.com/300x200?text=${encodeURIComponent(petType || 'Pet')}`;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
};

const FALLBACK_IMAGES = {
  dog: 'https://via.placeholder.com/300x200?text=Dog',
  cat: 'https://via.placeholder.com/300x200?text=Cat',
  bird: 'https://via.placeholder.com/300x200?text=Bird',
  fish: 'https://via.placeholder.com/300x200?text=Fish',
  pet: 'https://via.placeholder.com/300x200?text=Pet'
};

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

  const safePet = {
    ...pet,
    name: String(pet.name || 'Unknown Pet'),
    breed: String(pet.breed || 'Unknown Breed'),
    age: String(pet.age || 'Unknown'),
    size: String(pet.size || 'Unknown'),
    type: String(pet.type || 'pet'),
    status: String(pet.status || 'available'),
    description: String(pet.description || 'This adorable pet is looking for a loving home.'),
    location: String(pet.location || ''),
    gender: String(pet.gender || '')
  };

  const getImageUrl = () => buildPetImageUrl(safePet.image, safePet.type);
  const getFallbackUrl = () => FALLBACK_IMAGES[safePet.type] || FALLBACK_IMAGES.pet;

  const imageUrl = getImageUrl();
  const fallbackUrl = getFallbackUrl();

  const getImageContainerClass = () => {
    const petType = safePet.type?.toLowerCase();
    const breed = safePet.breed?.toLowerCase();
    if (petType === 'cat' && (breed?.includes('maine') || breed?.includes('long'))) return 'portrait';
    if (petType === 'dog' && (breed?.includes('great dane') || breed?.includes('saint bernard'))) return 'portrait';
    if (petType === 'fish' || petType === 'reptile') return 'landscape';
    if (petType === 'dog' && (breed?.includes('dachshund') || breed?.includes('corgi'))) return 'landscape';
    return 'square';
  };

  const handleImageError = (e) => {
    if (!imageError && e.target.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleImageLoad = () => setImageLoaded(true);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) onFavorite(safePet, !isFavorited);
  };

  const handleCardClick = () => onClick && onClick(safePet);

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

  const statusBadge = getStatusBadge(safePet.status);
  const imageContainerClass = getImageContainerClass();

  return (
    <Card 
      className={`enhancedCard modernPetCard ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`petImgContainer ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={safePet.name}
          className={`petImg ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={handleFavoriteClick}
            style={{ width: '35px', height: '35px', zIndex: 10, opacity: 0.9 }}
          >
            <FaHeart size={14} />
          </Button>
        )}
      </div>

      <Card.Body className="enhancedCardBody">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Title 
            className="enhancedCardTitle text-capitalize mb-0"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', writingMode: 'horizontal-tb', direction: 'ltr', display: 'block' }}
          >
            {safePet.name}
          </Card.Title>
          <div className="d-flex align-items-center">{getGenderIcon(safePet.gender)}</div>
        </div>

        <div className="mb-3">
          <small className="text-muted text-capitalize" style={{ display: 'block' }}>
            {safePet.breed} • {safePet.age} • {safePet.size}
          </small>
        </div>

        {safePet.location && (
          <div className="mb-2">
            <small className="text-muted" style={{ display: 'block' }}>
              <FaMapMarkerAlt className="me-1" />
              {safePet.location}
            </small>
          </div>
        )}

        <div className="mb-3 d-flex justify-content-center">
          <div className="d-flex align-items-center gap-1">
            {renderHeartRating(safePet.heartRating)}
            <small className="text-muted ms-1">({safePet.heartRating || 0}/5)</small>
          </div>
        </div>

        <Card.Text 
          className="enhancedCardText"
          style={{ display: 'block', whiteSpace: 'normal', wordWrap: 'break-word' }}
        >
          {safePet.description && safePet.description.length > 100 
            ? `${safePet.description.slice(0, 100)}...`
            : safePet.description}
        </Card.Text>

        <div className="enhancedBadges">
          {showAdoptionStatus && (
            <Badge bg={statusBadge.variant} className="enhancedBadge">
              {statusBadge.icon} {statusBadge.text}
            </Badge>
          )}
          {safePet.featured && <Badge bg="primary" className="enhancedBadge">⭐ Featured</Badge>}
          {safePet.isVaccinated && <Badge bg="info" className="enhancedBadge" title="Vaccinated">💉 Vaccinated</Badge>}
          {safePet.isSpayedNeutered && <Badge bg="success" className="enhancedBadge" title="Spayed/Neutered">✂️ Fixed</Badge>}
          {safePet.needsSpecialCare && <Badge bg="warning" className="enhancedBadge" title="Needs Special Care">⚠️ Special Care</Badge>}
        </div>

        <div className="text-center mb-3">
          <div className="fw-bold text-success fs-5" style={{ display: 'block' }}>
            ${safePet.adoptionFee || 0} Adoption Fee
          </div>
        </div>

        <div className="d-grid">
          <Link 
            to={`/pets/${safePet._id}`} 
            className="btn btn-warning enhancedButton"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'block', textDecoration: 'none' }}
          >
            <FaPaw className="me-2" />
            <span style={{ display: 'inline' }}>Meet {safePet.name}</span>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
