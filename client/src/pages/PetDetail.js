// client/src/pages/PetDetail.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaHeart, FaPaw, FaMars, FaVenus, FaMapMarkerAlt, FaArrowLeft, FaPhone, FaShare } from 'react-icons/fa';
import { petAPI } from '../services/api';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

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
        setError('');
        
        console.log('🐕 PetDetail: Fetching pet details for ID:', id);
        
        const response = await petAPI.getPetById(id);
        console.log('🐕 PetDetail: API response:', response);
        
        // Handle different response structures
        let petData = null;
        
        if (response?.data?.success && response.data.data) {
          // Standard API response structure
          petData = response.data.data;
        } else if (response?.data && response.data._id) {
          // Direct pet object
          petData = response.data;
        } else if (response?.success && response.data) {
          // Alternative success structure
          petData = response.data;
        }
        
        if (!petData) {
          throw new Error('Pet data not found in response');
        }
        
        console.log('🐕 PetDetail: Pet data:', petData);
        setPet(petData);
        
      } catch (error) {
        console.error('❌ PetDetail: Error fetching pet details:', error);
        
        if (error.response?.status === 404) {
          setError('Pet not found. It may have been adopted or removed.');
        } else if (error.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load pet details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Get pet image URL
  const getPetImageUrl = () => {
    if (imageError) {
      return 'https://via.placeholder.com/400x300/f8f9fa/6c757d?text=No+Image';
    }
    
    if (pet?.imageUrl) {
      return pet.imageUrl;
    }
    
    if (pet?.image) {
      return `https://storage.googleapis.com/furbabies-petstore/${pet.image}`;
    }
    
    return 'https://via.placeholder.com/400x300/f8f9fa/6c757d?text=No+Image';
  };

  // Format age display
  const formatAge = (age) => {
    if (!age) return 'Unknown';
    if (age < 1) return `${Math.floor(age * 12)} months`;
    if (age === 1) return '1 year';
    return `${age} years`;
  };

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'success';
      case 'pending': return 'warning';
      case 'adopted': return 'primary';
      default: return 'secondary';
    }
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male': return <FaMars className="text-primary" />;
      case 'female': return <FaVenus className="text-danger" />;
      default: return <FaPaw className="text-muted" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <h5 className="mt-3">Loading pet details...</h5>
          <p className="text-muted">Please wait while we fetch the information.</p>
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
            Unable to Load Pet Details
          </Alert.Heading>
          <p className="mb-3">{error}</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/pets')}>
              <FaArrowLeft className="me-2" />
              Back to Pets
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // No pet found
  if (!pet) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Pet Not Found</Alert.Heading>
          <p>The pet you're looking for doesn't exist or may have been removed.</p>
          <Button variant="primary" onClick={() => navigate('/pets')}>
            <FaArrowLeft className="me-2" />
            Browse All Pets
          </Button>
        </Alert>
      </Container>
    );
  }

  // Main pet detail display
  return (
    <Container className="py-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/pets')}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" />
          Back to Pets
        </Button>
      </div>

      <Row>
        {/* Pet Image */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <div className="position-relative">
              <img
                src={getPetImageUrl()}
                alt={pet.name || 'Pet photo'}
                className="card-img-top"
                style={{ 
                  height: '500px', 
                  objectFit: 'cover',
                  borderRadius: '0.375rem 0.375rem 0 0'
                }}
                onError={handleImageError}
              />
              
              {/* Status Badge */}
              <div className="position-absolute top-0 end-0 m-3">
                <Badge 
                  bg={getStatusVariant(pet.status)} 
                  className="px-3 py-2 fs-6"
                  style={{ borderRadius: '20px' }}
                >
                  {pet.status?.charAt(0).toUpperCase() + pet.status?.slice(1) || 'Unknown'}
                </Badge>
              </div>

              {/* Featured Badge */}
              {pet.featured && (
                <div className="position-absolute top-0 start-0 m-3">
                  <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
                    <i className="fas fa-star me-1"></i>
                    Featured
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Pet Details */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              
              {/* Pet Name & Type */}
              <div className="mb-3">
                <h1 className="display-6 fw-bold text-primary mb-2">
                  {pet.name || 'Unnamed Pet'}
                </h1>
                <h5 className="text-muted">
                  {pet.breed || 'Mixed Breed'} • {pet.type?.charAt(0).toUpperCase() + pet.type?.slice(1) || 'Pet'}
                </h5>
              </div>

              {/* Quick Info */}
              <Row className="mb-4">
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    {getGenderIcon(pet.gender)}
                    <span className="ms-2">
                      <strong>Gender:</strong> {pet.gender?.charAt(0).toUpperCase() + pet.gender?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaPaw className="text-primary" />
                    <span className="ms-2">
                      <strong>Age:</strong> {formatAge(pet.age)}
                    </span>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-weight text-info"></i>
                    <span className="ms-2">
                      <strong>Weight:</strong> {pet.weight ? `${pet.weight} lbs` : 'Not specified'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaMapMarkerAlt className="text-danger" />
                    <span className="ms-2">
                      <strong>Location:</strong> {pet.location || 'At shelter'}
                    </span>
                  </div>
                </Col>
              </Row>

              {/* Category & Additional Info */}
              {pet.category && (
                <div className="mb-3">
                  <Badge bg="info" className="me-2 px-3 py-2">
                    {pet.category}
                  </Badge>
                  {pet.specialNeeds && (
                    <Badge bg="warning" text="dark" className="px-3 py-2">
                      Special Needs
                    </Badge>
                  )}
                </div>
              )}

              {/* Description */}
              {pet.description && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">About {pet.name}</h6>
                  <p className="text-muted lh-lg">
                    {pet.description}
                  </p>
                </div>
              )}

              {/* Additional Details */}
              {(pet.personality || pet.goodWith || pet.training) && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Additional Information</h6>
                  
                  {pet.personality && (
                    <div className="mb-2">
                      <strong>Personality:</strong> <span className="text-muted">{pet.personality}</span>
                    </div>
                  )}
                  
                  {pet.goodWith && (
                    <div className="mb-2">
                      <strong>Good with:</strong> <span className="text-muted">{pet.goodWith}</span>
                    </div>
                  )}
                  
                  {pet.training && (
                    <div className="mb-2">
                      <strong>Training:</strong> <span className="text-muted">{pet.training}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-3">
                {pet.status === 'available' && (
                  <Button variant="primary" size="lg" className="fw-bold">
                    <FaHeart className="me-2" />
                    Apply to Adopt
                  </Button>
                )}
                
                <Row>
                  <Col>
                    <Button variant="outline-primary" className="w-100">
                      <FaPhone className="me-2" />
                      Contact
                    </Button>
                  </Col>
                  <Col>
                    <Button variant="outline-secondary" className="w-100">
                      <FaShare className="me-2" />
                      Share
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Pet ID for reference */}
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Pet ID: {pet._id || pet.id}
                </small>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Information Section */}
      {(pet.medicalHistory || pet.vaccinationStatus || pet.adoptionFee) && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2 text-primary"></i>
                  Important Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {pet.medicalHistory && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Medical History</h6>
                      <p className="text-muted small">{pet.medicalHistory}</p>
                    </Col>
                  )}
                  
                  {pet.vaccinationStatus && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Vaccinations</h6>
                      <p className="text-muted small">{pet.vaccinationStatus}</p>
                    </Col>
                  )}
                  
                  {pet.adoptionFee && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Adoption Fee</h6>
                      <p className="text-success fw-bold">${pet.adoptionFee}</p>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default PetDetail;