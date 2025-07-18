import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
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
        if (!id) {
          setError({
            type: 'missing_id',
            message: 'No pet ID provided',
            suggestion: 'Please select a pet from our browse page'
          });
          setLoading(false);
          return;
        }

        // Validate both MongoDB ObjectIds AND custom pet IDs
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const isCustomPetId = /^p\d{3}$/.test(id);
        
        if (!isValidObjectId && !isCustomPetId) {
          setError({
            type: 'invalid_id',
            message: `Invalid pet ID format: "${id}"`,
            suggestion: 'Pet IDs should be either MongoDB ObjectIds or custom format like p001, p003',
            examples: 'Valid examples: p001, p003, p025, p054'
          });
          setLoading(false);
          return;
        }

        console.log('🐕 Fetching pet details for ID:', id);
        const res = await petAPI.getPetById(id);
        
        if (res?.data?.success && res.data.data) {
          const petData = res.data.data;
          console.log('✅ Pet data received:', petData);
          setPet(petData);
        } else if (res?.data) {
          // Handle case where API returns data directly (not wrapped in success/data)
          console.log('✅ Pet data received (direct):', res.data);
          setPet(res.data);
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
        
        let errorInfo = { type: 'unknown', message: 'Unable to fetch pet details' };
        
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          
          switch (status) {
            case 400:
              errorInfo = {
                type: 'bad_request',
                message: data?.message || 'Invalid pet ID format',
                suggestion: 'Make sure you\'re using a valid pet ID (like p001, p003, p054)',
                technical: data?.error || 'Bad request',
                examples: data?.examples || ['p001', 'p003', 'p054']
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
                suggestion: 'Please try again in a few moments',
                technical: data?.error || 'Internal server error'
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
      setPet((prev) => ({ 
        ...prev, 
        rating: value,
        ratingCount: (prev.ratingCount || 0) + 1
      }));
      console.log('✅ Pet rated successfully:', value);
    } catch (err) {
      console.error('❌ Rating failed:', err);
    }
  };

  const handleBackToPets = () => {
    navigate('/pets');
  };

  const handleAdoptionInterest = () => {
    navigate(`/adopt/${pet._id}`);
  };

  const getImageUrl = (pet) => {
    if (!pet) return null;
    
    // If pet has imageUrl already computed
    if (pet.imageUrl) return pet.imageUrl;
    
    // If pet has image path, construct URL
    if (pet.image) {
      return `https://storage.googleapis.com/furbabies-petstore/${pet.image}`;
    }
    
    // Fallback
    return null;
  };

  const formatPetType = (type) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  const formatGender = (gender) => {
    if (!gender || gender === 'unknown') return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatSize = (size) => {
    if (!size) return 'Not specified';
    return size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p>Loading pet details...</p>
      </div>
    );
  }

  // Error state
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

  // Main pet details view
  return (
    <div className="container mt-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0 text-decoration-none" onClick={handleBackToPets}>
              <i className="fas fa-paw me-1"></i>
              All Pets
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button 
              variant="link" 
              className="p-0 text-decoration-none" 
              onClick={() => navigate(`/pets?type=${pet.type}`)}
            >
              {formatPetType(pet.type)}s
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {pet.name}
          </li>
        </ol>
      </nav>

      {/* Main Pet Details Card */}
      <Card className="shadow-lg mb-4">
        <Row className="g-0">
          {/* Pet Image */}
          <Col md={6}>
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <SafeImage 
                item={pet} 
                category={pet?.type} 
                alt={pet?.name}
                fitMode="cover"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                src={getImageUrl(pet)}
              />
            </div>
          </Col>
          
          {/* Pet Information */}
          <Col md={6} className="p-4">
            {/* Header with name and status */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="mb-2">{pet.name}</h1>
                <p className="text-muted mb-0">
                  {pet.breed} • {formatPetType(pet.type)}
                </p>
              </div>
              <Badge 
                bg={pet.status === 'available' ? 'success' : pet.status === 'pending' ? 'warning' : 'secondary'} 
                className="fs-6 px-3 py-2"
              >
                <i className={`fas ${
                  pet.status === 'available' ? 'fa-heart' : 
                  pet.status === 'pending' ? 'fa-clock' : 
                  'fa-check'
                } me-1`}></i>
                {pet.status === 'available' ? 'Available for Adoption' : 
                 pet.status === 'pending' ? 'Adoption Pending' :
                 pet.status?.charAt(0).toUpperCase() + pet.status?.slice(1)}
              </Badge>
            </div>
            
            {/* Key Details Grid */}
            <Row className="mb-4">
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-birthday-cake text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">Age</small>
                    <strong>{pet.age}</strong>
                  </div>
                </div>
              </Col>
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-venus-mars text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">Gender</small>
                    <strong>{formatGender(pet.gender)}</strong>
                  </div>
                </div>
              </Col>
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-ruler text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">Size</small>
                    <strong>{formatSize(pet.size)}</strong>
                  </div>
                </div>
              </Col>
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-paw text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">ID</small>
                    <strong>{pet._id}</strong>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Featured Badge */}
            {pet.featured && (
              <div className="mb-3">
                <Badge bg="warning" text="dark" className="px-3 py-2">
                  <i className="fas fa-star me-1"></i>
                  Featured Pet
                </Badge>
              </div>
            )}

            {/* Heart Rating */}
            <div className="mb-4">
              <h6 className="mb-2">
                <i className="fas fa-star text-warning me-2"></i>
                Rate This Pet:
              </h6>
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
            <div className="d-grid gap-2 d-md-flex">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleAdoptionInterest}
                disabled={pet.status !== 'available'}
                className="flex-fill"
              >
                <i className="fas fa-heart me-2"></i>
                {pet.status === 'available' ? 'Start Adoption' : 'Not Available'}
              </Button>
              <Button variant="outline-secondary" size="lg">
                <i className="fas fa-bookmark me-2"></i>
                Save
              </Button>
              <Button variant="outline-info" size="lg" onClick={() => navigate('/contact')}>
                <i className="fas fa-question-circle me-2"></i>
                Ask Questions
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Description Section */}
      {pet.description && (
        <Card className="shadow mb-4">
          <Card.Body>
            <h4 className="mb-3">
              <i className="fas fa-info-circle text-primary me-2"></i>
              About {pet.name}
            </h4>
            <p className="lead text-muted mb-0">{pet.description}</p>
          </Card.Body>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="shadow mb-4">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-clipboard-list text-primary me-2"></i>
            Pet Details
          </h4>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Type:</strong> {formatPetType(pet.type)}
                </li>
                <li className="mb-2">
                  <strong>Breed:</strong> {pet.breed}
                </li>
                <li className="mb-2">
                  <strong>Category:</strong> {formatPetType(pet.category)}
                </li>
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Status:</strong> {pet.status?.charAt(0).toUpperCase() + pet.status?.slice(1)}
                </li>
                {pet.adoptionFee > 0 && (
                  <li className="mb-2">
                    <strong>Adoption Fee:</strong> ${pet.adoptionFee}
                  </li>
                )}
                {pet.color && (
                  <li className="mb-2">
                    <strong>Color:</strong> {pet.color}
                  </li>
                )}
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Similar Pets */}
      <Card className="shadow">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-search text-primary me-2"></i>
            Find Similar Pets
          </h4>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate(`/pets?type=${pet.type}`)}
            >
              More {formatPetType(pet.type)}s
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(`/pets?breed=${encodeURIComponent(pet.breed)}`)}
            >
              More {pet.breed}s
            </Button>
            <Button 
              variant="outline-info" 
              onClick={() => navigate(`/pets?size=${pet.size}`)}
            >
              {formatSize(pet.size)} Pets
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <Card bg="light">
            <Card.Body>
              <h6>Debug Information (Development Only)</h6>
              <pre className="small mb-0">
                {JSON.stringify(pet, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PetDetail;