// client/src/pages/PetDetail.js - FIXED Pet detail page
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
  const [isRating, setIsRating] = useState(false);

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
        
        console.log('📊 API Response:', response.data);
        
        // Handle different response formats from your backend
        let petData = null;
        
        if (response?.data?.success && response.data.data) {
          // Standard format: { success: true, data: petObject }
          petData = response.data.data;
          console.log('✅ Using standard API response format');
        } else if (response?.data && response.data._id) {
          // Direct pet object format
          petData = response.data;
          console.log('✅ Using direct pet object format');
        } else {
          console.error('❌ Unexpected API response format:', response.data);
          throw new Error('Invalid response format from server');
        }
        
        if (petData && petData._id) {
          // Normalize pet data to handle backend field variations
          const normalizedPet = {
            ...petData,
            // Ensure traits field exists (backend uses personalityTraits)
            traits: petData.traits || petData.personalityTraits || [],
            // Ensure proper image field
            image: petData.image || petData.imageUrl,
            // Ensure status fields
            adopted: petData.adopted || petData.status === 'adopted',
            available: petData.available !== false && petData.status !== 'adopted',
            // Ensure display name
            displayName: petData.displayName || petData.name || 'Unnamed Pet'
          };
          
          setPet(normalizedPet);
          console.log('✅ Pet loaded successfully:', normalizedPet.name || normalizedPet.displayName);
          console.log('📋 Pet data fields:', Object.keys(normalizedPet));
        } else {
          throw new Error('Pet data is incomplete or missing');
        }
        
      } catch (err) {
        console.error('❌ Error fetching pet:', err);
        
        if (err.response?.status === 404) {
          setError('Pet not found. This pet may have been adopted or is no longer available.');
        } else if (err.response?.status === 400) {
          setError('Invalid pet ID format. Please check the URL and try again.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else if (err.code === 'NETWORK_ERROR') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(err.message || 'Unable to load pet details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // Handle pet rating
  const handleRating = async (newRating) => {
    if (hasRated || isRating || !pet) return;
    
    try {
      setIsRating(true);
      console.log(`⭐ Rating pet ${pet.name} with ${newRating} stars`);
      
      const response = await petAPI.ratePet(pet._id, newRating);
      
      if (response?.data?.success) {
        setRating(newRating);
        setHasRated(true);
        
        // Update pet rating display
        setPet(prev => ({
          ...prev,
          rating: response.data.newRating || newRating,
          ratingCount: (prev.ratingCount || 0) + 1
        }));
        
        console.log('✅ Pet rated successfully');
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (err) {
      console.error('❌ Error rating pet:', err);
      // Don't show error to user for rating, just log it
    } finally {
      setIsRating(false);
    }
  };

  // Utility functions
  const formatAge = (age) => {
    if (!age) return 'Unknown';
    if (typeof age === 'string') {
      return age.charAt(0).toUpperCase() + age.slice(1);
    }
    return String(age);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
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
    // Mock personality scores based on trait
    const scores = {
      'friendly': 90, 'energetic': 75, 'calm': 80, 'playful': 85,
      'loyal': 95, 'independent': 60, 'social': 70, 'protective': 85,
      'gentle': 90, 'intelligent': 80, 'affectionate': 85, 'active': 70,
      'quiet': 65, 'curious': 75, 'brave': 80, 'sweet': 90
    };
    return scores[trait?.toLowerCase()] || Math.floor(Math.random() * 40) + 60;
  };

  const getPetStatusInfo = () => {
    if (!pet) return { text: 'Unknown', variant: 'secondary', icon: 'question' };
    
    if (pet.adopted || pet.status === 'adopted') {
      return { text: 'Adopted', variant: 'success', icon: 'heart' };
    } else if (pet.featured) {
      return { text: 'Featured', variant: 'warning', icon: 'star' };
    } else if (pet.available === false || pet.status === 'unavailable') {
      return { text: 'Not Available', variant: 'secondary', icon: 'pause' };
    } else {
      return { text: 'Available', variant: 'primary', icon: 'home' };
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading pet details...</h4>
          <p className="text-muted">Please wait while we fetch information about this adorable pet.</p>
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
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/browse')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Browse
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/pets')}>
              <i className="fas fa-paw me-2"></i>
              View All Pets
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
          <Alert.Heading>
            <i className="fas fa-search me-2"></i>
            Pet Not Found
          </Alert.Heading>
          <p>The pet you're looking for doesn't exist or may have been adopted.</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/browse')}>
              <i className="fas fa-search me-2"></i>
              Browse Available Pets
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/pets')}>
              <i className="fas fa-home me-2"></i>
              Go to Pets Home
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const statusInfo = getPetStatusInfo();

  // Main pet display
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/')}>
              <i className="fas fa-home me-1"></i>
              Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/pets')}>
              <i className="fas fa-paw me-1"></i>
              Pets
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/browse')}>
              <i className="fas fa-search me-1"></i>
              Browse
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {pet.displayName || pet.name}
          </li>
        </ol>
      </nav>

      {/* Main Pet Section */}
      <Row className="mb-4">
        {/* Pet Image */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="text-center p-0">
              <SafeImage
                item={pet}
                category={pet.type || 'pet'}
                size="large"
                className="img-fluid"
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                showLoader={true}
                alt={`Photo of ${pet.displayName || pet.name}`}
              />
            </Card.Body>
          </Card>

          {/* Additional Images */}
          {pet.additionalImages && pet.additionalImages.length > 0 && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-images me-2"></i>
                  More Photos
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {pet.additionalImages.slice(0, 4).map((image, index) => (
                    <Col xs={6} md={3} key={index} className="mb-2">
                      <SafeImage
                        src={image}
                        category={pet.type || 'pet'}
                        size="small"
                        className="img-fluid rounded"
                        style={{ height: '80px', objectFit: 'cover' }}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Pet Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Pet Name and Status */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="mb-1">{pet.displayName || pet.name}</h1>
                  {pet.breed && (
                    <p className="text-muted mb-0">
                      <i className="fas fa-certificate me-1"></i>
                      {pet.breed}
                    </p>
                  )}
                </div>
                <Badge bg={statusInfo.variant} className="fs-6">
                  <i className={`fas fa-${statusInfo.icon} me-1`}></i>
                  {statusInfo.text}
                </Badge>
              </div>

              {/* Basic Info Grid */}
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
                  {pet.color && (
                    <div className="mb-2">
                      <strong>Color:</strong> 
                      <span className="ms-2">
                        <i className="fas fa-palette text-primary me-1"></i>
                        {pet.color}
                      </span>
                    </div>
                  )}
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
                  {pet.adoptionFee && (
                    <div className="mb-2">
                      <strong>Adoption Fee:</strong> 
                      <span className="ms-2">
                        <i className="fas fa-dollar-sign text-primary me-1"></i>
                        ${pet.adoptionFee}
                      </span>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Description */}
              {pet.description && (
                <div className="mb-4">
                  <h5>
                    <i className="fas fa-info-circle text-primary me-2"></i>
                    About {pet.displayName || pet.name}
                  </h5>
                  <p className="text-muted">{pet.description}</p>
                </div>
              )}

              {/* Rating System */}
              <div className="mb-4">
                <h6>
                  <i className="fas fa-heart text-danger me-2"></i>
                  Rate {pet.displayName || pet.name}
                </h6>
                <div className="d-flex align-items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="link"
                      className="p-1 text-warning"
                      onClick={() => handleRating(star)}
                      disabled={hasRated || isRating || pet.adopted}
                      style={{ fontSize: '1.5rem' }}
                    >
                      <i className={`fas fa-heart ${
                        (rating >= star || (pet.rating || 0) >= star) 
                          ? '' 
                          : 'opacity-25'
                      }`}></i>
                    </Button>
                  ))}
                  <span className="ms-2 text-muted">
                    ({pet.ratingCount || 0} rating{(pet.ratingCount || 0) !== 1 ? 's' : ''})
                  </span>
                  {isRating && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </div>
                {hasRated && (
                  <small className="text-success">
                    <i className="fas fa-check me-1"></i>
                    Thank you for rating {pet.displayName || pet.name}!
                  </small>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {!pet.adopted && statusInfo.text !== 'Adopted' ? (
                  <>
                    <Button variant="primary" size="lg">
                      <i className="fas fa-heart me-2"></i>
                      Adopt {pet.displayName || pet.name}
                    </Button>
                    <Button variant="outline-secondary">
                      <i className="fas fa-envelope me-2"></i>
                      Contact About {pet.displayName || pet.name}
                    </Button>
                    <Button variant="outline-info">
                      <i className="fas fa-star me-2"></i>
                      Add to Favorites
                    </Button>
                  </>
                ) : (
                  <Alert variant="info" className="mb-0">
                    <i className="fas fa-heart me-2"></i>
                    {pet.displayName || pet.name} has found their forever home!
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
              <i className="fas fa-smile text-warning me-2"></i>
              Personality Traits
            </h4>
            <Row>
              {pet.traits.map((trait, index) => (
                <Col md={6} lg={4} className="mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">
                      {typeof trait === 'string' 
                        ? trait.charAt(0).toUpperCase() + trait.slice(1)
                        : trait.name || 'Trait'
                      }
                    </span>
                    <span className="text-muted">{getPersonalityScore(trait)}%</span>
                  </div>
                  <ProgressBar 
                    now={getPersonalityScore(trait)} 
                    variant={
                      getPersonalityScore(trait) > 75 ? 'success' : 
                      getPersonalityScore(trait) > 50 ? 'warning' : 'info'
                    }
                    style={{ height: '8px' }}
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
            <i className="fas fa-clipboard-list text-info me-2"></i>
            Additional Information
          </h4>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Pet ID:</strong> 
                  <code className="ms-2 bg-light px-2 py-1 rounded">{pet._id}</code>
                </li>
                <li className="mb-2">
                  <strong>Added to Site:</strong> {formatDate(pet.createdAt)}
                </li>
                {pet.location && (
                  <li className="mb-2">
                    <strong>Location:</strong> 
                    <span className="ms-2">
                      <i className="fas fa-map-marker-alt text-danger me-1"></i>
                      {typeof pet.location === 'object' 
                        ? `${pet.location.city || ''} ${pet.location.state || ''}`.trim()
                        : pet.location
                      }
                    </span>
                  </li>
                )}
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Profile Views:</strong> 
                  <span className="ms-2">
                    <i className="fas fa-eye text-primary me-1"></i>
                    {pet.views || 0}
                  </span>
                </li>
                <li className="mb-2">
                  <strong>Favorites:</strong> 
                  <span className="ms-2">
                    <i className="fas fa-star text-warning me-1"></i>
                    {pet.favorites || 0}
                  </span>
                </li>
                <li className="mb-2">
                  <strong>Days Since Posted:</strong> 
                  <span className="ms-2">
                    <i className="fas fa-calendar text-success me-1"></i>
                    {pet.daysSincePosted || 0} days
                  </span>
                </li>
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
              <i className="fas fa-paw me-1"></i>
              More {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}s
            </Button>
            {pet.age && (
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(`/browse?age=${pet.age}`)}
              >
                <i className="fas fa-birthday-cake me-1"></i>
                Other {formatAge(pet.age)} Pets
              </Button>
            )}
            {pet.size && (
              <Button 
                variant="outline-info" 
                onClick={() => navigate(`/browse?size=${pet.size}`)}
              >
                <i className="fas fa-ruler me-1"></i>
                {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)} Pets
              </Button>
            )}
            <Button 
              variant="outline-success" 
              onClick={() => navigate('/browse?featured=true')}
            >
              <i className="fas fa-star me-1"></i>
              Featured Pets
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4 bg-light">
          <Card.Header>
            <h6 className="mb-0">
              <i className="fas fa-bug me-2"></i>
              Debug Information (Development Only)
            </h6>
          </Card.Header>
          <Card.Body>
            <details>
              <summary className="fw-bold mb-2">Pet Data (Click to expand)</summary>
              <pre className="small" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(pet, null, 2)}
              </pre>
            </details>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PetDetail;