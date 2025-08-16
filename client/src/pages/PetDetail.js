// ===== FIXED PetDetail.js =====
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaHeart, FaPaw, FaMars, FaVenus, FaArrowLeft, FaPhone, FaShare } from 'react-icons/fa';
import { api } from '../services/api';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading pet details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Pet Not Found</Alert.Heading>
          <p>{error}</p>
          
          {availableIds.length > 0 && (
            <div className="mt-3">
              <strong>Available pets:</strong>
              <ul className="mt-2">
                {availableIds.map((availableId, index) => (
                  <li key={index}>
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => navigate(`/pets/${availableId}`)}
                    >
                      {availableId}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/browse')}>
              Browse All Pets
            </Button>
            <Button variant="outline-secondary" className="ms-2" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <p>Pet data could not be loaded.</p>
          <Button variant="primary" onClick={() => navigate('/browse')}>
            Browse All Pets
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Back Button */}
      <Button 
        variant="outline-secondary" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <Row>
        {/* Pet Image */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <Card.Img
                variant="top"
                src={pet.imageUrl || `https://via.placeholder.com/400x400?text=${pet.name}`}
                alt={pet.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x400?text=${pet.name}`;
                }}
              />
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

              {/* Status Badge */}
              <div className="mb-3">
                <Badge 
                  bg={pet.status === 'available' ? 'success' : 'secondary'}
                  className="fs-6 px-3 py-2"
                >
                  {pet.status === 'available' ? '✅ Available for Adoption' : '❌ Not Available'}
                </Badge>
              </div>

              {/* Quick Info */}
              <Row className="mb-4">
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    {pet.gender === 'male' ? <FaMars className="text-primary" /> : 
                     pet.gender === 'female' ? <FaVenus className="text-danger" /> : 
                     <FaPaw className="text-muted" />}
                    <span className="ms-2">
                      <strong>Gender:</strong> {pet.gender?.charAt(0).toUpperCase() + pet.gender?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaPaw className="text-primary" />
                    <span className="ms-2">
                      <strong>Age:</strong> {pet.age || 'Unknown'}
                    </span>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-weight text-info"></i>
                    <span className="ms-2">
                      <strong>Size:</strong> {pet.size?.charAt(0).toUpperCase() + pet.size?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                  {pet.color && (
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-palette text-warning"></i>
                      <span className="ms-2">
                        <strong>Color:</strong> {pet.color}
                      </span>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Description */}
              <div className="mb-4">
                <h6 className="fw-bold mb-2">About {pet.name}</h6>
                <p className="text-muted">
                  {pet.description || 'This adorable pet is looking for a loving home.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-3">
                {pet.status === 'available' && (
                  <Button variant="primary" size="lg" className="fw-bold">
                    <FaHeart className="me-2" />
                    Apply to Adopt {pet.name}
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
                  Pet ID: {pet._id}
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