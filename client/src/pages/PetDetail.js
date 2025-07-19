// client/src/pages/PetDetail.js - CORRECTED Pet detail page
import React, { useState, useEffect, useCallback } from 'react';
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
          // ✅ FIXED: Normalize pet data to handle backend field variations safely
          const normalizedPet = {
            ...petData,
            // Ensure basic fields are strings, not objects
            _id: String(petData._id || ''),
            name: String(petData.name || petData.displayName || 'Unnamed Pet'),
            displayName: String(petData.displayName || petData.name || 'Unnamed Pet'),
            type: String(petData.type || 'pet').toLowerCase(),
            breed: String(petData.breed || 'Mixed Breed'),
            age: String(petData.age || 'Unknown'),
            size: String(petData.size || 'Medium').toLowerCase(),
            gender: String(petData.gender || 'Unknown').toLowerCase(),
            color: String(petData.color || 'Various'),
            
            // Handle description safely
            description: petData.description ? String(petData.description) : 'This adorable pet is looking for a loving home!',
            
            // ✅ FIXED: Ensure traits is always an array of strings
            traits: Array.isArray(petData.traits) 
              ? petData.traits.filter(trait => typeof trait === 'string') 
              : Array.isArray(petData.personalityTraits) 
                ? petData.personalityTraits.filter(trait => typeof trait === 'string')
                : [],
            
            // Handle image field safely
            image: petData.image || petData.imageUrl || '',
            
            // Handle boolean fields safely
            adopted: Boolean(petData.adopted || petData.status === 'adopted'),
            available: Boolean(petData.available !== false && petData.status !== 'adopted'),
            featured: Boolean(petData.featured),
            
            // Handle numeric fields safely
            rating: Number(petData.rating || 0),
            ratingCount: Number(petData.ratingCount || 0),
            
            // Handle dates safely
            dateAdded: petData.dateAdded || petData.createdAt || new Date().toISOString(),
            
            // Handle location safely
            location: petData.location ? String(petData.location) : 'FurBabies Pet Store',
            
            // Handle status safely
            status: String(petData.status || 'available')
          };
          
          setPet(normalizedPet);
          console.log('✅ Pet loaded successfully:', normalizedPet.name);
          console.log('📋 Pet data fields:', Object.keys(normalizedPet));
        } else {
          throw new Error('Pet data is incomplete or missing required ID');
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
  const handleRating = useCallback(async (newRating) => {
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
          rating: Number(response.data.newRating || newRating),
          ratingCount: Number((prev.ratingCount || 0) + 1)
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
  }, [hasRated, isRating, pet]);

  // ✅ FIXED: Safe utility functions with proper null checking
  const formatAge = useCallback((age) => {
    if (!age || age === 'Unknown') return 'Unknown';
    const ageStr = String(age);
    return ageStr.charAt(0).toUpperCase() + ageStr.slice(1);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  }, []);

  const getPersonalityScore = useCallback((trait) => {
    if (!trait || typeof trait !== 'string') return 60;
    
    // Mock personality scores based on trait
    const scores = {
      'friendly': 90, 'energetic': 75, 'calm': 80, 'playful': 85,
      'loyal': 95, 'independent': 60, 'social': 70, 'protective': 85,
      'gentle': 90, 'intelligent': 80, 'affectionate': 85, 'active': 70,
      'quiet': 65, 'curious': 75, 'brave': 80, 'sweet': 90
    };
    return scores[trait.toLowerCase()] || Math.floor(Math.random() * 40) + 60;
  }, []);

  const getPetStatusInfo = useCallback(() => {
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
  }, [pet]);

  // ✅ FIXED: Safe render functions with proper null checking
  const renderStarRating = useCallback((currentRating = 0, onRate = null) => {
    const stars = [];
    const rating = Number(currentRating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <button
          key={`star-${i}`}
          type="button"
          className={`btn btn-link p-0 me-1 ${onRate && !hasRated ? 'pet-star-interactive' : ''}`}
          onClick={() => onRate && !hasRated && !isRating ? onRate(i) : null}
          disabled={!onRate || hasRated || isRating}
          style={{ 
            color: filled ? '#ffc107' : '#e0e0e0',
            fontSize: '1.2rem',
            cursor: onRate && !hasRated ? 'pointer' : 'default',
            border: 'none',
            background: 'none'
          }}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >
          <i className={filled ? 'fas fa-star' : 'far fa-star'}></i>
        </button>
      );
    }
    return stars;
  }, [hasRated, isRating]);

  const renderPersonalityTraits = useCallback(() => {
    if (!pet?.traits || !Array.isArray(pet.traits) || pet.traits.length === 0) {
      return (
        <p className="text-muted">
          <i className="fas fa-heart me-2"></i>
          This pet has a wonderful personality waiting to be discovered!
        </p>
      );
    }

    return (
      <div>
        {pet.traits.map((trait, index) => {
          const traitStr = String(trait);
          const score = getPersonalityScore(traitStr);
          return (
            <div key={`trait-${index}`} className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-medium text-capitalize">{traitStr}</span>
                <small className="text-muted">{score}%</small>
              </div>
              <ProgressBar 
                now={score} 
                variant={score >= 80 ? 'success' : score >= 60 ? 'info' : 'warning'}
                style={{ height: '8px' }}
              />
            </div>
          );
        })}
      </div>
    );
  }, [pet, getPersonalityScore]);

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

  // Pet not found (safety check)
  if (!pet || !pet._id) {
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

  // ✅ FIXED: Main pet display with safe rendering
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
            {/* ✅ FIXED: Safe string rendering */}
            {pet.displayName || pet.name || 'Pet Details'}
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
                alt={`Photo of ${pet.name || 'pet'}`}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Pet Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Header with name and status */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="h2 mb-2">{pet.name}</h1>
                  <p className="text-muted mb-2">
                    {pet.breed} • {formatAge(pet.age)}
                  </p>
                </div>
                <Badge 
                  bg={statusInfo.variant} 
                  className="fs-6 px-3 py-2"
                >
                  <i className={`fas fa-${statusInfo.icon} me-2`}></i>
                  {statusInfo.text}
                </Badge>
              </div>

              {/* Quick Info */}
              <Row className="mb-4">
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-venus-mars text-muted me-2" style={{ width: '20px' }}></i>
                    <span>{pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-ruler text-muted me-2" style={{ width: '20px' }}></i>
                    <span>{pet.size.charAt(0).toUpperCase() + pet.size.slice(1)} Size</span>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-palette text-muted me-2" style={{ width: '20px' }}></i>
                    <span>{pet.color}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-map-marker-alt text-muted me-2" style={{ width: '20px' }}></i>
                    <span>{pet.location}</span>
                  </div>
                </Col>
              </Row>

              {/* Rating Section */}
              <div className="mb-4">
                <h6 className="mb-2">
                  <i className="fas fa-star text-warning me-2"></i>
                  Rate this Pet
                </h6>
                <div className="d-flex align-items-center">
                  {renderStarRating(rating || pet.rating, handleRating)}
                  <span className="ms-2 text-muted">
                    {hasRated ? 'Thank you for rating!' : 
                     pet.ratingCount > 0 ? `(${pet.ratingCount} rating${pet.ratingCount > 1 ? 's' : ''})` : 
                     'Be the first to rate!'}
                  </span>
                  {isRating && (
                    <Spinner size="sm" animation="border" className="ms-2" />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {pet.adopted ? (
                  <Button variant="success" size="lg" disabled>
                    <i className="fas fa-heart me-2"></i>
                    This Pet Has Been Adopted!
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={() => navigate(`/adopt/${pet._id}`)}
                    >
                      <i className="fas fa-heart me-2"></i>
                      Start Adoption Process
                    </Button>
                    <Button 
                      variant="outline-info" 
                      onClick={() => navigate('/contact', { state: { petId: pet._id, petName: pet.name } })}
                    >
                      <i className="fas fa-envelope me-2"></i>
                      Ask About {pet.name}
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Description Section */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            About {pet.name}
          </h5>
          <p className="mb-0">{pet.description}</p>
          <hr />
          <small className="text-muted">
            <i className="fas fa-calendar-plus me-2"></i>
            Added to our family on {formatDate(pet.dateAdded)}
          </small>
        </Card.Body>
      </Card>

      {/* Personality Traits */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-heart me-2"></i>
            Personality Traits
          </h5>
          {renderPersonalityTraits()}
        </Card.Body>
      </Card>

      {/* Related Pets and Actions */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-paw me-2"></i>
            Explore More Pets
          </h5>
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

      {/* ✅ FIXED: Safe debug info (Development Only) */}
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
                {/* ✅ FIXED: Safe JSON.stringify with error handling */}
                {(() => {
                  try {
                    return JSON.stringify(pet, null, 2);
                  } catch (error) {
                    return `Error serializing pet data: ${error.message}`;
                  }
                })()}
              </pre>
            </details>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PetDetail;