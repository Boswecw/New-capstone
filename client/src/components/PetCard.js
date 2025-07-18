// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const PetCard = ({ pet }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageLoaded(true); // still show even fallback

  return (
    <Card className="h-100 shadow-sm">
      <Link to={`/pets/${pet._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '250px', overflow: 'hidden' }}>
          {!imageLoaded && (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
              <Spinner animation="border" variant="secondary" />
            </div>
          )}
          <SafeImage
            item={pet}
            category={pet.type}
            alt={pet.name}
            fitMode="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
        <Card.Body>
          <Card.Title>{pet.name}</Card.Title>
          <Card.Text>
            <strong>Type:</strong> {pet.type}<br />
            <strong>Breed:</strong> {pet.breed}<br />
            <strong>Age:</strong> {pet.age}
          </Card.Text>
          <Button variant="primary" className="w-100 mt-2">View Details</Button>
        </Card.Body>
      </Link>
    </Card>
  );
};

export default PetCard;
