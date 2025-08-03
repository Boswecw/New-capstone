// client/src/pages/Profile.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserPets = async () => {
      try {
        if (user) {
          const response = await api.get('/pets/user/pets');
          setUserPets(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching user pets:', error);
        setError('Failed to load your pets');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPets();
  }, [user]);

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

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '80px' }}>
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-user me-2"></i>
                Profile Information
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Name:</strong> {user?.name || 'Not provided'}
              </div>
              <div className="mb-3">
                <strong>Email:</strong> {user?.email}
              </div>
              <div className="mb-3">
                <strong>Role:</strong> 
                <Badge bg={user?.role === 'admin' ? 'danger' : 'primary'} className="ms-2">
                  {user?.role || 'user'}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Member Since:</strong> {new Date(user?.createdAt).toLocaleDateString()}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>
                Your Pet Listings ({userPets.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {userPets.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-paw fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">No pets listed yet</h6>
                  <p className="text-muted">Start by adding a pet to your collection!</p>
                  <Link to="/pets" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Browse Pets
                  </Link>
                </div>
              ) : (
                <Row>
                  {userPets.map((pet) => (
                    <Col md={6} lg={4} key={pet._id} className="mb-3">
                      <Card className="h-100 shadow-sm">
                        <div style={{ height: '200px', overflow: 'hidden' }}>
                          <Card.Img
                            variant="top"
                            src={`https://storage.googleapis.com/furbabies-petstore/${pet.image}`}
                            alt={pet.name}
                            style={{ 
                              height: '100%', 
                              width: '100%', 
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Pet+Image';
                            }}
                          />
                          <div className="position-absolute top-0 end-0 p-2">
                            <Badge bg={pet.available ? 'success' : 'secondary'}>
                              {pet.available ? 'Available' : 'Adopted'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="h6 mb-2">{pet.name}</Card.Title>
                          <Card.Text className="text-muted small mb-2">{pet.breed}</Card.Text>
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong className="text-success">{formatPrice(pet.price)}</strong>
                              <small className="text-muted">{pet.age}</small>
                            </div>
                            <div className="d-grid gap-2">
                              {/* ✅ FIXED: Changed from /pet/ to /pets/ to match App.js routing */}
                              <Link 
                                to={`/pets/${pet._id}`} 
                                className="btn btn-primary btn-sm"
                              >
                                <i className="fas fa-eye me-1"></i>
                                View Details
                              </Link>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;