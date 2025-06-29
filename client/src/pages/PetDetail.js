// client/src/pages/PetDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import PetImage from '../components/PetImage';
import api from '../services/api';

const PetDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const response = await api.get(`/pets/${id}`);
        setPet(response.data.data);
      } catch (error) {
        setError('Pet not found');
        console.error('Error fetching pet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const refreshPet = async () => {
    try {
      const response = await api.get(`/pets/${id}`);
      setPet(response.data.data);
    } catch (error) {
      console.error('Error refreshing pet:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) return;
    
    try {
      await api.post(`/pets/${id}/vote`, { voteType });
      refreshPet(); // Refresh pet data
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleRating = async (e) => {
    e.preventDefault();
    if (!user || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      await api.post(`/pets/${id}/rate`, { rating, comment });
      setComment('');
      refreshPet(); // Refresh pet data
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Helper function to format price
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price;
  };

  // Helper function to get pet type display name
  const getPetTypeDisplay = (type) => {
    const typeNames = {
      'small-pet': 'Small Pet',
      'supply': 'Pet Supply'
    };
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Loading state - simple and clean
  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '80px' }}>
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Loading pet details...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading pet information...</p>
      </Container>
    );
  }

  // Error state - helpful but not overwhelming
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
            <Link to="/browse" className="btn btn-primary">
              <i className="fas fa-th me-2"></i>
              Browse All Pets
            </Link>
            <Link to="/" className="btn btn-outline-primary">
              <i className="fas fa-home me-2"></i>
              Go Home
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  // Calculate days since posted
  const daysSincePosted = Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24));

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">
              <i className="fas fa-home"></i> Home
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
        {/* Pet Image - Hero of the page */}
        <Col md={6} className="mb-4">
          <div className="position-relative">
            <Card className="border-0 shadow-sm">
              <div style={{ height: '500px', position: 'relative' }}>
                <PetImage
                  petType={pet.type}
                  imagePath={pet.image}
                  alt={`${pet.name} - ${pet.breed}`}
                  className="w-100 h-100"
                  size="large"
                  style={{ borderRadius: '0.375rem', objectFit: 'cover' }}
                />
              </div>
            </Card>
            
            {/* Status Badges on Image */}
            <div className="position-absolute top-0 end-0 m-3">
              <Badge 
                bg={pet.available ? 'success' : 'secondary'} 
                className="fs-6 px-3 py-2 shadow"
              >
                <i className={`fas ${pet.available ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                {pet.available ? 'Available' : 'Adopted'}
              </Badge>
            </div>

            {/* New Badge */}
            {daysSincePosted <= 7 && (
              <div className="position-absolute top-0 start-0 m-3">
                <Badge bg="warning" text="dark" className="px-3 py-2 shadow">
                  <i className="fas fa-star me-1"></i>
                  {daysSincePosted === 0 ? 'New Today!' : `${daysSincePosted} days ago`}
                </Badge>
              </div>
            )}
          </div>
        </Col>
        
        {/* Pet Details - Clean and focused */}
        <Col md={6}>
          {/* Pet Name and Price - The main focus */}
          <div className="mb-4">
            <h1 className="display-5 mb-2">{pet.name}</h1>
            <h2 className="text-success mb-3">
              <i className="fas fa-tag me-2"></i>
              {formatPrice(pet.price)}
            </h2>
            
            {/* Tags */}
            {pet.tags && pet.tags.length > 0 && (
              <div className="mb-3">
                {pet.tags.map((tag, index) => (
                  <Badge key={index} bg="light" text="dark" className="me-2 mb-1">
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
                      <strong>Gender:</strong> {pet.gender}
                    </div>
                  )}
                  <div className="mb-3">
                    <i className="fas fa-calendar text-primary me-2"></i>
                    <strong>Posted:</strong> {new Date(pet.createdAt).toLocaleDateString()}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Description */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-file-alt me-2"></i>
                About {pet.name}
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-0">{pet.description}</p>
            </Card.Body>
          </Card>
          
          {/* Voting Section */}
          {user && (
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="fas fa-thumbs-up me-2"></i>
                  Rate This Pet
                </h6>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    onClick={() => handleVote('up')}
                    disabled={!pet.available}
                    className="flex-fill"
                  >
                    <i className="fas fa-thumbs-up me-1"></i>
                    Upvote ({pet.votes?.up || 0})
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => handleVote('down')}
                    disabled={!pet.available}
                    className="flex-fill"
                  >
                    <i className="fas fa-thumbs-down me-1"></i>
                    Downvote ({pet.votes?.down || 0})
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Primary Actions */}
          <div className="d-grid gap-2">
            <Link 
              to={`/contact?pet=${pet.name}&id=${pet._id}`} 
              className="btn btn-primary btn-lg"
            >
              <i className="fas fa-envelope me-2"></i>
              Contact About {pet.name}
            </Link>
            
            {pet.available && (
              <Link 
                to={`/adopt/${pet._id}`} 
                className="btn btn-success btn-lg"
              >
                <i className="fas fa-heart me-2"></i>
                Start Adoption Process
              </Link>
            )}
            
            <Link to="/browse" className="btn btn-outline-primary">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Browse
            </Link>
          </div>
        </Col>
      </Row>
      
      {/* Ratings & Reviews Section */}
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
                      <div className="display-4 text-warning">{pet.averageRating || 'N/A'}</div>
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fas fa-star text-warning me-1"></i>
                          Rating
                        </Form.Label>
                        <Form.Select 
                          value={rating} 
                          onChange={(e) => setRating(parseInt(e.target.value))}
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Excellent</option>
                          <option value={4}>⭐⭐⭐⭐ 4 Stars - Very Good</option>
                          <option value={3}>⭐⭐⭐ 3 Stars - Good</option>
                          <option value={2}>⭐⭐ 2 Stars - Fair</option>
                          <option value={1}>⭐ 1 Star - Poor</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fas fa-comment me-1"></i>
                          Comment (Optional)
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={`Share your thoughts about ${pet.name}...`}
                        />
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={submittingRating}
                        className="w-100"
                      >
                        {submittingRating ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Submitting Review...
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
                <Alert variant="info" className="mb-4">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  <Link to="/login">Sign in</Link> to leave a review for {pet.name}.
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
  );
};

export default PetDetail;