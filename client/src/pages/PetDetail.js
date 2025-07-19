// client/src/pages/PetDetail.js - Pet detail page using SafeImage
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card, ProgressBar } from 'react-bootstrap';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  // Fetch pet data
  useEffect(() => {
    const fetchPet = async () => {
      if (!id) {
        setError('No pet ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🐾 Fetching pet details for ID: ${id}`);
        const response = await petAPI.getPetById(id);
        
        if (response?.data?.success && response.data.data) {
          setPet(response.data.data);
          console.log('✅ Pet loaded successfully:', response.data.data.name);
        } else if (response?.data && response.data._id) {
          // Handle direct pet object response
          setPet(response.data);
          console.log('✅ Pet loaded successfully:', response.data.name);
        } else {
          throw new Error('Pet not found');
        }
        
      } catch (err) {
        console.error('❌ Error fetching pet:', err);
        
        if (err.response?.status === 404) {
          setError('Pet not found');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Unable to load pet details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // Handle pet rating
  const handleRating = async (newRating) => {
    if (hasRated) return;
    
    try {
      await petAPI.ratePet(pet._id, newRating);
      setRating(newRating);
      setHasRated(true);
      
      // Update pet rating display
      setPet(prev => ({
        ...prev,
        rating: {
          average: ((prev.rating?.average || 0) * (prev.rating?.count || 0) + newRating) / ((prev.rating?.count || 0) + 1),
          count: (prev.rating?.count || 0) + 1
        }
      }));
    } catch (err) {
      console.error('❌ Error rating pet:', err);
    }
  };

  // Utility functions
  const formatAge = (age) => {
    if (!age) return 'Unknown';
    return age.charAt(0).toUpperCase() + age.slice(1);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const getPersonalityScore = (trait) => {
    // Mock personality scores - in real app this would come from the database
    const scores = {
      'friendly': 90,
      'energetic': 75,
      'calm': 80,
      'playful': 85,
      'loyal': 95,
      'independent': 60,
      'social': 70,
      'protective': 85,
      'gentle': 90,
      'intelligent': 80
    };
    return scores[trait?.toLowerCase()] || 50;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading pet details...</h4>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Unable to Load Pet
          </Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/browse')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Browse
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Pet not found
  if (!pet) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Pet Not Found</Alert.Heading>
          <p>The pet you're looking for doesn't exist or may have been adopted.</p>
          <Button variant="primary" onClick={() => navigate('/browse')}>
            <i className="fas fa-arrow-left me-2"></i>
            Browse All Pets
          </Button>
        </Alert>
      </Container>
    );
  }

  // Main pet display
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/')}>
              Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/browse')}>
              Browse Pets
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {pet.name}
          </li>
        </ol>
      </nav>

      {/* Main Pet Section */}
      <Row className="mb-4">
        {/* Pet Image */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="text-center">
              <SafeImage
                item={pet}
                category={pet.type || 'pet'}
                size="large"
                className="img-fluid rounded"
                style={{ maxWidth: '100%', height: 'auto' }}
                showLoader={true}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Pet Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Pet Name and Status */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h1 className="mb-0">{pet.name}</h1>
                <div>
                  {pet.adopted ? (
                    <Badge bg="success" className="fs-6">
                      <i className="fas fa-heart me-1"></i>
                      Adopted
                    </Badge>
                  ) : pet.featured ? (
                    <Badge bg="warning" className="fs-6">
                      <i className="fas fa-star me-1"></i>
                      Featured
                    </Badge>
                  ) : (
                    <Badge bg="primary" className="fs-6">
                      <i className="fas fa-home me-1"></i>
                      Available
                    </Badge>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <Row className="mb-3">
                <Col md={6}>
                  <div className="mb-2">
                    <strong>Type:</strong> 
                    <span className="ms-2">
                      <i className="fas fa-paw text-primary me-1"></i>
                      {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Age:</strong> 
                    <span className="ms-2">
                      <i className="fas fa-birthday-cake text-primary me-1"></i>
                      {formatAge(pet.age)}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  {pet.gender && (
                    <div className="mb-2">
                      <strong>Gender:</strong> 
                      <span className="ms-2">
                        <i className={`fas ${pet.gender === 'male' ? 'fa-mars' : 'fa-venus'} text-primary me-1`}></i>
                        {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                      </span>
                    </div>
                  )}
                  {pet.size && (
                    <div className="mb-2">
                      <strong>Size:</strong> 
                      <span className="ms-2">
                        <i className="fas fa-ruler text-primary me-1"></i>
                        {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}
                      </span>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Description */}
              {pet.description && (
                <div className="mb-4">
                  <h5>About {pet.name}</h5>
                  <p className="text-muted">{pet.description}</p>
                </div>
              )}

              {/* Rating System */}
              <div className="mb-4">
                <h6>Rate {pet.name}</h6>
                <div className="d-flex align-items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="link"
                      className="p-1 text-warning"
                      onClick={() => handleRating(star)}
                      disabled={hasRated}
                      style={{ fontSize: '1.5rem' }}
                    >
                      <i className={`fas fa-heart ${(rating >= star || (pet.rating?.average || 0) >= star) ? '' : 'opacity-25'}`}></i>
                    </Button>
                  ))}
                  <span className="ms-2 text-muted">
                    ({pet.rating?.count || 0} rating{(pet.rating?.count || 0) !== 1 ? 's' : ''})
                  </span>
                </div>
                {hasRated && (
                  <small className="text-success">
                    <i className="fas fa-check me-1"></i>
                    Thank you for rating {pet.name}!
                  </small>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {!pet.adopted ? (
                  <>
                    <Button variant="primary" size="lg">
                      <i className="fas fa-heart me-2"></i>
                      Adopt {pet.name}
                    </Button>
                    <Button variant="outline-secondary">
                      <i className="fas fa-envelope me-2"></i>
                      Contact About {pet.name}
                    </Button>
                  </>
                ) : (
                  <Alert variant="info" className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    {pet.name} has found their forever home!
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Personality Traits */}
      {pet.traits && pet.traits.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <h4 className="mb-3">
              <i className="fas fa-heart text-danger me-2"></i>
              Personality Traits
            </h4>
            <Row>
              {pet.traits.map((trait, index) => (
                <Col md={6} className="mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">{trait.charAt(0).toUpperCase() + trait.slice(1)}</span>
                    <span className="text-muted">{getPersonalityScore(trait)}%</span>
                  </div>
                  <ProgressBar 
                    now={getPersonalityScore(trait)} 
                    variant={getPersonalityScore(trait) > 75 ? 'success' : getPersonalityScore(trait) > 50 ? 'warning' : 'info'}
                  />
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Additional Details */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-info-circle text-primary me-2"></i>
            Additional Information
          </h4>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Pet ID:</strong> {pet._id}
                </li>
                <li className="mb-2">
                  <strong>Added:</strong> {formatDate(pet.createdAt)}
                </li>
                {pet.breed && (
                  <li className="mb-2">
                    <strong>Breed:</strong> {pet.breed}
                  </li>
                )}
                {pet.color && (
                  <li className="mb-2">
                    <strong>Color:</strong> {pet.color}
                  </li>
                )}
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Views:</strong> {pet.views || 0}
                </li>
                <li className="mb-2">
                  <strong>Rating:</strong> {pet.rating?.average ? `${pet.rating.average.toFixed(1)}/5` : 'Not rated'}
                </li>
                {pet.weight && (
                  <li className="mb-2">
                    <strong>Weight:</strong> {pet.weight}
                  </li>
                )}
                {pet.location && (
                  <li className="mb-2">
                    <strong>Location:</strong> {pet.location}
                  </li>
                )}
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Similar Pets */}
      <Card className="shadow-sm">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-search text-primary me-2"></i>
            Find Similar Pets
          </h4>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate(`/browse?type=${pet.type}`)}
            >
              More {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}s
            </Button>
            {pet.age && (
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(`/browse?age=${pet.age}`)}
              >
                Other {formatAge(pet.age)} Pets
              </Button>
            )}
            {pet.size && (
              <Button 
                variant="outline-info" 
                onClick={() => navigate(`/browse?size=${pet.size}`)}
              >
                {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)} Pets
              </Button>
            )}
            <Button 
              variant="outline-success" 
              onClick={() => navigate('/browse?featured=true')}
            >
              Featured Pets
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PetDetail;