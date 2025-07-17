// client/src/components/PetCard.js - UPDATED with ProxyImage
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProxyImage from './ProxyImage';

const PetCard = ({ pet }) => {
  if (!pet) {
    return (
      <Card className="h-100 shadow-sm">
        <div className="p-4 text-center text-muted">
          <i className="fas fa-paw fa-2x mb-2"></i>
          <p>Pet information unavailable</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = () => {
    const status = pet.status?.toLowerCase() || 'available';
    const badgeConfig = {
      available: { bg: 'success', icon: 'fas fa-heart', text: 'Available' },
      pending: { bg: 'warning', icon: 'fas fa-clock', text: 'Pending' },
      adopted: { bg: 'secondary', icon: 'fas fa-home', text: 'Adopted' }
    };
    
    return badgeConfig[status] || badgeConfig.available;
  };

  const getPetIcon = () => {
    const type = pet.type?.toLowerCase() || 'other';
    const icons = {
      dog: 'fas fa-dog',
      cat: 'fas fa-cat',
      bird: 'fas fa-dove',
      fish: 'fas fa-fish',
      rabbit: 'fas fa-rabbit',
      other: 'fas fa-paw'
    };
    return icons[type] || icons.other;
  };

  const statusBadge = getStatusBadge();
  const petIcon = getPetIcon();

  return (
    <Card className="h-100 shadow-sm">
      {/* Image Container with Badge Overlay */}
      <div className="position-relative" style={{ height: '250px' }}>
        <ProxyImage
          item={pet}
          category="pet"
          alt={`${pet.name} - ${pet.breed} ${pet.type}`}
          containerStyle={{ height: '100%' }}
          style={{ borderRadius: '0.375rem 0.375rem 0 0' }}
        />
        
        {/* Status Badge */}
        <div className="position-absolute top-0 end-0 p-2">
          <Badge bg={statusBadge.bg} className="d-flex align-items-center">
            <i className={`${statusBadge.icon} me-1`}></i>
            {statusBadge.text}
          </Badge>
        </div>
        
        {/* Featured Badge */}
        {pet.featured && (
          <div className="position-absolute top-0 start-0 p-2">
            <Badge bg="warning" text="dark">
              <i className="fas fa-star me-1"></i>
              Featured
            </Badge>
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        {/* Pet Name */}
        <Card.Title className="text-primary mb-2 d-flex align-items-center">
          <i className={`${petIcon} me-2`}></i>
          {pet.name || 'Unnamed Pet'}
        </Card.Title>
        
        {/* Pet Details */}
        <div className="mb-2">
          <small className="text-muted d-block">
            <i className="fas fa-info-circle me-1"></i>
            <strong>{pet.breed || 'Mixed'}</strong> • {pet.type || 'Pet'}
          </small>
          
          {pet.age && (
            <small className="text-muted d-block">
              <i className="fas fa-birthday-cake me-1"></i>
              {pet.age}
            </small>
          )}
          
          {pet.size && (
            <small className="text-muted d-block">
              <i className="fas fa-ruler me-1"></i>
              {pet.size} size
            </small>
          )}
        </div>
        
        {/* Description */}
        <Card.Text className="flex-grow-1 text-muted">
          {pet.description 
            ? (pet.description.length > 100 
                ? pet.description.substring(0, 100) + '...'
                : pet.description)
            : 'A wonderful pet looking for a loving home.'
          }
        </Card.Text>
        
        {/* Action Button */}
        <div className="mt-auto">
          {pet.status?.toLowerCase() === 'available' ? (
            <Link to={`/pets/${pet._id}`} className="btn btn-primary w-100">
              <i className="fas fa-heart me-2"></i>
              Meet {pet.name || 'Me'}
            </Link>
          ) : (
            <Button variant="outline-secondary" disabled className="w-100">
              <i className="fas fa-info-circle me-2"></i>
              {pet.status === 'adopted' ? 'Adopted' : 'Not Available'}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;