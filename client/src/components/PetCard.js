import React, { useState } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import styles from './Card.module.css';

const PetCard = ({ pet }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!pet) return null;

  const handleImageLoad = () => setImageLoaded(true);

  return (
    <Card className={`${styles.card} shadow h-100`}>
      <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" variant="secondary" />
          </div>
        )}
        <SafeImage
          item={pet}
          category={pet.type}
          alt={pet.name}
          onLoad={handleImageLoad}
          fitMode="cover"
        />
      </div>
      <Card.Body>
        <Card.Title>{pet.name}</Card.Title>
        <Card.Text className="mb-1">
          <strong>Breed:</strong> {pet.breed}
        </Card.Text>
        <Card.Text className="mb-2">
          <strong>Age:</strong> {pet.age}
        </Card.Text>
        <Link to={`/pets/${pet._id}`}>
          <Button variant="primary" className="w-100">View Details</Button>
        </Link>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
