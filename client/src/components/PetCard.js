import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PetCard = ({ pet, onVote }) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  const handleVote = async (voteType) => {
    if (!user || voting) return;
    
    setVoting(true);
    try {
      await api.post(`/pets/${pet._id}/vote`, { voteType });
      if (onVote) onVote(pet._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price;
  };

  return (
    <Card className="h-100 pet-card">
      <Card.Img 
        variant="top" 
        src={pet.image} 
        alt={pet.name}
        className="card-img-top"
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="text-primary">{pet.name}</Card.Title>
          <Badge bg={pet.available ? 'success' : 'secondary'}>
            {pet.available ? 'Available' : 'Adopted'}
          </Badge>
        </div>
        
        <Card.Text className="small flex-grow-1">
          <strong>Breed:</strong> {pet.breed}<br />
          <strong>Age:</strong> {pet.age}<br />
          {pet.size && <><strong>Size:</strong> {pet.size}<br /></>}
          {pet.gender && <><strong>Gender:</strong> {pet.gender}<br /></>}
          {pet.description}
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="price">{formatPrice(pet.price)}</span>
            {pet.averageRating > 0 && (
              <div className="rating-stars">
                <i className="fas fa-star"></i>
                <span className="ms-1">{pet.averageRating}</span>
              </div>
            )}
          </div>
          
          <div className="d-flex gap-2">
            <Link to={`/pet/${pet._id}`} className="btn btn-primary btn-sm flex-grow-1">
              View Details
            </Link>
            
            {user && (
              <div className="vote-buttons d-flex gap-1">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleVote('up')}
                  disabled={voting || !pet.available}
                >
                  <i className="fas fa-thumbs-up"></i>
                  <span className="ms-1">{pet.votes?.up || 0}</span>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleVote('down')}
                  disabled={voting || !pet.available}
                >
                  <i className="fas fa-thumbs-down"></i>
                  <span className="ms-1">{pet.votes?.down || 0}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;