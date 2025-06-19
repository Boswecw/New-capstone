import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data.data);
    } catch (error) {
      setError('Error loading profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/users/favorites');
      setFavorites(response.data.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
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
      fetchProfile(); // Refresh profile data
    } catch (error) {
      setError('Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
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

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h3><i className="fas fa-user me-2"></i>My Profile</h3>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile?.username || ''}
                        disabled
                      />
                      <Form.Text className="text-muted">Username cannot be changed</Form.Text>
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
                      <Form.Text className="text-muted">Email cannot be changed</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        defaultValue={profile?.profile?.firstName || ''}
                        placeholder="First Name"
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
                        placeholder="Last Name"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    defaultValue={profile?.profile?.phone || ''}
                    placeholder="Phone Number"
                  />
                </Form.Group>

                <h5 className="mt-4 mb-3">Address</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    defaultValue={profile?.profile?.address?.street || ''}
                    placeholder="Street Address"
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
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
                  <Col md={4}>
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
                        placeholder="ZIP Code"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="primary" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Favorites Section */}
          <Card className="mt-4">
            <Card.Header>
              <h4><i className="fas fa-heart me-2"></i>Favorite Pets ({favorites.length})</h4>
            </Card.Header>
            <Card.Body>
              {favorites.length === 0 ? (
                <p className="text-muted">You haven't added any pets to your favorites yet.</p>
              ) : (
                <Row className="g-3">
                  {favorites.map(pet => (
                    <Col key={pet._id} md={6} lg={4}>
                      <Card className="h-100">
                        <Card.Img variant="top" src={pet.image} alt={pet.name} style={{ height: '150px', objectFit: 'contain' }} />
                        <Card.Body>
                          <Card.Title className="h6">{pet.name}</Card.Title>
                          <Card.Text className="small">{pet.breed}</Card.Text>
                          <div className="price">${pet.price}</div>
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