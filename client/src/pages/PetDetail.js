// client/src/pages/PetDetail.js - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaHeart, FaPaw, FaMars, FaVenus, FaMapMarkerAlt, FaArrowLeft, FaPhone, FaShare } from 'react-icons/fa';
import { petAPI } from '../services/api';
import { getPetImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';
import HeroBanner from '../components/HeroBanner';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [isRating, setIsRating] = useState(false);

  // Fetch pet data
  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🐕 Fetching pet details for ID:', id);
        
        const response = await petAPI.getPetById(id);
        console.log('Pet detail response:', response.data);
        
        const petData = response.data?.data || response.data;
        setPet(petData);
        setCurrentRating(petData.heartRating || 0);
        
      } catch (error) {
        console.error('❌ Error fetching pet details:', error);
        if (error.response?.status === 404) {
          setError('Pet not found. It may have been adopted or removed.');
        } else {
          setError('Failed to load pet details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPet();
    }
  }, [id]);

  // Rate pet function
  const handleRating = async (rating) => {
    if (isRating) return;
    
    try {
      setIsRating(true);
      
      const response = await petAPI.ratePet?.(id, rating);
      if (response) {
        setCurrentRating(rating);
        console.log('✅ Pet rated successfully');
      }
    } catch (error) {
      console.error('❌ Error rating pet:', error);
    } finally {
      setIsRating(false);
    }
  };

  const handleImageError = (e) => {
    if (!imageError && pet) {
      const fallbackUrl = FALLBACK_IMAGES[pet.type] || FALLBACK_IMAGES.pet;
      if (e.target.src !== fallbackUrl) {
        setImageError(true);
        e.target.src = fallbackUrl;
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { variant: 'success', icon: '✨', text: 'Available for Adoption' },
      pending: { variant: 'warning', icon: '⏳', text: 'Adoption Pending' },
      adopted: { variant: 'secondary', icon: '❤️', text: 'Already Adopted' }
    };
    return badges[status] || badges.available;
  };

  const getGenderIcon = (gender) => {
    if (gender === 'male') return <FaMars className="text-primary" />;
    if (gender === 'female') return <FaVenus className="text-danger" />;
    return <FaPaw className="text-muted" />;
  };

  const renderHeartRating = (interactive = false) => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      hearts.push(
        <FaHeart
          key={i}
          className={`${i <= currentRating ? 'text-danger' : 'text-muted'} ${interactive ? 'rating-heart' : ''}`}
          size={interactive ? 24 : 18}
          style={{ 
            cursor: interactive ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            marginRight: '4px'
          }}
          onClick={interactive ? () => handleRating(i) : undefined}
          onMouseEnter={interactive ? (e) => e.target.style.transform = 'scale(1.2)' : undefined}
          onMouseLeave={interactive ? (e) => e.target.style.transform = 'scale(1)' : undefined}
        />
      );
    }
    return hearts;
  };

  // Loading state
  if (loading) {
    return (
      <>
        <HeroBanner
          variant="simple"
          title="Loading Pet Details..."
          subtitle="Please wait while we fetch information about your potential new friend"
          showLogo={false}
        />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading pet details...</p>
        </Container>
      </>
    );
  }

  // Error state
  if (error || !pet) {
    return (
      <>
        <HeroBanner
          variant="simple"
          title="Pet Not Found"
          subtitle="We couldn't find the pet you're looking for"
          showLogo={false}
        />
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>{error}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-danger" onClick={() => navigate('/browse')}>
                Browse Other Pets
              </Button>
              <Button variant="outline-secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  const imageUrl = getPetImageUrl(pet.image, pet.type);
  const statusBadge = getStatusBadge(pet.status);

  return (
    <div>
      {/* Hero Section */}
      <HeroBanner
        variant="simple"
        title={`Meet ${pet.name}`}
        subtitle={`${pet.breed} • ${pet.age} • Looking for a loving home`}
        showLogo={false}
        backgroundGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        minHeight="250px"
      />

      <Container className="py-5">
        {/* Back Button */}
        <div className="mb-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/browse')}
            className="d-flex align-items-center"
          >
            <FaArrowLeft className="me-2" />
            Back to Browse
          </Button>
        </div>

        <Row>
          {/* Pet Image */}
          <Col lg={6} className="mb-4">
            <Card className="enhancedCard">
              <div className="position-relative">
                {/* 🆕 LARGE IMAGE CONTAINER for detail page */}
                <div 
                  className="cardImgContainer"
                  style={{
                    width: '100%',
                    height: '400px',
                    margin: '20px auto',
                    maxWidth: '400px'
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={pet.name}
                    className={`cardImg ${imageLoaded ? '' : 'loading'}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                </div>

                {/* Status Badge */}
                <Badge 
                  bg={statusBadge.variant}
                  className="position-absolute top-0 end-0 m-3 enhancedBadge"
                  style={{ zIndex: 10 }}
                >
                  {statusBadge.icon} {statusBadge.text}
                </Badge>

                {/* Featured Badge */}
                {pet.featured && (
                  <Badge 
                    bg="primary"
                    className="position-absolute top-0 start-0 m-3 enhancedBadge"
                    style={{ zIndex: 10 }}
                  >
                    ⭐ Featured Pet
                  </Badge>
                )}
              </div>
            </Card>
          </Col>

          {/* Pet Details */}
          <Col lg={6}>
            <Card className="enhancedCard h-100">
              <Card.Body className="enhancedCardBody">
                {/* Name & Gender */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h1 className="enhancedCardTitle display-5 mb-0 text-capitalize">
                    {pet.name}
                  </h1>
                  <div className="fs-2">
                    {getGenderIcon(pet.gender)}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="mb-4">
                  <h5 className="text-muted text-capitalize">
                    {pet.breed} • {pet.age} • {pet.size}
                  </h5>
                </div>

                {/* Location */}
                {pet.location && (
                  <div className="mb-4">
                    <h6 className="text-muted">
                      <FaMapMarkerAlt className="me-2" />
                      {pet.location}
                    </h6>
                  </div>
                )}

                {/* Heart Rating */}
                <div className="mb-4">
                  <h6 className="mb-2">Rate this pet:</h6>
                  <div className="d-flex align-items-center gap-2">
                    {renderHeartRating(true)}
                    <span className="text-muted">
                      ({currentRating}/5)
                    </span>
                    {isRating && <Spinner size="sm" />}
                  </div>
                </div>

                {/* Badges */}
                <div className="enhancedBadges mb-4">
                  {pet.isVaccinated && (
                    <Badge bg="info" className="enhancedBadge">
                      💉 Vaccinated
                    </Badge>
                  )}
                  {pet.isSpayedNeutered && (
                    <Badge bg="success" className="enhancedBadge">
                      ✂️ Spayed/Neutered
                    </Badge>
                  )}
                  {pet.needsSpecialCare && (
                    <Badge bg="warning" className="enhancedBadge">
                      ⚠️ Needs Special Care
                    </Badge>
                  )}
                </div>

                {/* Adoption Fee */}
                <div className="text-center mb-4 p-3 bg-light rounded">
                  <h4 className="text-success mb-0">
                    ${pet.adoptionFee || 0} Adoption Fee
                  </h4>
                  <small className="text-muted">Includes initial vet care and vaccinations</small>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  {pet.status === 'available' ? (
                    <>
                      <Button 
                        variant="success" 
                        size="lg"
                        className="enhancedButton"
                        style={{
                          backgroundColor: '#28a745',
                          borderColor: '#28a745',
                          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)'
                        }}
                      >
                        <FaHeart className="me-2" />
                        Start Adoption Process
                      </Button>
                      <Button 
                        variant="outline-primary"
                        className="enhancedButton"
                      >
                        <FaPhone className="me-2" />
                        Contact About {pet.name}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="lg"
                      disabled
                      className="enhancedButton"
                    >
                      {statusBadge.icon} {statusBadge.text}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline-secondary"
                    className="enhancedButton"
                  >
                    <FaShare className="me-2" />
                    Share {pet.name}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Description & Details */}
        <Row className="mt-5">
          <Col lg={8}>
            <Card className="enhancedCard">
              <Card.Body className="enhancedCardBody">
                <h3 className="enhancedCardTitle">About {pet.name}</h3>
                <p className="enhancedCardText">
                  {pet.description || `${pet.name} is a wonderful ${pet.breed} looking for a loving forever home. This ${pet.age} ${pet.gender} is full of love and ready to become part of your family.`}
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="enhancedCard">
              <Card.Body className="enhancedCardBody">
                <h5 className="enhancedCardTitle">Pet Details</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Type:</span>
                    <span className="text-capitalize">{pet.type}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Breed:</span>
                    <span className="text-capitalize">{pet.breed}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Age:</span>
                    <span className="text-capitalize">{pet.age}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Size:</span>
                    <span className="text-capitalize">{pet.size}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Gender:</span>
                    <span className="text-capitalize">{pet.gender}</span>
                  </ListGroup.Item>
                  {pet.location && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <span>Location:</span>
                      <span>{pet.location}</span>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Related Pets */}
        <Row className="mt-5">
          <Col>
            <div className="text-center">
              <h3>Other Pets You Might Love</h3>
              <p className="text-muted mb-4">
                Check out these other wonderful pets looking for homes
              </p>
              <Link to="/browse" className="btn btn-primary enhancedButton">
                <FaPaw className="me-2" />
                Browse More Pets
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PetDetail;