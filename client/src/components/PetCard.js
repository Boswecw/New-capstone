// client/src/components/PetCard.js
import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaHeart, FaPaw, FaMars, FaVenus } from 'react-icons/fa';
import { getPetImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

const PetCard = ({ pet, onClick }) => {
  // Get the correct image URL using our hardcoded mapping
  const imageUrl = getPetImageUrl(pet.image, pet.type);
  const fallbackUrl = FALLBACK_IMAGES[pet.type] || FALLBACK_IMAGES.pet;

  const handleImageError = (e) => {
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { variant: 'success', text: 'Available' },
      pending: { variant: 'warning', text: 'Pending' },
      adopted: { variant: 'secondary', text: 'Adopted' }
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
          className={i <= rating ? 'text-danger' : 'text-muted'}
          size={14}
        />
      );
    }
    return hearts;
  };

  const statusBadge = getStatusBadge(pet.status);

  return (
    <Card 
      className="h-100 shadow-sm pet-card" 
      onClick={() => onClick && onClick(pet)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={pet.name}
          onError={handleImageError}
          style={{
            height: '200px',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        <Badge 
          bg={statusBadge.variant}
          className="position-absolute top-0 end-0 m-2"
        >
          {statusBadge.text}
        </Badge>
        {pet.featured && (
          <Badge 
            bg="primary"
            className="position-absolute top-0 start-0 m-2"
          >
            Featured
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0 text-capitalize">
            {pet.name}
          </Card.Title>
          <div className="d-flex align-items-center gap-1">
            {getGenderIcon(pet.gender)}
          </div>
        </div>

        <div className="mb-2">
          <small className="text-muted text-capitalize">
            {pet.breed} • {pet.age} • {pet.size}
          </small>
        </div>

        <div className="mb-2">
          <div className="d-flex align-items-center gap-1">
            {renderHeartRating(pet.heartRating || 0)}
            <small className="text-muted ms-1">
              ({pet.heartRating || 0}/5)
            </small>
          </div>
        </div>

        <Card.Text className="text-muted small flex-grow-1">
          {pet.description}
        </Card.Text>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-success fw-bold">
              ${pet.adoptionFee}
            </div>
            <div className="d-flex gap-1">
              {pet.isVaccinated && (
                <Badge bg="info" pill>💉 Vaccinated</Badge>
              )}
              {pet.isSpayedNeutered && (
                <Badge bg="success" pill>✂️ Fixed</Badge>
              )}
              {pet.needsSpecialCare && (
                <Badge bg="warning" pill>⚠️ Special Care</Badge>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;