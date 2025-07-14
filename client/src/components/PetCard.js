// client/src/components/PetCard.js - UPDATED WITH SAFEIMAGE INTEGRATION
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const PetCard = ({ pet, priority = false }) => {
  const handleImageLoad = () => {
    console.log('✅ PetCard image loaded:', pet.name);
  };

  const handleImageError = () => {
    console.log('❌ PetCard image failed:', pet.name);
  };

  const formatAge = (age) => {
    if (!age) return '';
    if (typeof age === 'string') return age;
    return `${age} ${age === 1 ? 'year' : 'years'} old`;
  };

  const getStatusBadge = () => {
    if (pet.adopted) {
      return <Badge bg="success" className="position-absolute top-0 end-0 m-2">Adopted</Badge>;
    }
    if (pet.featured) {
      return <Badge bg="warning" className="position-absolute top-0 end-0 m-2">Featured</Badge>;
    }
    if (pet.status === 'pending') {
      return <Badge bg="info" className="position-absolute top-0 end-0 m-2">Pending</Badge>;
    }
    return null;
  };

  const daysSincePosted = pet.createdAt
    ? Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="h-100 pet-card shadow-sm">
      <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
        <SafeImage
          src={pet.imageUrl || pet.image}
          alt={`${pet.name}, ${pet.breed} ${pet.type}`}
          type="pet"
          fallbackText={pet.name || "Pet"}
          loading={priority ? "eager" : "lazy"}
          style={{ 
            height: '250px', 
            width: '100%',
            objectFit: 'cover'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {getStatusBadge()}
        
        {daysSincePosted !== null && daysSincePosted < 7 && (
          <Badge bg="danger" className="position-absolute top-0 start-0 m-2">
            New
          </Badge>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex justify-content-between align-items-start mb-2">
          <span className="text-truncate" title={pet.name}>
            {pet.name}
          </span>
          {pet.age && (
            <small className="text-muted ms-2 flex-shrink-0">
              {formatAge(pet.age)}
            </small>
          )}
        </Card.Title>
        
        <Card.Text className="text-muted small mb-2">
          {pet.breed && pet.size 
            ? `${pet.breed} • ${pet.size}`
            : pet.breed || pet.size || pet.type || 'Pet'
          }
        </Card.Text>
        
        {pet.description && (
          <Card.Text 
            className="text-muted small mb-3" 
            style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {pet.description}
          </Card.Text>
        )}
        
        {pet.location && (
          <Card.Text className="text-muted small mb-2">
            <i className="fas fa-map-marker-alt me-1"></i>
            {pet.location}
          </Card.Text>
        )}
        
        <div className="mt-auto">
          {pet.specialNeeds && (
            <div className="text-info small mb-2">
              <i className="fas fa-heart me-1"></i>
              Special needs
            </div>
          )}
          
          {daysSincePosted !== null && (
            <div className="text-muted small mb-2">
              Posted {daysSincePosted === 0 ? 'today' : `${daysSincePosted} day${daysSincePosted === 1 ? '' : 's'} ago`}
            </div>
          )}
          
          <Button 
            variant={pet.adopted ? "secondary" : "primary"}
            className="w-100"
            as={Link}
            to={`/pets/${pet._id}`}
            disabled={pet.adopted}
          >
            {pet.adopted ? 'Already Adopted' : `Meet ${pet.name}`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;