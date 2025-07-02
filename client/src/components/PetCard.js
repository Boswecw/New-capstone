// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getGoogleStorageUrl, generateSrcSet } from '../utils/imageUtils';

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
    setImageLoading(false);
    setImageError(true);
    event.currentTarget.src = '/images/pet/default-pet.png';
  };

  const imagePath = pet.image || 'images/pet/default-pet.png';
  const imageUrl = getGoogleStorageUrl(imagePath, 'medium');
  const imageSrcSet = generateSrcSet(imagePath);

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
          src={imageError ? '/images/pet/default-pet.png' : imageUrl}
          srcSet={!imageError ? imageSrcSet : undefined}
          sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
          alt={pet.name}
          className={`card-img-top ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            height: '200px',
            objectFit: 'contain',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            padding: '0.5rem'
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
              {pet.description.length > 80 ? `${pet.description.substring(0, 80)}...` : pet.description}
            </div>
          )}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="price fw-bold text-success" style={{ fontSize: '1.2rem' }}>{formatPrice(pet.price)}</span>
          {pet.averageRating > 0 && (
            <div className="rating-stars">
              <i className="fas fa-star text-warning"></i>
              <span className="ms-1 fw-bold">{pet.averageRating}</span>
              <small className="text-muted ms-1">({pet.ratings?.length || 0})</small>
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap gap-1 mb-3">
          {pet.gender && <Badge bg="secondary" className="small"><i className={`fas ${pet.gender === 'male' ? 'fa-mars' : 'fa-venus'} me-1`}></i>{pet.gender}</Badge>}
          {pet.size && <Badge bg="info" className="small"><i className="fas fa-ruler me-1"></i>{pet.size}</Badge>}
          {pet.vaccination && <Badge bg="success" className="small"><i className="fas fa-shield-alt me-1"></i>Vaccinated</Badge>}
          {pet.spayedNeutered && <Badge bg="primary" className="small"><i className="fas fa-check me-1"></i>Spayed/Neutered</Badge>}
        </div>

        <div className="mt-auto">
          <div className="d-flex gap-2 mb-2">
            <Link to={`/pet/${pet._id}`} className="btn btn-primary btn-sm flex-grow-1">
              <i className="fas fa-eye me-1"></i>View Details
            </Link>
            {showEditButton && user && (user.id === pet.createdBy?._id || user.role === 'admin') && (
              <Link to={`/edit-pet/${pet._id}`} className="btn btn-outline-secondary btn-sm" title="Edit Pet">
                <i className="fas fa-edit"></i>
              </Link>
            )}
            {showDeleteButton && user && (user.id === pet.createdBy?._id || user.role === 'admin') && (
              <Button variant="outline-danger" size="sm" onClick={handleDelete} disabled={deleting} title="Delete Pet">
                {deleting ? <Spinner animation="border" size="sm" /> : <i className="fas fa-trash"></i>}
              </Button>
            )}
          </div>

          {user && pet.available && (
            <div className="d-flex gap-1">
              <Button variant="outline-success" size="sm" onClick={() => handleVote('up')} disabled={voting} className="flex-grow-1" title="Upvote this pet">
                <i className={`fas fa-thumbs-up ${voting ? 'fa-spin' : ''}`}></i>
                <span className="ms-1">{pet.votes?.up || 0}</span>
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => handleVote('down')} disabled={voting} className="flex-grow-1" title="Downvote this pet">
                <i className={`fas fa-thumbs-down ${voting ? 'fa-spin' : ''}`}></i>
                <span className="ms-1">{pet.votes?.down || 0}</span>
              </Button>
            </div>
          )}

          {user && pet.available && user.id !== pet.createdBy?._id && (
            <Link to={`/contact?pet=${pet._id}`} className="btn btn-success btn-sm w-100 mt-2">
              <i className="fas fa-heart me-1"></i>Interested in {pet.name}
            </Link>
          )}

          {!user && (
            <Link to="/login" className="btn btn-outline-primary btn-sm w-100">
              <i className="fas fa-sign-in-alt me-1"></i>Login to Vote & Contact
            </Link>
          )}
        </div>

        {pet.viewCount > 0 && (
          <div className="text-muted text-center mt-2" style={{ fontSize: '0.75rem' }}>
            <i className="fas fa-eye me-1"></i>{pet.viewCount} view{pet.viewCount !== 1 ? 's' : ''}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PetCard;
