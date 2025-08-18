// client/src/pages/PetDetail.js - COMPLETE ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { 
  FaHeart, 
  FaPaw, 
  FaMars, 
  FaVenus, 
  FaArrowLeft, 
  FaPhone, 
  FaShare, 
  FaBirthdayCake,
  FaWeightHanging,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { api } from '../services/api';
import { getPetImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

// Import enhanced styling
import '../styles/components.css';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [availableIds, setAvailableIds] = useState([]);

  useEffect(() => {
    const fetchPet = async () => {
      // Debug logging
      console.log('🐕 PetDetail: URL params:', { id });
      console.log('🐕 PetDetail: Current URL:', window.location.href);
      
      if (!id) {
        setError('No pet ID provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        console.log('🐕 PetDetail: Fetching pet details for ID:', id);
        
        const response = await api.get(`/pets/${id}`);
        console.log('🐕 PetDetail: API response:', response);
        
        if (response.data?.success && response.data.data) {
          setPet(response.data.data);
          console.log('✅ PetDetail: Pet loaded successfully:', response.data.data.name);
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        console.error('❌ PetDetail: Error fetching pet details:', error);
        
        // Handle specific error types
        if (error.response?.status === 404) {
          const errorData = error.response.data;
          setError(`Pet not found. The pet "${id}" may have been adopted or removed.`);
          
          // Show available IDs for debugging
          if (errorData.availableIds) {
            setAvailableIds(errorData.availableIds);
            console.log('🐕 Available pet IDs:', errorData.availableIds);
          }
        } else if (error.response?.status === 400) {
          setError('Invalid pet ID format. Please check the URL.');
        } else {
          setError('Failed to load pet details. Please try again.');
        }
        
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // Helper function to get gender icon
  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'male') {
      return <FaMars className="text-primary" title="Male" />;
    } else if (gender?.toLowerCase() === 'female') {
      return <FaVenus className="text-danger" title="Female" />;
    }
    return <FaInfoCircle className="text-muted" title="Gender not specified" />;
  };

  // Helper function to format age
  const formatAge = (age) => {
    if (!age) return 'Age not specified';
    if (typeof age === 'string') return age;
    return `${age} years old`;
  };

  // Helper function to format size
  const formatSize = (size) => {
    if (!size) return 'Size not specified';
    return size.charAt(0).toUpperCase() + size.slice(1);
  };

  // Helper function to get image URL with fallback
  const getImageUrl = (pet) => {
    if (getPetImageUrl) {
      return getPetImageUrl(pet.image_url || pet.image, pet.type);
    }
    
    // Fallback if getPetImageUrl is not available
    const imagePath = pet.image_url || pet.image;
    if (!imagePath) {
      return FALLBACK_IMAGES?.[pet.type] || FALLBACK_IMAGES?.pet || '/images/default-pet.jpg';
    }
    
    if (imagePath.startsWith('http')) return imagePath;
    return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading pet details...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <FaInfoCircle className="me-2" />
              <strong>Error:</strong> {error}
              
              {availableIds.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted d-block mb-2">
                    Available Pet IDs (for debugging):
                  </small>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {availableIds.slice(0, 5).map(availableId => (
                      <Button
                        key={availableId}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/pets/${availableId}`)}
                      >
                        {availableId}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/pets')}
                  className="me-2"
                >
                  <FaArrowLeft className="me-2" />
                  Browse All Pets
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // No pet found
  if (!pet) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              Pet not found.
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Success state - render pet details
  return (
    <Container className="py-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/pets')}
          className="detailButton"
        >
          <FaArrowLeft className="me-2" />
          Back to Pets
        </Button>
      </div>

      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          {/* ✅ USING ENHANCED CSS CLASSES */}
          <Card className="detailCard">
            {/* ✅ ENHANCED IMAGE CONTAINER - FIXED SIZE */}
            <div className="detailImgContainer">
              <img 
                src={getImageUrl(pet)}
                alt={pet.name || 'Pet'}
                className={`detailImg ${imageLoading ? 'loading' : ''}`}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  console.log('🖼️ Image error, using fallback for pet type:', pet.type);
                  e.target.src = FALLBACK_IMAGES?.[pet.type] || FALLBACK_IMAGES?.pet || '/images/default-pet.jpg';
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <div className="position-absolute top-50 start-50 translate-middle">
                  <Spinner animation="border" variant="secondary" />
                </div>
              )}
            </div>

            {/* ✅ ENHANCED CARD BODY */}
            <Card.Body className="detailCardBody">
              {/* Pet Name & Gender */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="detailTitle text-capitalize mb-0">
                  {pet.name || 'Unnamed Pet'}
                </h1>
                <div className="fs-2">
                  {getGenderIcon(pet.gender)}
                </div>
              </div>

              {/* ✅ ENHANCED STATUS BADGE */}
              <div className="text-center mb-4">
                <Badge 
                  className={`detailBadge ${
                    pet.status === 'available' ? 'badge-success' : 
                    pet.status === 'pending' ? 'badge-warning' : 
                    pet.status === 'adopted' ? 'badge-info' : 'badge-secondary'
                  }`}
                >
                  {pet.status?.charAt(0).toUpperCase() + pet.status?.slice(1) || 'Status Unknown'}
                </Badge>
              </div>

              {/* ✅ ENHANCED PET INFO GRID */}
              <div className="detailInfoGrid">
                <div className="detailInfoItem">
                  <FaPaw />
                  <div className="info-content">
                    <div className="info-label">Breed</div>
                    <div className="info-value">{pet.breed || 'Mixed Breed'}</div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaBirthdayCake />
                  <div className="info-content">
                    <div className="info-label">Age</div>
                    <div className="info-value">{formatAge(pet.age)}</div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaWeightHanging />
                  <div className="info-content">
                    <div className="info-label">Size</div>
                    <div className="info-value">{formatSize(pet.size)}</div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaMapMarkerAlt />
                  <div className="info-content">
                    <div className="info-label">Location</div>
                    <div className="info-value">{pet.location || 'Location not specified'}</div>
                  </div>
                </div>

                {pet.weight && (
                  <div className="detailInfoItem">
                    <FaWeightHanging />
                    <div className="info-content">
                      <div className="info-label">Weight</div>
                      <div className="info-value">{pet.weight}</div>
                    </div>
                  </div>
                )}

                {pet.adoption_fee && (
                  <div className="detailInfoItem">
                    <i className="fas fa-dollar-sign"></i>
                    <div className="info-content">
                      <div className="info-label">Adoption Fee</div>
                      <div className="info-value">${pet.adoption_fee}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ ENHANCED DESCRIPTION */}
              {pet.description && (
                <div>
                  <h3 className="detailSectionHeader">About {pet.name}</h3>
                  <p className="detailDescription">{pet.description}</p>
                </div>
              )}

              {/* Special Needs or Notes */}
              {pet.special_needs && (
                <div>
                  <h3 className="detailSectionHeader">Special Care Requirements</h3>
                  <p className="detailDescription">{pet.special_needs}</p>
                </div>
              )}

              {/* Personality Traits */}
              {pet.personality && (
                <div>
                  <h3 className="detailSectionHeader">Personality</h3>
                  <p className="detailDescription">{pet.personality}</p>
                </div>
              )}

              {/* ✅ ENHANCED ACTION BUTTONS */}
              <div className="d-grid gap-3 mt-4">
                {pet.status === 'available' && (
                  <Button className="detailButton btn-primary" size="lg">
                    <FaHeart className="me-2" />
                    Apply to Adopt {pet.name}
                  </Button>
                )}
                
                {pet.status === 'pending' && (
                  <Button className="detailButton btn-warning" size="lg" disabled>
                    <FaCalendarAlt className="me-2" />
                    Adoption Pending
                  </Button>
                )}

                {pet.status === 'adopted' && (
                  <Button className="detailButton btn-info" size="lg" disabled>
                    <FaHeart className="me-2" />
                    {pet.name} Has Been Adopted!
                  </Button>
                )}
                
                <Row>
                  <Col>
                    <Button className="detailButton btn-outline-primary w-100">
                      <FaPhone className="me-2" />
                      Contact Shelter
                    </Button>
                  </Col>
                  <Col>
                    <Button 
                      className="detailButton btn-outline-secondary w-100"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `Meet ${pet.name}!`,
                            text: `Check out this adorable ${pet.breed} looking for a home!`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                    >
                      <FaShare className="me-2" />
                      Share
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Pet ID for reference */}
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Pet ID: {pet._id} • Type: {pet.type || 'Unknown'}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PetDetail;