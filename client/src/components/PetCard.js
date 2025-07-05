// Fixed PetCard.js - Field mismatch resolved
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getPublicImageUrl } from '../utils/bucketUtils';

const PetCard = ({ pet, onVote, showEditButton = false, showDeleteButton = false, onPetUpdated }) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleVote = async (voteType) => {
    if (!user || voting) return;
    setVoting(true);
    try {
      await api.post(`/pets/${pet._id}/vote`, { voteType });
      if (onVote) onVote(pet._id, voteType);
      toast.success(`You ${voteType}voted ${pet.name}!`);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${pet.name}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/pets/${pet._id}`);
      toast.success(`${pet.name} has been deleted successfully!`);
      if (onPetUpdated) onPetUpdated();
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Failed to delete pet. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price) => typeof price === 'number' ? `$${price.toLocaleString()}` : price;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageErrorEvent = (event) => {
    console.error('Image failed to load:', event.target.src);
    setImageLoading(false);
    setImageError(true);
    event.currentTarget.src = '/images/pet/default-pet.png';
  };

  // ✅ FIXED: Check multiple possible image fields
  const getImageUrl = () => {
    // Check for imageUrl first (from GCS), then image, then imageName
    if (pet.imageUrl) {
      return pet.imageUrl;
    }
    if (pet.image) {
      // If it's already a full URL, use it
      if (pet.image.startsWith('http')) {
        return pet.image;
      }
      // If it's a GCS path, convert to public URL
      return getPublicImageUrl(pet.image);
    }
    if (pet.imageName) {
      return getPublicImageUrl(pet.imageName);
    }
    return '/images/pet/default-pet.png';
  };

  const imageUrl = getImageUrl();
  const daysSincePosted = Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24));

  return (
    <Card className="h-100 pet-card shadow-sm fade-in">
      <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
        {imageLoading && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}

        <Card.Img
          variant="top"
          src={imageUrl}
          alt={pet.name}
          className={`card-img-top ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            height: '200px',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}
          onLoad={handleImageLoad}
          onError={handleImageErrorEvent}
          loading="lazy"
        />

        {daysSincePosted <= 7 && (
          <Badge bg="warning" className="position-absolute top-0 start-0 m-2" style={{ fontSize: '0.7rem' }}>
            <i className="fas fa-star me-1"></i>New
          </Badge>
        )}

        {pet.featured && (
          <Badge bg="info" className="position-absolute top-0 end-0 m-2" style={{ fontSize: '0.7rem' }}>
            <i className="fas fa-crown me-1"></i>Featured
          </Badge>
        )}

        {imageError && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
            <div className="text-center text-muted">
              <i className="fas fa-image fa-2x mb-2"></i>
              <div>Image not available</div>
            </div>
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="text-primary mb-0" style={{ fontSize: '1.1rem' }}>{pet.name}</Card.Title>
          <Badge bg={pet.available ? 'success' : 'secondary'} className="ms-2">
            {pet.available ? 'Available' : 'Adopted'}
          </Badge>
        </div>

        <Card.Text className="small flex-grow-1 mb-3">
          <div className="mb-2">
            <strong>Breed:</strong> {pet.breed}<br />
            <strong>Age:</strong> {pet.age}<br />
            {pet.size && <><strong>Size:</strong> <span className="text-capitalize">{pet.size}</span><br /></>}
            {pet.gender && <><strong>Gender:</strong> <span className="text-capitalize">{pet.gender}</span><br /></>}
          </div>
          {pet.description && (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              {pet.description.length > 80 ? 
                `${pet.description.substring(0, 80)}...` : 
                pet.description
              }
            </div>
          )}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="text-success fw-bold me-2">
              {formatPrice(pet.price)}
            </span>
            {pet.votes && (
              <small className="text-muted">
                <i className="fas fa-heart me-1"></i>
                {pet.votes.upvotes || 0}
              </small>
            )}
          </div>
          
          <div className="d-flex gap-2">
            {user && (
              <>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleVote('up')}
                  disabled={voting}
                >
                  <i className="fas fa-thumbs-up"></i>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleVote('down')}
                  disabled={voting}
                >
                  <i className="fas fa-thumbs-down"></i>
                </Button>
              </>
            )}
            
            <Button
              as={Link}
              to={`/pets/${pet._id}`}
              variant="primary"
              size="sm"
            >
              Details
            </Button>
          </div>
        </div>

        {/* Admin Controls */}
        {(showEditButton || showDeleteButton) && (
          <div className="mt-3 d-flex gap-2">
            {showEditButton && (
              <Button
                as={Link}
                to={`/admin/pets/${pet._id}/edit`}
                variant="outline-primary"
                size="sm"
                className="flex-fill"
              >
                <i className="fas fa-edit me-1"></i>Edit
              </Button>
            )}
            {showDeleteButton && (
              <Button
                variant="outline-danger"
                size="sm"
                className="flex-fill"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fas fa-trash me-1"></i>Delete
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PetCard;