import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge } from 'react-bootstrap';
import SafeImage from './SafeImage';

const PetCard = ({ pet, showFavoriteButton = false, showAdoptionStatus = true, className }) => {
  const status = pet.status || (pet.available === false ? 'adopted' : 'available');
  const statusVariant = status === 'adopted' ? 'secondary' : status === 'pending' ? 'warning' : 'success';

  return (
    <Card className={className || ''}>
      <div style={{ height: 220, overflow: 'hidden' }}>
        <SafeImage
          item={pet}
          src={pet.image || pet.imagePath || pet.imageUrl}
          entityType={pet.type || 'pet'}
          category={pet.category}
          alt={`${pet.name || 'Pet'} image`}
          imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }}
        />
      </div>
      <Card.Body>
        <Card.Title className="d-flex align-items-center justify-content-between">
          <span>{pet.name}</span>
          {showAdoptionStatus && (
            <Badge bg={statusVariant} className="ms-2 text-capitalize">
              {status}
            </Badge>
          )}
        </Card.Title>
        <Card.Text className="text-muted mb-2">
          {[pet.breed, pet.age, pet.gender].filter(Boolean).join(' • ')}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

PetCard.propTypes = {
  pet: PropTypes.object.isRequired,
  showFavoriteButton: PropTypes.bool,
  showAdoptionStatus: PropTypes.bool,
  className: PropTypes.string,
};

export default PetCard;
