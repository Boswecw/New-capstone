// client/src/components/PetCard.js
// Fixed: Removed unused Badge import
import React, { useState } from 'react';
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
    <div 
      className={`enhanced-card modern-pet-card hover-lift ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`pet-img-container ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={safePet.name}
          className={`pet-img img-cover ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Status Badge */}
        {showAdoptionStatus && (
          <div className={`badge-status status-${safePet.status}`}>
            <span className="status-icon">{statusBadge.icon}</span>
            <span className="status-text">{statusBadge.text}</span>
          </div>
        )}

        {/* Featured Badge */}
        {safePet.featured && (
          <div className="badge-featured">
            <span className="featured-icon">⭐</span>
            <span className="featured-text">Featured</span>
          </div>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && (
          <button
            className={`btn-favorite ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FaHeart size={14} />
          </button>
        )}
      </div>

      <div className="enhanced-card-body">
        {/* Pet Header - Using your utilities */}
        <div className="d-flex justify-between items-center mb-3">
          <h5 className="enhanced-card-title text-capitalize m-0">
            {safePet.name}
          </h5>
          <div className="gender-icon">
            {getGenderIcon(safePet.gender)}
          </div>
        </div>

        {/* Pet Details */}
        <div className="pet-details mb-3">
          <small className="text-secondary text-capitalize">
            {safePet.breed} • {safePet.age} • {safePet.size}
          </small>
        </div>

        {/* Location */}
        {safePet.location && (
          <div className="pet-location mb-3">
            <small className="text-secondary">
              <FaMapMarkerAlt className="me-1" />
              {safePet.location}
            </small>
          </div>
        )}

        {/* Heart Rating */}
        {safePet.heartRating > 0 && (
          <div className="rating-container mb-3">
            <div className="heart-rating">
              {renderHeartRating(safePet.heartRating)}
              <small className="rating-text">({safePet.heartRating}/5)</small>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="enhanced-card-text">
          {safePet.description && safePet.description.length > 100 
            ? `${safePet.description.slice(0, 100)}...`
            : safePet.description}
        </p>

        {/* Pet Badges */}
        <div className="enhanced-badges mb-3">
          {safePet.isVaccinated && (
            <span className="enhanced-badge badge-info">
              <span className="badge-icon">💉</span>
              <span className="badge-text">Vaccinated</span>
            </span>
          )}
          {safePet.isSpayedNeutered && (
            <span className="enhanced-badge badge-success">
              <span className="badge-icon">✂️</span>
              <span className="badge-text">Fixed</span>
            </span>
          )}
          {safePet.needsSpecialCare && (
            <span className="enhanced-badge badge-warning">
              <span className="badge-icon">⚠️</span>
              <span className="badge-text">Special Care</span>
            </span>
          )}
        </div>

        {/* Adoption Fee */}
        <div className="adoption-fee mb-3">
          <div className="fee-amount">
            {formatAdoptionFee(safePet.adoptionFee)}
          </div>
          <div className="fee-label">Adoption Fee</div>
        </div>

        {/* Action Button */}
        <div className="card-actions mb-3">
          <Link 
            to={`/pets/${safePet._id}`} 
            className="enhanced-button btn-primary w-100"
            onClick={(e) => e.stopPropagation()}
          >
            <FaPaw className="me-2" />
            Meet {safePet.name}
          </Link>
        </div>

        {/* Quick Pet Info */}
        <div className="pet-info-grid">
          <div className="info-item">
            <small className="info-label">Type</small>
            <small className="info-value text-capitalize">{safePet.type}</small>
          </div>
          <div className="info-item">
            <small className="info-label">Age</small>
            <small className="info-value text-capitalize">{safePet.age}</small>
          </div>
          <div className="info-item">
            <small className="info-label">Size</small>
            <small className="info-value text-capitalize">{safePet.size}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetCard;