// client/src/components/PetCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const PetCard = ({ pet }) => {
  if (!pet) return null;

  const {
    _id,
    name,
    type,
    breed,
    age,
    gender,
    size,
    available,
    featured,
    description,
    category,
    image,
    imageUrl,
    imagePath,
  } = pet;

  const shortDesc =
    (description && description.length > 120
      ? `${description.slice(0, 117)}...`
      : description) || '';

  return (
    <Card className="h-100 shadow-sm">
      <div className="ratio ratio-4x3">
        <SafeImage
          className="card-img-top object-fit-cover"
          src={imageUrl || imagePath || image}
          item={pet}
          entityType={type || 'pet'}
          category={category}
          alt={`${name || 'Pet'} - ${breed || type || ''}`}
          imgProps={{ referrerPolicy: 'no-referrer' }}
          showLoader
        />
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">
            {name || 'Unnamed'}
            {featured ? (
              <Badge bg="warning" text="dark" className="ms-2">
                ⭐ Featured
              </Badge>
            ) : null}
          </Card.Title>
          {available === false ? (
            <Badge bg="secondary">Adopted</Badge>
          ) : (
            <Badge bg="success">Available</Badge>
          )}
        </div>

        <Card.Subtitle className="text-muted mb-2">
          {[type, breed].filter(Boolean).join(' • ')}
        </Card.Subtitle>

        <div className="small text-muted mb-3">
          {[age, gender, size].filter(Boolean).join(' • ')}
        </div>

        {shortDesc ? <Card.Text className="flex-grow-1">{shortDesc}</Card.Text> : null}

        <div className="mt-auto d-flex gap-2">
          <Button
            as={Link}
            to={`/pets/${_id}`}
            variant="primary"
            size="sm"
            className="w-100"
          >
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

PetCard.propTypes = {
  pet: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    name: PropTypes.string,
    type: PropTypes.string,
    breed: PropTypes.string,
    age: PropTypes.string,
    gender: PropTypes.string,
    size: PropTypes.string,
    available: PropTypes.bool,
    featured: PropTypes.bool,
    description: PropTypes.string,
    category: PropTypes.string,
    image: PropTypes.string,
    imageUrl: PropTypes.string,
    imagePath: PropTypes.string,
  }),
};

export default PetCard;
