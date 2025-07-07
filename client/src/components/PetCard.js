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
  priority = false // New prop for critical images that should load first
}) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Enhanced voting handler with optimistic updates
  const handleVote = async (voteType) => {
    if (!user || voting) return;
    
    setVoting(true);
    try {
      const response = await api.post(`/pets/${pet._id}/vote`, { voteType });
      
      if (onVote) {
        onVote(pet._id, voteType, response.data);
      }
      
      toast.success(`You ${voteType}voted ${pet.name}! 🐾`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error voting:', error);
      const errorMessage = error.response?.data?.message || 'Failed to vote. Please try again.';
      toast.error(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  // Enhanced delete handler with confirmation
  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete ${pet.name}?\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;
    
    setDeleting(true);
    try {
      await api.delete(`/pets/${pet._id}`);
      toast.success(`${pet.name} has been deleted successfully! 🗑️`, {
        position: "top-right",
        autoClose: 3000,
      });
      
      if (onPetUpdated) {
        onPetUpdated(pet._id, 'deleted');
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete pet. Please try again.';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Enhanced price formatting
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
    return price || 'Contact for pricing';
  };

  // Calculate days since posted for "New" badge
  const daysSincePosted = pet.createdAt 
    ? Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  // Get optimized image props using our new utility
  const imageProps = getCardImageProps(pet, 'medium');
  
  // Override loading behavior for critical images
  if (priority) {
    imageProps.loading = 'eager';
    imageProps.fetchPriority = 'high';
  }

  // Enhanced image load handler
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    
    // Optional: Log successful image load for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🖼️ Pet image loaded: ${pet.name}`, {
        naturalWidth: e.target.naturalWidth,
        naturalHeight: e.target.naturalHeight,
        src: e.target.src
      });
    }
  };

  // Enhanced image error handler
  const handleImageError = (e) => {
    setImageLoaded(true);
    setImageError(true);
    
    console.warn(`🚨 Failed to load image for ${pet.name}:`, e.target.src);
    
    // Set fallback image - this is handled by getCardImageProps but we add extra safety
    if (!e.target.src.includes('default-pet.png')) {
      e.target.src = '/images/pet/default-pet.png';
    }
  };

  // Vote count display helper
  const getVoteCount = (voteType) => {
    if (!pet.votes) return 0;
    return pet.votes[voteType] || pet.votes[`${voteType}votes`] || 0;
  };

  return (
    <Card className={`h-100 shadow-sm ${styles.card} fade-in`}>
      {/* Enhanced Image Container with Loading States */}
      <div className={`${styles.cardImgContainer} position-relative`}>
        {/* Loading Spinner */}
        {!imageLoaded && !imageError && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}

        {/* Optimized Image */}
        <Card.Img
          {...imageProps}
          className={`${styles.cardImg} transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            transition: 'opacity 0.3s ease-in-out',
          }}
        />

        {/* Image Error Fallback */}
        {imageError && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
            <div className="text-center text-muted">
              <i className="fas fa-image fa-2x mb-2 opacity-50"></i>
              <div className="small">Image unavailable</div>
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="position-absolute top-0 start-0 m-2">
          {/* New Badge */}
          {daysSincePosted !== null && daysSincePosted <= 7 && (
            <Badge bg="warning" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-star me-1"></i>New
            </Badge>
          )}
          
          {/* Featured Badge */}
          {pet.featured && (
            <Badge bg="info" className="me-1" style={{ fontSize: '0.7rem' }}>
              <i className="fas fa-crown me-1"></i>Featured
            </Badge>
          )}
        </div>

        {/* Availability Badge */}
        <div className="position-absolute top-0 end-0 m-2">
          <Badge bg={pet.available ? 'success' : 'secondary'} style={{ fontSize: '0.7rem' }}>
            <i className={`fas ${pet.available ? 'fa-check-circle' : 'fa-home'} me-1`}></i>
            {pet.available ? 'Available' : 'Adopted'}
          </Badge>
        </div>

        {/* Hover Overlay for Quick Actions */}
        <div className="position-absolute bottom-0 start-0 end-0 p-2 bg-gradient-to-top from-black/80 via-black/40 to-transparent opacity-0 transition-opacity hover-overlay">
          <div className="d-flex justify-content-center gap-2">
            <Button 
              as={Link} 
              to={`/pets/${pet._id}`} 
              variant="light" 
              size="sm"
              className="flex-fill"
            >
              <i className="fas fa-eye me-1"></i>View
            </Button>
            {pet.available && (
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

      {/* Enhanced Card Body */}
      <Card.Body className={`d-flex flex-column ${styles.cardBody}`}>
        {/* Header with Name and Gender Icon */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`text-primary mb-0 ${styles.cardTitle}`}>
            {pet.name}
            {/* Gender Icon - Fixed logic for proper identification */}
            {pet.gender && (
              <i 
                className={`fas ${
                  pet.gender === 'male' || pet.gender?.toLowerCase() === 'male'
                    ? 'fa-mars text-info'           // ♂ Blue for male
                    : pet.gender === 'female' || pet.gender?.toLowerCase() === 'female'
                    ? 'fa-venus text-danger'        // ♀ Pink for female
                    : 'fa-question-circle text-muted' // ? Gray for unknown
                } ms-2`}
                title={`Gender: ${pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}`}
                aria-label={`Gender: ${pet.gender}`}
              ></i>
            )}
            {/* Debug info - remove after testing */}
            {process.env.NODE_ENV === 'development' && pet.gender && (
              <small className="text-muted ms-1" style={{ fontSize: '0.6rem' }}>
                ({pet.gender})
              </small>
            )}
          </Card.Title>
        </div>

        {/* Pet Details */}
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
            {pet.color && (
              <div className="mb-1">
                <strong>Color:</strong> 
                <span className="text-muted ms-1">{pet.color}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          {pet.description && (
            <div className={`text-muted ${styles.cardText}`}>
              {pet.description.length > 80
                ? `${pet.description.substring(0, 80)}...`
                : pet.description}
            </div>
          )}
        </div>

        {/* Price and Vote Section */}
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

          {/* Posted Date */}
          {daysSincePosted !== null && (
            <small className="text-muted">
              {daysSincePosted === 0 
                ? 'Today' 
                : daysSincePosted === 1 
                ? 'Yesterday'
                : `${daysSincePosted} days ago`
              }
            </small>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 mb-2">
          {/* Voting Buttons (if user is logged in) */}
          {user && pet.available && (
            <>
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={() => handleVote('up')} 
                disabled={voting}
                className="flex-fill"
                title="I love this pet!"
              >
                {voting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fas fa-thumbs-up me-1"></i>
                    {getVoteCount('up')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={() => handleVote('down')} 
                disabled={voting}
                className="flex-fill"
                title="Not my type"
              >
                {voting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fas fa-thumbs-down me-1"></i>
                    {getVoteCount('down')}
                  </>
                )}
              </Button>
            </>
          )}
          
          {/* Main Action Button */}
          <Button 
            as={Link} 
            to={`/pets/${pet._id}`} 
            variant="primary" 
            size="sm"
            className={user && pet.available ? "flex-fill" : "w-100"}
          >
            <i className="fas fa-info-circle me-1"></i>
            Details
          </Button>
        </div>

        {/* Admin Controls */}
        {(showEditButton || showDeleteButton) && (
          <div className="mt-2 pt-2 border-top">
            <div className="d-flex gap-2">
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