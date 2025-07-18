import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Card, Button, Alert, Badge } from 'react-bootstrap';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';
import HeartRating from '../components/HeartRating';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        // ✅ FIXED: Validate for your custom pet ID format (p001, p003, etc.)
        if (!id) {
          setError({
            type: 'missing_id',
            message: 'No pet ID provided',
            suggestion: 'Please select a pet from our browse page'
          });
          setLoading(false);
          return;
        }

        // ✅ UPDATED: Validate both MongoDB ObjectIds AND your custom pet IDs
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const isCustomPetId = /^p\d{3}$/.test(id); // Matches p001, p003, p025, etc.
        
        if (!isValidObjectId && !isCustomPetId) {
          setError({
            type: 'invalid_id',
            message: `Invalid pet ID format: "${id}"`,
            suggestion: 'Pet IDs should be either MongoDB ObjectIds or custom format like p001, p003',
            examples: 'Valid examples: p001, p003, p025'
          });
          setLoading(false);
          return;
        }

        console.log('🐕 Fetching pet details for ID:', id, `(${isCustomPetId ? 'custom' : 'ObjectId'})`);
        const res = await petAPI.getPetById(id);
        
        if (res?.data) {
          setPet(res.data);
          console.log('✅ Pet loaded successfully:', res.data.name);
        } else {
          setError({
            type: 'not_found',
            message: 'Pet not found',
            suggestion: 'This pet may have been adopted or is no longer available'
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('❌ Fetch Pet Error:', err);
        
        // ✅ ENHANCED: Better error handling based on status codes
        let errorInfo = { type: 'unknown', message: 'Unable to fetch pet details' };
        
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          
          switch (status) {
            case 400:
              errorInfo = {
                type: 'bad_request',
                message: data?.message || 'Invalid pet ID format',
                suggestion: 'Make sure you\'re using a valid pet ID (like p001, p003, p025)',
                technical: data?.error || 'Bad request',
                examples: data?.examples || ['p001', 'p003', 'p025']
              };
              break;
            case 404:
              errorInfo = {
                type: 'not_found', 
                message: 'Pet not found',
                suggestion: 'This pet may have been adopted or removed from our system'
              };
              break;
            case 500:
              errorInfo = {
                type: 'server_error',
                message: 'Server error occurred',
                suggestion: 'Please try again in a few moments'
              };
              break;
            default:
              errorInfo = {
                type: 'network_error',
                message: `Network error (${status})`,
                suggestion: 'Please check your internet connection and try again'
              };
          }
        } else if (err.request) {
          errorInfo = {
            type: 'network_error',
            message: 'Unable to connect to server',
            suggestion: 'Please check your internet connection'
          };
        }
        
        setError(errorInfo);
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handleHeartRating = async (value) => {
    try {
      await petAPI.ratePet(pet._id, { rating: value });
      setPet((prev) => ({ ...prev, rating: value }));
      console.log('✅ Pet rated successfully:', value);
    } catch (err) {
      console.error('❌ Rating failed:', err);
      // Could add toast notification here
    }
  };

  const handleBackToPets = () => {
    navigate('/pets');
  };

  const handleAdoptionInterest = () => {
    // Navigate to adoption form or contact page
    navigate(`/adopt/${pet._id}`);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p>Loading pet details...</p>
      </div>
    );
  }

  // ✅ Error state with helpful actions
  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error.type === 'invalid_id' && 'Invalid Pet ID'}
            {error.type === 'missing_id' && 'Missing Pet ID'}
            {error.type === 'not_found' && 'Pet Not Found'}
            {error.type === 'server_error' && 'Server Error'}
            {error.type === 'network_error' && 'Connection Error'}
            {error.type === 'bad_request' && 'Invalid Request'}
            {error.type === 'unknown' && 'Error Loading Pet'}
          </Alert.Heading>
          <p className="mb-2">{error.message}</p>
          {error.suggestion && (
            <p className="mb-3 text-muted">
              <i className="fas fa-lightbulb me-1"></i>
              {error.suggestion}
            </p>
          )}
          {error.examples && (
            <p className="mb-3 small">
              <strong>Valid ID examples:</strong> {error.examples.join(', ')}
            </p>
          )}
          {error.technical && (
            <details className="mb-3">
              <summary className="text-muted small">Technical Details</summary>
              <p className="small text-muted mt-2">{error.technical}</p>
            </details>
          )}
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handleBackToPets}>
              <i className="fas fa-arrow-left me-2"></i>
              Browse All Pets
            </Button>
            <Button variant="outline-secondary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // ✅ Main pet details view
  return (
    <div className="container mt-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={handleBackToPets}>
              <i className="fas fa-paw me-1"></i>
              All Pets
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {pet.name}
          </li>
        </ol>
      </nav>

      {/* Pet Details Card */}
      <Card className="shadow">
        <div className="row g-0">
          {/* Pet Image */}
          <div className="col-md-5">
            <SafeImage 
              item={pet} 
              category={pet?.type} 
              alt={pet?.name} 
              fitMode="cover" 
              className="h-100"
            />
          </div>
          
          {/* Pet Information */}
          <div className="col-md-7 p-4">
            {/* Header with name and status */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h2 className="mb-0">{pet.name}</h2>
              <Badge bg={pet.status === 'available' ? 'success' : 'secondary'} className="fs-6">
                <i className={`fas ${pet.status === 'available' ? 'fa-heart' : 'fa-check'} me-1`}></i>
                {pet.status === 'available' ? 'Available for Adoption' : pet.status}
              </Badge>
            </div>
            
            {/* Basic Info Grid */}
            <div className="row mb-3">
              <div className="col-6">
                <p className="mb-1">
                  <strong><i className="fas fa-tag me-1"></i>Type:</strong> 
                  <span className="text-capitalize ms-1">{pet.type}</span>
                </p>
                <p className="mb-1">
                  <strong><i className="fas fa-dna me-1"></i>Breed:</strong> 
                  <span className="ms-1">{pet.breed}</span>
                </p>
              </div>
              <div className="col-6">
                <p className="mb-1">
                  <strong><i className="fas fa-birthday-cake me-1"></i>Age:</strong> 
                  <span className="ms-1">{pet.age}</span>
                </p>
                {pet.gender && (
                  <p className="mb-1">
                    <strong><i className="fas fa-venus-mars me-1"></i>Gender:</strong> 
                    <span className="text-capitalize ms-1">{pet.gender}</span>
                  </p>
                )}
                {pet.size && (
                  <p className="mb-1">
                    <strong><i className="fas fa-ruler me-1"></i>Size:</strong> 
                    <span className="text-capitalize ms-1">{pet.size}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {pet.description && (
              <div className="mb-4">
                <h5><i className="fas fa-info-circle me-2"></i>About {pet.name}</h5>
                <p className="text-muted">{pet.description}</p>
              </div>
            )}

            {/* Heart Rating */}
            <div className="mb-4">
              <h6><i className="fas fa-star me-2"></i>Rate This Pet:</h6>
              <HeartRating
                initial={pet?.rating || 0}
                onRate={handleHeartRating}
                max={5}
              />
              {pet.ratingCount > 0 && (
                <small className="text-muted ms-2">
                  ({pet.ratingCount} rating{pet.ratingCount !== 1 ? 's' : ''})
                </small>
              )}
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleAdoptionInterest}
                disabled={pet.status !== 'available'}
              >
                <i className="fas fa-heart me-2"></i>
                {pet.status === 'available' ? 'Start Adoption Process' : 'Not Available'}
              </Button>
              <Button variant="outline-secondary" size="lg">
                <i className="fas fa-bookmark me-2"></i>
                Save for Later
              </Button>
              <Button variant="outline-info" size="lg" onClick={() => navigate('/contact')}>
                <i className="fas fa-question-circle me-2"></i>
                Ask Questions
              </Button>
            </div>

            {/* Pet ID for debugging (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-2 bg-light rounded small text-muted">
                <strong>Debug Info:</strong> Pet ID: {pet._id} | Type: {typeof pet._id}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Related/Similar Pets Section */}
      <div className="mt-4">
        <h4>Other {pet.type}s looking for homes</h4>
        <p className="text-muted">
          <Button variant="outline-primary" onClick={() => navigate(`/pets?type=${pet.type}`)}>
            <i className="fas fa-search me-1"></i>
            View All {pet.type}s
          </Button>
        </p>
      </div>
    </div>
  );
};

export default PetDetail;