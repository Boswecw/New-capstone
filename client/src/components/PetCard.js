import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from '../components/SafeImage';

const PetCard = ({ pet }) => {
  return (
    <Card className="h-100 shadow-sm pet-card">
      {/* Pet Image - FIXED */}
      <SafeImage
        item={pet}
        category={pet.type || 'pet'}
        size="card"
        showLoader={true}
        className="card-img-top"
      />
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h5 mb-2">
          {pet.name}
        </Card.Title>
        
        <Card.Text className="text-muted small mb-2 flex-grow-1">
          {pet.description || pet.bio || 'Adorable pet looking for a loving home!'}
        </Card.Text>
        
        <div className="mb-3">
          {pet.type && (
            <Badge bg="primary" className="me-2">
              {pet.type}
            </Badge>
          )}
          {pet.age && (
            <Badge bg="secondary" className="me-2">
              {pet.age}
            </Badge>
          )}
          {pet.gender && (
            <Badge bg="info">
              {pet.gender}
            </Badge>
          )}
        </div>
        
        <Button
          as={Link}
          to={`/pets/${pet._id}`}
          variant="primary"
          className="mt-auto"
        >
          Learn More
        </Button>
      </Card.Body>
    </Card>
  );
};

export default PetCard;