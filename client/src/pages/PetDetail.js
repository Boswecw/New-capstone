// client/src/pages/PetDetail.js - Complete Rewrite
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import PetImage from '../components/PetImage';
import api from '../services/api';

const PetDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  // State management
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch pet data
  const fetchPet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/pets/${id}`);
      setPet(response.data.data);
    } catch (error) {
      console.error('Error fetching pet:', error);
      setError(error.response?.data?.message || 'Pet not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Refresh pet data after actions
  const refreshPet = useCallback(async () => {
    try {
      const response = await api.get(`/pets/${id}`);
      setPet(response.data.data);
    } catch (error) {
      console.error('Error refreshing pet:', error);
    }
  }, [id]);

  // Handle voting
  const handleVote = async (voteType) => {
    if (!user || voting) return;
    
    setVoting(true);
    try {
      await api.post(`/pets/${id}/vote`, { voteType });
      await refreshPet();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  // Handle rating submission
  const handleRating = async (e) => {
    e.preventDefault();
    if (!user || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      await api.post(`/pets/${id}/rate`, { rating, comment });
      setComment('');
      setRating(5);
      await refreshPet();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Utility functions
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
    return price || 'Contact for pricing';
  };

  const getPetTypeDisplay = (type) => {
    const typeNames = {
      'small-pet': 'Small Pet',
      'supply': 'Pet Supply'
    };
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getVoteCount = (type) => {
    if (!pet?.votes) return 0;
    return pet.votes[type] || 0;
  };

  const calculateDaysSincePosted = () => {
    if (!pet?.createdAt) return null;
    return Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24));
  };

  // Load pet data on component mount
  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  // Loading state
  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '80px' }}>
        <Spinner animation="border" role="status" size="lg" variant="primary">
          <span className="visually-hidden">Loading pet details...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading pet information...</p>
      </Container>
    );
  }

  // Error state
  if (error || !pet) {
    return (
      <Container className="py-5" style={{ marginTop: '80px' }}>
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Pet Not Found
          </Alert.Heading>
          <p>The pet you're looking for doesn't exist or has been removed from our listings.</p>
          <hr />
          <div className="d-flex gap-2 justify-content-center">
            <Button as={Link} to="/browse" variant="primary">
              <i className="fas fa-th me-2"></i>
              Browse All Pets
            </Button>
            <Button as={Link} to="/" variant="outline-primary">
              <i className="fas fa-home me-2"></i>
              Go Home
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const daysSincePosted = calculateDaysSincePosted();

  return (
    <>
      <Container className="py-4" style={{ marginTop: '80px' }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">
                <i className="fas fa-home me-1"></i>Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/browse" className="text-decoration-none">Browse Pets</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to={`/browse?category=${pet.type}`} className="text-decoration-none">
                {getPetTypeDisplay(pet.type)}
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">{pet.name}</li>
          </ol>
        </nav>

        <Row>
          {/* Pet Image Section - FIXED SIZING */}
          <Col lg={6} className="mb-4">
            <div className="position-relative">
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="pet-image-container">
                  <PetImage
                    petType={pet.type}
                    imagePath={pet.image}
                    alt={`${pet.name} - ${pet.breed}`}
                    className="w-100 h-100"
                    size="large"
                    style={{ 
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={() => setImageError(true)}
                  />
                  
                  {/* Loading overlay */}
                  {imageError && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                      <div className="text-center">
                        <i className="fas fa-image fa-3x text-muted mb-2"></i>
                        <p className="text-muted">Image unavailable</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Status Badge */}
              <div className="position-absolute top-0 end-0 m-3">
                <Badge 
                  bg={pet.available ? 'success' : 'secondary'} 
                  className="px-3 py-2 shadow-sm"
                >
                  <i className={`fas ${pet.available ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                  {pet.available ? 'Available' : 'Adopted'}
                </Badge>
              </div>

              {/* New Badge */}
              {daysSincePosted !== null && daysSincePosted <= 7 && (
                <div className="position-absolute top-0 start-0 m-3">
                  <Badge bg="warning" text="dark" className="px-3 py-2 shadow-sm">
                    <i className="fas fa-star me-1"></i>
                    {daysSincePosted === 0 ? 'New Today!' : `${daysSincePosted} days ago`}
                  </Badge>
                </div>
              )}
            </div>
          </Col>
          
          {/* Pet Details Section */}
          <Col lg={6}>
            {/* Pet Name and Price */}
            <div className="mb-4">
              <h1 className="display-5 mb-2 text-primary">{pet.name}</h1>
              <h2 className="text-success mb-3">
                <i className="fas fa-tag me-2"></i>
                {formatPrice(pet.price)}
              </h2>
              
              {/* Tags */}
              {pet.tags && pet.tags.length > 0 && (
                <div className="mb-3">
                  {pet.tags.map((tag, index) => (
                    <Badge key={index} bg="outline-primary" className="me-2 mb-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pet Information Card */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Pet Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm={6}>
                    <div className="mb-3">
                      <i className="fas fa-paw text-primary me-2"></i>
                      <strong>Type:</strong> {getPetTypeDisplay(pet.type)}
                    </div>
                    <div className="mb-3">
                      <i className="fas fa-dna text-primary me-2"></i>
                      <strong>Breed:</strong> {pet.breed}
                    </div>
                    <div className="mb-3">
                      <i className="fas fa-birthday-cake text-primary me-2"></i>
                      <strong>Age:</strong> {pet.age}
                    </div>
                  </Col>
                  <Col sm={6}>
                    {pet.size && (
                      <div className="mb-3">
                        <i className="fas fa-ruler text-primary me-2"></i>
                        <strong>Size:</strong> {pet.size}
                      </div>
                    )}
                    {pet.gender && (
                      <div className="mb-3">
                        <i className={`fas ${pet.gender === 'male' ? 'fa-mars' : 'fa-venus'} text-primary me-2`}></i>
                        <strong>Gender:</strong> {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                      </div>
                    )}
                    {pet.color && (
                      <div className="mb-3">
                        <i className="fas fa-palette text-primary me-2"></i>
                        <strong>Color:</strong> {pet.color}
                      </div>
                    )}
                  </Col>
                </Row>
                
                {/* Description */}
                {pet.description && (
                  <div className="mt-3 pt-3 border-top">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-align-left me-2"></i>
                      Description
                    </h6>
                    <p className="text-muted">{pet.description}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            {/* Voting Section */}
            {user && pet.available && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-secondary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-heart me-2"></i>
                    Community Votes
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex gap-3 justify-content-center">
                    <Button 
                      variant="outline-success" 
                      size="lg"
                      onClick={() => handleVote('up')} 
                      disabled={voting}
                      className="flex-fill"
                    >
                      {voting ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          <i className="fas fa-thumbs-up me-2"></i>
                          Love It ({getVoteCount('up')})
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="lg"
                      onClick={() => handleVote('down')} 
                      disabled={voting}
                      className="flex-fill"
                    >
                      {voting ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          <i className="fas fa-thumbs-down me-2"></i>
                          Not for Me ({getVoteCount('down')})
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
            
            {/* Action Buttons */}
            <div className="d-grid gap-2 mb-4">
              {pet.available && (
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => setShowContactModal(true)}
                >
                  <i className="fas fa-heart me-2"></i>
                  Start Adoption Process
                </Button>
              )}
              
              <Button 
                as={Link} 
                to="/browse" 
                variant="outline-primary"
                size="lg"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Browse
              </Button>
            </div>
          </Col>
        </Row>
        
        {/* Rating and Reviews Section */}
        <Row className="mt-5">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-warning text-dark">
                <h3 className="mb-0">
                  <i className="fas fa-star me-2"></i>
                  Ratings & Reviews
                </h3>
              </Card.Header>
              <Card.Body>
                {/* Rating Summary */}
                {pet.ratings && pet.ratings.length > 0 && (
                  <div className="mb-4 p-3 bg-light rounded">
                    <Row className="align-items-center">
                      <Col md={3} className="text-center">
                        <div className="display-4 text-warning">
                          {pet.averageRating ? pet.averageRating.toFixed(1) : 'N/A'}
                        </div>
                        <div className="mb-2">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i}
                              className={`fas fa-star ${i < Math.floor(pet.averageRating || 0) ? 'text-warning' : 'text-muted'}`}
                            ></i>
                          ))}
                        </div>
                        <small className="text-muted">
                          Based on {pet.ratings.length} review{pet.ratings.length !== 1 ? 's' : ''}
                        </small>
                      </Col>
                      <Col md={9}>
                        <div className="d-flex align-items-center gap-3">
                          <i className="fas fa-users fa-2x text-primary"></i>
                          <div>
                            <h5 className="mb-1">Community Rating</h5>
                            <p className="text-muted mb-0">
                              See what other pet lovers think about {pet.name}
                            </p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
                
                {/* Add Rating Form */}
                {user ? (
                  <Card className="mb-4 border-primary">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="fas fa-edit me-2"></i>
                        Leave a Review
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handleRating}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Your Rating</Form.Label>
                              <Form.Select
                                value={rating}
                                onChange={(e) => setRating(parseInt(e.target.value))}
                                required
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                                <option value={4}>⭐⭐⭐⭐ Good</option>
                                <option value={3}>⭐⭐⭐ Average</option>
                                <option value={2}>⭐⭐ Poor</option>
                                <option value={1}>⭐ Terrible</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Comment (Optional)</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your thoughts about this pet..."
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Button 
                          type="submit" 
                          variant="primary"
                          disabled={submittingRating}
                        >
                          {submittingRating ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane me-2"></i>
                              Submit Review
                            </>
                          )}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                ) : (
                  <Alert variant="info" className="text-center">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    <Link to="/login" className="text-decoration-none">
                      Please log in to leave a review
                    </Link>
                  </Alert>
                )}
                
                {/* Display Reviews */}
                {pet.ratings && pet.ratings.length > 0 ? (
                  <div>
                    <h5 className="mb-3">
                      <i className="fas fa-comments me-2"></i>
                      Reviews ({pet.ratings.length})
                    </h5>
                    {pet.ratings.map((review, index) => (
                      <Card key={index} className="mb-3 border-start border-warning border-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="fas fa-user-circle fa-lg text-muted"></i>
                                <strong>{review.user?.username || 'Anonymous'}</strong>
                              </div>
                              <div>
                                {[...Array(5)].map((_, i) => (
                                  <i 
                                    key={i}
                                    className={`fas fa-star ${i < review.rating ? 'text-warning' : 'text-muted'}`}
                                  ></i>
                                ))}
                                <span className="ms-2 text-muted">({review.rating}/5)</span>
                              </div>
                            </div>
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          {review.comment && (
                            <Card.Text className="mb-0 ps-4">
                              <i className="fas fa-quote-left text-muted me-2"></i>
                              {review.comment}
                            </Card.Text>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert variant="light" className="text-center">
                    <i className="fas fa-star fa-2x text-muted mb-2 d-block"></i>
                    <h5>No reviews yet</h5>
                    <p className="mb-0">Be the first to review {pet.name}!</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-heart me-2 text-danger"></i>
            Adopt {pet.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="fas fa-phone fa-3x text-primary mb-3"></i>
            <h4>Ready to adopt {pet.name}?</h4>
            <p className="text-muted mb-3">
              Contact us to start the adoption process!
            </p>
            <div className="d-grid gap-2">
              <Button 
                as={Link} 
                to="/contact" 
                variant="success" 
                size="lg"
                onClick={() => setShowContactModal(false)}
              >
                <i className="fas fa-envelope me-2"></i>
                Contact Us
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => setShowContactModal(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .pet-image-container {
          height: 250px;
          position: relative;
          overflow: hidden;
          border-radius: 0.375rem;
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .pet-image-container {
            height: 200px;
          }
        }
        
        @media (max-width: 576px) {
          .pet-image-container {
            height: 180px;
          }
        }
        
        .pet-image-container:hover img {
          transform: scale(1.02);
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default PetDetail;