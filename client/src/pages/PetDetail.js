import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
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
    fetchPet();
  }, [id]);

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

  const handleVote = async (voteType) => {
    if (!user) return;
    
    try {
      await api.post(`/pets/${id}/vote`, { voteType });
      fetchPet(); // Refresh pet data
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
      fetchPet(); // Refresh pet data
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '80px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !pet) {
    return (
      <Container className="py-5" style={{ marginTop: '80px' }}>
        <Alert variant="danger">
          <h4>Pet Not Found</h4>
          <p>The pet you're looking for doesn't exist or has been removed.</p>
          <Link to="/browse" className="btn btn-primary">
            Browse All Pets
          </Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Img 
              variant="top" 
              src={pet.image} 
              alt={pet.name}
              style={{ height: '400px', objectFit: 'contain' }}
            />
          </Card>
        </Col>
        
        <Col md={6}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h1>{pet.name}</h1>
            <Badge bg={pet.available ? 'success' : 'secondary'} className="fs-6">
              {pet.available ? 'Available' : 'Adopted'}
            </Badge>
          </div>
          
          <h3 className="text-success mb-3">
            ${typeof pet.price === 'number' ? pet.price.toLocaleString() : pet.price}
          </h3>
          
          <Card className="mb-3">
            <Card.Body>
              <Row>
                <Col sm={6}>
                  <p><strong>Type:</strong> {pet.type}</p>
                  <p><strong>Breed:</strong> {pet.breed}</p>
                  <p><strong>Age:</strong> {pet.age}</p>
                </Col>
                <Col sm={6}>
                  {pet.size && <p><strong>Size:</strong> {pet.size}</p>}
                  {pet.gender && <p><strong>Gender:</strong> {pet.gender}</p>}
                  <p><strong>Posted:</strong> {new Date(pet.createdAt).toLocaleDateString()}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Description</Card.Title>
              <Card.Text>{pet.description}</Card.Text>
            </Card.Body>
          </Card>
          
          {/* Voting */}
          {user && (
            <div className="d-flex gap-2 mb-3">
              <Button
                variant="outline-success"
                onClick={() => handleVote('up')}
                disabled={!pet.available}
              >
                <i className="fas fa-thumbs-up me-1"></i>
                Upvote ({pet.votes?.up || 0})
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => handleVote('down')}
                disabled={!pet.available}
              >
                <i className="fas fa-thumbs-down me-1"></i>
                Downvote ({pet.votes?.down || 0})
              </Button>
            </div>
          )}
          
          {/* Contact Button */}
          <Link to="/contact" className="btn btn-primary btn-lg">
            <i className="fas fa-envelope me-2"></i>
            Contact About {pet.name}
          </Link>
        </Col>
      </Row>
      
      {/* Ratings Section */}
      <Row className="mt-5">
        <Col>
          <h3>Ratings & Reviews</h3>
          
          {pet.ratings && pet.ratings.length > 0 && (
            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="display-6 me-3">{pet.averageRating}</div>
                <div>
                  <div>
                    {[...Array(5)].map((_, i) => (
                      <i 
                        key={i}
                        className={`fas fa-star ${i < Math.floor(pet.averageRating) ? 'text-warning' : 'text-muted'}`}
                      ></i>
                    ))}
                  </div>
                  <small className="text-muted">
                    Based on {pet.ratings.length} review{pet.ratings.length !== 1 ? 's' : ''}
                  </small>
                </div>
              </div>
            </div>
          )}
          
          {/* Add Rating Form */}
          {user && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Leave a Review</Card.Title>
                <Form onSubmit={handleRating}>
                  <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <Form.Select 
                      value={rating} 
                      onChange={(e) => setRating(parseInt(e.target.value))}
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Very Good</option>
                      <option value={3}>3 Stars - Good</option>
                      <option value={2}>2 Stars - Fair</option>
                      <option value={1}>1 Star - Poor</option>
                    </Form.Select>
                  </Form.Group>
                  
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
                  
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={submittingRating}
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}
          
          {/* Display Reviews */}
          {pet.ratings && pet.ratings.map((review, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong>{review.user?.username || 'Anonymous'}</strong>
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i}
                          className={`fas fa-star ${i < review.rating ? 'text-warning' : 'text-muted'}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <small className="text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </small>
                </div>
                {review.comment && <Card.Text>{review.comment}</Card.Text>}
              </Card.Body>
            </Card>
          ))}
          
          {(!pet.ratings || pet.ratings.length === 0) && (
            <Alert variant="info">
              No reviews yet. Be the first to review {pet.name}!
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PetDetail;