// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getCardImageProps } from '../utils/imageUtils';
import styles from './Card.module.css';

const PetCard = ({ 
  pet, 
  onVote, 
  showEditButton = false, 
  showDeleteButton = false, 
  onPetUpdated,
  priority = false
}) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!pet || !pet._id) {
    console.warn('⚠️ PetCard received invalid pet:', pet);
  }

  const handleVote = async (voteType) => {
    if (!user || voting) return;
    setVoting(true);
    try {
      const response = await api.post(`/pets/${pet._id}/vote`, { voteType });
      if (onVote) {
        onVote(pet._id, voteType, response.data);
      }
      toast.success(`You ${voteType}voted ${pet.name}! 🐾`);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.response?.data?.message || 'Failed to vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${pet.name}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/pets/${pet._id}`);
      toast.success(`${pet.name} deleted successfully.`);
      if (onPetUpdated) {
        onPetUpdated(pet._id, 'deleted');
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error(error.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number'
      ? `$${price.toFixed(2)}`
      : price || 'Contact for pricing';
  };

  const daysSincePosted = pet.createdAt
    ? Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  const imageProps = getCardImageProps(pet, 'medium');
  if (priority) {
    imageProps.loading = 'eager';
    imageProps.fetchPriority = 'high';
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setImageLoaded(true);
    setImageError(true);
    if (!e.target.src.includes('default-pet.png')) {
      e.target.src = '/images/pet/default-pet.png';
    }
  };

  const getVoteCount = (voteType) => {
    if (!pet.votes) return 0;
    return pet.votes[voteType] || pet.votes[`${voteType}votes`] || 0;
  };

  return (
    <Card className={`h-100 shadow-sm ${styles.card} fade-in`}>
      <div className={`${styles.cardImgContainer} position-relative`}>
        {!imageLoaded && !imageError && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}
        <Card.Img
          {...imageProps}
          className={`${styles.cardImg} transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageError && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
            <div className="text-center text-muted">
              <i className="fas fa-image fa-2x mb-2 opacity-50"></i>
              <div className="small">Image unavailable</div>
            </div>
          </div>
        )}
        <div className="position-absolute top-0 start-0 m-2">
          {daysSincePosted !== null && daysSincePosted <= 7 && (
            <Badge bg="warning" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-star me-1"></i>New
            </Badge>
          )}
          {pet.featured && (
            <Badge bg="info" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-crown me-1"></i>Featured
            </Badge>
          )}
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <Badge bg={pet.available ? 'success' : 'secondary'} style={{ fontSize: '0.7rem' }}>
            <i className={`fas ${pet.available ? 'fa-check-circle' : 'fa-home'} me-1`}></i>
            {pet.available ? 'Available' : 'Adopted'}
          </Badge>
        </div>
        <div className="position-absolute bottom-0 start-0 end-0 p-2 bg-gradient-to-top from-black/80 via-black/40 to-transparent opacity-0 transition-opacity hover-overlay">
          <div className="d-flex justify-content-center gap-2">
            {pet._id ? (
              <Button as={Link} to={`/pets/${pet._id}`} variant="light" size="sm" className="flex-fill">
                <i className="fas fa-eye me-1"></i>View
              </Button>
            ) : (
              <Button variant="light" size="sm" className="flex-fill" disabled>
                <i className="fas fa-eye-slash me-1"></i>No Link
              </Button>
            )}
            {pet.available && pet._id && (
              <Button
                as={Link}
                to={`/contact?pet=${pet.name}&id=${pet._id}`}
                variant="primary"
                size="sm"
                className="flex-fill"
              >
                <i className="fas fa-envelope me-1"></i>Adopt
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card.Body className={`d-flex flex-column ${styles.cardBody}`}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`text-primary mb-0 ${styles.cardTitle}`}>
            {pet.name}
            {pet.gender && (
              <i
                className={`fas ${
                  pet.gender.toLowerCase() === 'male'
                    ? 'fa-mars text-info'
                    : pet.gender.toLowerCase() === 'female'
                    ? 'fa-venus text-danger'
                    : 'fa-question-circle text-muted'
                } ms-2`}
                title={`Gender: ${pet.gender}`}
              ></i>
            )}
          </Card.Title>
        </div>

        <div className="small flex-grow-1 mb-3">
          <div className="mb-2">
            <div className="mb-1">
              <strong>Breed:</strong>
              <span className="text-muted ms-1">{pet.breed || 'Mixed'}</span>
            </div>
            <div className="mb-1">
              <strong>Age:</strong>
              <span className="text-muted ms-1">{pet.age || 'Unknown'}</span>
            </div>
            {pet.size && (
              <div className="mb-1">
                <strong>Size:</strong>
                <span className="text-capitalize text-muted ms-1">{pet.size}</span>
              </div>
            )}
          </div>
          {pet.description && (
            <div className={`text-muted ${styles.cardText}`}>
              {pet.description.length > 80
                ? `${pet.description.substring(0, 80)}...`
                : pet.description}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <span className="text-success fw-bold me-2">
              {formatPrice(pet.price || pet.adoptionFee)}
            </span>
            {(getVoteCount('up') > 0 || getVoteCount('down') > 0) && (
              <small className="text-muted">
                <i className="fas fa-heart me-1 text-danger"></i>
                {getVoteCount('up')}
                {getVoteCount('down') > 0 && (
                  <>
                    <i className="fas fa-heart-broken ms-2 me-1 text-muted"></i>
                    {getVoteCount('down')}
                  </>
                )}
              </small>
            )}
          </div>
          {daysSincePosted !== null && (
            <small className="text-muted">
              {daysSincePosted === 0
                ? 'Today'
                : daysSincePosted === 1
                ? 'Yesterday'
                : `${daysSincePosted} days ago`}
            </small>
          )}
        </div>

        <div className="d-flex gap-2 mb-2">
          {user && pet.available && (
            <>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleVote('up')}
                disabled={voting}
                className="flex-fill"
              >
                {voting ? <Spinner animation="border" size="sm" /> : <><i className="fas fa-thumbs-up me-1"></i>{getVoteCount('up')}</>}
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleVote('down')}
                disabled={voting}
                className="flex-fill"
              >
                {voting ? <Spinner animation="border" size="sm" /> : <><i className="fas fa-thumbs-down me-1"></i>{getVoteCount('down')}</>}
              </Button>
            </>
          )}
          {pet._id ? (
            <Button
              as={Link}
              to={`/pets/${pet._id}`}
              variant="primary"
              size="sm"
              className={user && pet.available ? "flex-fill" : "w-100"}
            >
              <i className="fas fa-info-circle me-1"></i>Details
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-100" disabled>
              <i className="fas fa-info-circle me-1"></i>No ID
            </Button>
          )}
        </div>

        {(showEditButton || showDeleteButton) && (
          <div className="mt-2 pt-2 border-top">
            <div className="d-flex gap-2">
              {showEditButton && pet._id && (
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
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-1"></i>Delete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PetCard;
