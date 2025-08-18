// client/src/components/PetCard.js
import React, { useState, useMemo, useCallback } from 'react';
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
  onFavorite,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // sanitize inputs
  const safePet = useMemo(() => ({
    ...pet,
    name: String(pet?.name || 'Unknown Pet'),
    breed: String(pet?.breed || 'Unknown Breed'),
    age: String(pet?.age || 'Unknown'),
    size: String(pet?.size || 'Unknown'),
    type: String(pet?.type || 'pet'),
    status: String(pet?.status || 'available'),
    description: String(pet?.description || 'This adorable pet is looking for a loving home.'),
    location: String(pet?.location || ''),
    gender: String(pet?.gender || ''),
  }), [pet]);

  const imageUrl = useMemo(() => buildPetImageUrl(safePet.image, safePet.type), [safePet.image, safePet.type]);
  const fallbackUrl = useMemo(() => FALLBACK_IMAGES[safePet.type?.toLowerCase()] || FALLBACK_IMAGES.pet, [safePet.type]);

  const getImageContainerClass = useCallback(() => {
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

    return 'square';
  }, [safePet.type, safePet.breed]);

  const handleImageError = (e) => {
    if (!imageError && e.target?.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((v) => {
      const next = !v;
      onFavorite && onFavorite(safePet, next);
      return next;
    });
  };

  const handleFavoriteKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleFavoriteClick(e);
    }
  };

  const handleCardClick = () => onClick && onClick(safePet);

  const getStatusBadge = (status) => {
    const badges = {
      available: { variant: 'success', icon: '✨', text: 'Available' },
      pending: { variant: 'warning', icon: '⏳', text: 'Pending' },
      adopted: { variant: 'secondary', icon: '❤️', text: 'Adopted' },
    };
    return badges[status] || badges.available;
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'male') return <FaMars className="text-primary" aria-label="Male" />;
    if (gender?.toLowerCase() === 'female') return <FaVenus className="text-danger" aria-label="Female" />;
    return <FaPaw className="text-muted" aria-label="Unknown gender" />;
  };

  const renderHeartRating = (rating) => {
    const val = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <FaHeart
        key={i}
        className={i < val ? 'text-danger' : 'text-muted'}
        size={12}
        aria-hidden="true"
      />
    ));
  };

  const formatAdoptionFee = (fee) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fee || 0);

  const statusBadge = getStatusBadge(safePet.status);
  const imageContainerClass = getImageContainerClass();

  return (
    <div
      className={`enhanced-card modern-pet-card hover-lift ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') onClick(safePet);
      }}
    >
      {/* IMAGE */}
      <div className={`pet-img-container ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={`${safePet.name} the ${safePet.type}`}
          className={`pet-img img-cover ${imageLoaded ? '' : 'loading'}`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />

        {/* Unified overlay: shows on hover (desktop) per CSS */}
        <div className="media-overlay">
          <div className="overlay-left" style={{ display: 'flex', gap: '0.35rem' }}>
            {safePet.featured && (
              <span className="badge-featured" aria-label="Featured">
                <span className="featured-icon" aria-hidden="true">⭐</span>
                <span className="featured-text">Featured</span>
              </span>
            )}

            {showAdoptionStatus && (
              <span className={`badge-status status-${safePet.status}`} role="status" aria-live="polite">
                <span className="status-icon" aria-hidden="true">{statusBadge.icon}</span>
                <span className="status-text">{statusBadge.text}</span>
              </span>
            )}
          </div>

          <div className="overlay-right">
            {showFavoriteButton && (
              <button
                type="button"
                className={`btn-favorite ${isFavorited ? 'favorited' : ''}`}
                onClick={handleFavoriteClick}
                onKeyDown={handleFavoriteKey}
                aria-pressed={isFavorited}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <FaHeart size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="enhanced-card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="enhanced-card-title text-capitalize m-0">
            {safePet.name}
          </h5>
          <div className="gender-icon">
            {getGenderIcon(safePet.gender)}
          </div>
        </div>

        {/* Details line */}
        <div className="pet-details mb-2">
          <small className="text-secondary text-capitalize">
            {safePet.breed} • {safePet.age} • {safePet.size}
          </small>
        </div>

        {/* Location */}
        {safePet.location && (
          <div className="pet-location mb-3">
            <small className="text-secondary">
              <FaMapMarkerAlt className="me-1" aria-hidden="true" />
              <span className="visually-hidden">Location:</span>
              {safePet.location}
            </small>
          </div>
        )}

        {/* Heart Rating */}
        {(Number(safePet.heartRating) || 0) > 0 && (
          <div className="rating-container mb-3">
            <div className="heart-rating">
              {renderHeartRating(safePet.heartRating)}
              <small className="rating-text">({Number(safePet.heartRating)}/5)</small>
            </div>
          </div>
        )}

        {/* Description (CSS clamps to 3 lines) */}
        <p className="enhanced-card-text">
          {safePet.description}
        </p>

        {/* Pet Chips (moved off the photo) */}
        <div className="enhanced-badges mb-3">
          {safePet.isVaccinated && (
            <span className="enhanced-badge badge-info" title="Vaccinated">
              <span className="badge-icon" aria-hidden="true">💉</span>
              <span className="badge-text">Vaccinated</span>
            </span>
          )}
          {safePet.isSpayedNeutered && (
            <span className="enhanced-badge badge-success" title="Spayed/Neutered">
              <span className="badge-icon" aria-hidden="true">✂️</span>
              <span className="badge-text">Fixed</span>
            </span>
          )}
          {safePet.needsSpecialCare && (
            <span className="enhanced-badge badge-warning" title="Needs Special Care">
              <span className="badge-icon" aria-hidden="true">⚠️</span>
              <span className="badge-text">Special Care</span>
            </span>
          )}
        </div>

        {/* Adoption Fee */}
        <div className="adoption-fee mb-3" aria-label="Adoption Fee">
          <div className="fee-amount">{formatAdoptionFee(safePet.adoptionFee)}</div>
          <div className="fee-label">Adoption Fee</div>
        </div>

        {/* CTA */}
        <div className="card-actions mb-3">
          <Link
            to={`/pets/${safePet._id}`}
            className="enhanced-button btn-primary w-100"
            onClick={(e) => e.stopPropagation()}
          >
            <FaPaw className="me-2" aria-hidden="true" />
            Meet {safePet.name}
          </Link>
        </div>

        {/* Quick Info Grid */}
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
