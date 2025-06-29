// client/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileAndFavorites = async () => {
      try {
        // Fetch profile data
        const profileResponse = await api.get('/users/profile');
        setProfile(profileResponse.data.data);

        // Fetch favorites data
        try {
          const favoritesResponse = await api.get('/users/favorites');
          setFavorites(favoritesResponse.data.data);
        } catch (favError) {
          console.error('Error fetching favorites:', favError);
          // Don't set error state for favorites failure, just log it
        }
      } catch (error) {
        setError('Error loading profile');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndFavorites();
  }, []);

  const refreshProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData(e.target);
      const updates = {
        profile: {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
          address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode')
          }
        }
      };

      await api.put('/users/profile', updates);
      setMessage('Profile updated successfully!');
      refreshProfile(); // Refresh profile data
    } catch (error) {
      setError('Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const removeFavorite = async (petId) => {
    try {
      await api.delete(`/users/favorites/${petId}`);
      setFavorites(favorites.filter(pet => pet._id !== petId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Helper function to format price
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price;
  };

  // Helper function to get member since date
  const getMemberSince = () => {
    if (profile?.createdAt) {
      return new Date(profile.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
    return 'Recently';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '80px' }}>
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading your profile...</p>
      </Container>
    );
  }

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
          <li className="breadcrumb-item active" aria-current="page">My Profile</li>
        </ol>
      </nav>

      <Row>
        <Col lg={8} className="mx-auto">
          {/* Profile Header */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <Row className="align-items-center">
                <Col>
                  <h3 className="mb-0">
                    <i className="fas fa-user me-2"></i>
                    {profile?.profile?.firstName && profile?.profile?.lastName 
                      ? `${profile.profile.firstName} ${profile.profile.lastName}`
                      : profile?.username || 'My Profile'
                    }
                  </h3>
                  <small>Member since {getMemberSince()}</small>
                </Col>
                <Col xs="auto">
                  <Badge bg="light" text="dark" className="fs-6">
                    <i className="fas fa-heart me-1"></i>
                    {favorites.length} Favorites
                  </Badge>
                </Col>
              </Row>
            </Card.Header>
          </Card>

          {/* Profile Form */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h4 className="mb-0">
                <i className="fas fa-edit me-2"></i>
                Profile Information
              </h4>
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant="success" dismissible onClose={() => setMessage('')}>
                  <i className="fas fa-check-circle me-2"></i>
                  {message}
                </Alert>
              )}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Account Information (Read-only) */}
                <h5 className="mb-3 text-muted">
                  <i className="fas fa-lock me-2"></i>
                  Account Information
                </h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile?.username || ''}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Username cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={profile?.email || ''}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <hr />

                {/* Personal Information (Editable) */}
                <h5 className="mb-3 text-muted">
                  <i className="fas fa-user-edit me-2"></i>
                  Personal Information
                </h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        defaultValue={profile?.profile?.firstName || ''}
                        placeholder="Enter your first name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        defaultValue={profile?.profile?.lastName || ''}
                        placeholder="Enter your last name"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    defaultValue={profile?.profile?.phone || ''}
                    placeholder="(555) 123-4567"
                  />
                </Form.Group>

                <hr />

                {/* Address Information */}
                <h5 className="mb-3 text-muted">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Address Information
                </h5>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    defaultValue={profile?.profile?.address?.street || ''}
                    placeholder="123 Main Street"
                  />
                </Form.Group>

                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        defaultValue={profile?.profile?.address?.city || ''}
                        placeholder="City"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        defaultValue={profile?.profile?.address?.state || ''}
                        placeholder="State"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        defaultValue={profile?.profile?.address?.zipCode || ''}
                        placeholder="12345"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Updating Profile...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Favorites Section */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-heart me-2"></i>
                  My Favorite Pets
                </h4>
                <Badge bg="dark" className="fs-6">
                  {favorites.length} {favorites.length === 1 ? 'Favorite' : 'Favorites'}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {favorites.length === 0 ? (
                <Alert variant="light" className="text-center">
                  <i className="fas fa-heart fa-2x text-muted mb-3 d-block"></i>
                  <h5>No favorites yet</h5>
                  <p className="mb-3">Start browsing pets and add them to your favorites!</p>
                  <Link to="/browse" className="btn btn-primary">
                    <i className="fas fa-search me-2"></i>
                    Browse Pets
                  </Link>
                </Alert>
              ) : (
                <Row className="g-3">
                  {favorites.map(pet => (
                    <Col key={pet._id} md={6} lg={4}>
                      <Card className="h-100 border-0 shadow-sm">
                        <div style={{ position: 'relative' }}>
                          <Card.Img 
                            variant="top" 
                            src={pet.image} 
                            alt={`${pet.name} - ${pet.breed}`}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          
                          {/* Remove from Favorites Button */}
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2"
                            onClick={() => removeFavorite(pet._id)}
                            title="Remove from favorites"
                          >
                            <i className="fas fa-heart-broken"></i>
                          </Button>

                          {/* Availability Badge */}
                          <div className="position-absolute bottom-0 start-0 m-2">
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
                              <Link 
                                to={`/pet/${pet._id}`} 
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