// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaPaw, FaMars, FaVenus, FaMapMarkerAlt } from 'react-icons/fa';

// Fallback image handling
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
  rabbit: 'https://via.placeholder.com/300x200?text=Rabbit',
  hamster: 'https://via.placeholder.com/300x200?text=Hamster',
  'guinea-pig': 'https://via.placeholder.com/300x200?text=Guinea+Pig',
  ferret: 'https://via.placeholder.com/300x200?text=Ferret',
  chinchilla: 'https://via.placeholder.com/300x200?text=Chinchilla',
  hedgehog: 'https://via.placeholder.com/300x200?text=Hedgehog',
  'sugar-glider': 'https://via.placeholder.com/300x200?text=Sugar+Glider',
  'fancy-rat': 'https://via.placeholder.com/300x200?text=Fancy+Rat',
  gerbil: 'https://via.placeholder.com/300x200?text=Gerbil',
  stoat: 'https://via.placeholder.com/300x200?text=Stoat',
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
    
    // Portrait containers for tall pets
    if (petType === 'cat' && (breed?.includes('maine') || breed?.includes('long'))) return 'portrait';
    if (petType === 'dog' && (breed?.includes('great dane') || breed?.includes('saint bernard'))) return 'portrait';
    if (petType === 'ferret' || petType === 'stoat') return 'portrait';
    
    // Landscape containers for wide/long pets
    if (petType === 'fish' || petType === 'reptile') return 'landscape';
    if (petType === 'dog' && (breed?.includes('dachshund') || breed?.includes('corgi'))) return 'landscape';
    
    // Tall containers for very tall pets
    if (petType === 'bird' && breed?.includes('macaw')) return 'tall';
    
    // Default square for most pets
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

  const formatAdoptionFee = (fee) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(fee || 0);
  };

  const statusBadge = getStatusBadge(safePet.status);
  const imageContainerClass = getImageContainerClass();

  return (
    <Card 
      className={`card enhanced-card modern-pet-card ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`pet-img-container ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={safePet.name}
          className={`pet-img ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Status Badge */}
        {showAdoptionStatus && (
          <div className={`badge statusBadge ${safePet.status}`}>
            {statusBadge.icon} {statusBadge.text}
          </div>
        )}

        {/* Featured Badge */}
        {safePet.featured && (
          <div className="badge statusBadge" style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '8px',
            background: '#ff6b6b',
            color: 'white'
          }}>
            ⭐ Featured
          </div>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute bottom-0 end-0 m-2 rounded-circle"
            onClick={handleFavoriteClick}
            style={{ width: '35px', height: '35px', zIndex: 10, opacity: 0.9 }}
          >
            <FaHeart size={14} />
          </Button>
        )}
      </div>

      <Card.Body className="card-body">
        {/* Pet Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Title className="card-title text-capitalize mb-0">
            {safePet.name}
          </Card.Title>
          <div className="d-flex align-items-center">
            {getGenderIcon(safePet.gender)}
          </div>
        </div>

        {/* Pet Details */}
        <div className="mb-3">
          <small className="text-muted text-capitalize d-block">
            {safePet.breed} • {safePet.age} • {safePet.size}
          </small>
        </div>

        {/* Location */}
        {safePet.location && (
          <div className="mb-2">
            <small className="text-muted d-block">
              <FaMapMarkerAlt className="me-1" />
              {safePet.location}
            </small>
          </div>
        )}

        {/* Heart Rating */}
        {safePet.heartRating > 0 && (
          <div className="mb-3 d-flex justify-content-center">
            <div className="d-flex align-items-center gap-1">
              {renderHeartRating(safePet.heartRating)}
              <small className="text-muted ms-1">({safePet.heartRating}/5)</small>
            </div>
          </div>
        )}

        {/* Description */}
        <Card.Text className="card-text">
          {safePet.description && safePet.description.length > 100 
            ? `${safePet.description.slice(0, 100)}...`
            : safePet.description}
        </Card.Text>

        {/* Pet Badges */}
        <div className="enhanced-badges mb-3">
          {safePet.isVaccinated && (
            <Badge bg="info" className="enhanced-badge" title="Vaccinated">
              💉 Vaccinated
            </Badge>
          )}
          {safePet.isSpayedNeutered && (
            <Badge bg="success" className="enhanced-badge" title="Spayed/Neutered">
              ✂️ Fixed
            </Badge>
          )}
          {safePet.needsSpecialCare && (
            <Badge bg="warning" className="enhanced-badge" title="Needs Special Care">
              ⚠️ Special Care
            </Badge>
          )}
        </div>

        {/* Adoption Fee */}
        <div className="text-center mb-3">
          <div className="fw-bold text-success fs-5">
            {formatAdoptionFee(safePet.adoptionFee)} Adoption Fee
          </div>
        </div>

        {/* Action Button */}
        <div className="d-grid">
          <Link 
            to={`/pets/${safePet._id}`} 
            className="btn btn-primary enhanced-button"
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none' }}
          >
            <FaPaw className="me-2" />
            Meet {safePet.name}
          </Link>
        </div>

        {/* Quick Pet Info */}
        <div className="mt-3 pt-2 border-top">
          <div className="row text-center">
            <div className="col-4">
              <small className="text-muted d-block">Type</small>
              <small className="fw-bold text-capitalize">{safePet.type}</small>
            </div>
            <div className="col-4">
              <small className="text-muted d-block">Age</small>
              <small className="fw-bold text-capitalize">{safePet.age}</small>
            </div>
            <div className="col-4">
              <small className="text-muted d-block">Size</small>
              <small className="fw-bold text-capitalize">{safePet.size}</small>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;