// client/src/components/PetCard.js

import React, { useState } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import HeartRating from './HeartRating';

const PetCard = ({ pet }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);

  return (
    <Card className="shadow-sm mb-4">
      <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div className="d-flex justify-content-center align-items-center h-100 bg-light">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        <SafeImage
          item={pet}
          category={pet.type}
          alt={pet.name}
          onLoad={handleImageLoad}
          className="w-100"
          style={{
            display: imageLoaded ? 'block' : 'none',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      <Card.Body>
        <Card.Title>{pet.name}</Card.Title>
        <Card.Text>
          <strong>Breed:</strong> {pet.breed}<br />
          <strong>Age:</strong> {pet.age}
        </Card.Text>

        <HeartRating initial={pet.rating || 0} max={5} size={18} />

        <Link to={`/pets/${pet._id}`}>
          <Button variant="primary" className="mt-2">View Details</Button>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
