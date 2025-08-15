// client/src/components/PetCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

/**
 * PetCard Component - Display individual pet information
 * Uses SafeImage with the new unified image URL builder
 */
const PetCard = ({ pet, showDetails = true }) => {
  // Ensure we have a valid pet object
  if (!pet) return null;
  
  return (
    <Card className="h-100 shadow-sm pet-card">
      {/* Image Section */}
      <div style={{ height: 250, overflow: 'hidden' }}>
        <SafeImage
          item={pet}                    // Pass the entire pet object
          entityType="pet"              // Specify entity type
          category={pet.category}       // Pass category for better fallback
          alt={`${pet.name} - ${pet.breed}`}
          className="card-img-top"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          imgProps={{
            loading: 'lazy'
          }}
        />
      </div>
      
      {/* Card Body */}
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h5">
          {pet.name}
          {pet.featured && (
            <span className="badge bg-warning text-dark ms-2">Featured</span>
          )}
        </Card.Title>
        
        <Card.Subtitle className="mb-2 text-muted">
          {pet.breed} • {pet.type}
        </Card.Subtitle>
        
        <Card.Text className="flex-grow-1">
          <small className="text-muted">
            {pet.age} • {pet.size} • {pet.gender}
          </small>
          <br />
          {pet.description && (
            <span className="mt-2 d-block">
              {pet.description.substring(0, 100)}
              {pet.description.length > 100 && '...'}
            </span>
          )}
        </Card.Text>
        
        {/* Pet Status */}
        <div className="mb-3">
          <span className={`badge ${
            pet.status === 'available' ? 'bg-success' : 
            pet.status === 'pending' ? 'bg-warning' : 'bg-secondary'
          }`}>
            {pet.status === 'available' ? 'Available for Adoption' :
             pet.status === 'pending' ? 'Adoption Pending' : 'Adopted'}
          </span>
        </div>
        
        {/* Action Buttons */}
        {showDetails && pet.status === 'available' && (
          <div className="d-grid gap-2">
            <Link to={`/pets/${pet._id}`} className="btn btn-primary">
              View Details
            </Link>
            {pet.adoptionFee && (
              <small className="text-center text-muted">
                Adoption Fee: ${pet.adoptionFee}
              </small>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

PetCard.propTypes = {
  pet: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    breed: PropTypes.string,
    age: PropTypes.string,
    size: PropTypes.string,
    gender: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    status: PropTypes.string,
    category: PropTypes.string,
    featured: PropTypes.bool,
    adoptionFee: PropTypes.number
  }).isRequired,
  showDetails: PropTypes.bool
};

export default PetCard;