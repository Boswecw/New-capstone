// AdminPets.js - UPDATED VERSION USING SAFEIMAGE

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Form, 
  Alert,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import api from '../../services/api';

const AdminPets = () => {
  // State management
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    featured: 'all'
  });

  // Helper function to safely pick the best image URL
  const getPetImageUrl = (pet) => {
    // prefer explicit CDN url, else single string, else first of array
    const raw = pet.imageUrl || pet.image || (Array.isArray(pet.images) && pet.images.length ? pet.images[0] : "");
    if (!raw) return ""; // SafeImage will show placeholder
    
    // If server already sends absolute, use it; otherwise hand it to the images resolver
    const isAbsolute = /^https?:\/\//i.test(raw);
    return isAbsolute ? raw : `/api/images/resolve?src=${encodeURIComponent(raw)}`;
  };

  // Load pets on component mount and when filter changes
  useEffect(() => {
    const loadPetsData = async () => {
      try {
        setLoading(true);
        setError('');

        // Build query parameters
        const params = new URLSearchParams();
        if (filter.status !== 'all') params.append('status', filter.status);
        if (filter.type !== 'all') params.append('type', filter.type);
        if (filter.featured !== 'all') params.append('featured', filter.featured === 'true');
        
        const response = await api.get(`/api/pets?${params.toString()}`);
        
        if (response.data.success) {
          setPets(response.data.data || []);
          console.log('✅ Loaded', response.data.data.length, 'pets for admin');
        } else {
          throw new Error(response.data.message || 'Failed to load pets');
        }
      } catch (err) {
        console.error('❌ Admin pets load error:', err);
        setError(err.message || 'Failed to load pets');
        setPets([]);
      } finally {
        setLoading(false);
      }
    };

    loadPetsData();
  }, [filter]);

  // Separate loadPets function for manual refresh
  const loadPets = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.featured !== 'all') params.append('featured', filter.featured === 'true');
      
      const response = await api.get(`/api/pets?${params.toString()}`);
      
      if (response.data.success) {
        setPets(response.data.data || []);
        console.log('✅ Manually refreshed', response.data.data.length, 'pets for admin');
      } else {
        throw new Error(response.data.message || 'Failed to load pets');
      }
    } catch (err) {
      console.error('❌ Admin pets manual refresh error:', err);
      setError(err.message || 'Failed to load pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (petId, newStatus) => {
    try {
      const response = await api.patch(`/api/pets/${petId}`, { status: newStatus });
      
      if (response.data.success) {
        // Update local state
        setPets(pets.map(pet => 
          pet._id === petId ? { ...pet, status: newStatus } : pet
        ));
        console.log('✅ Pet status updated:', petId, newStatus);
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('❌ Status update error:', err);
      setError(`Failed to update pet status: ${err.message}`);
    }
  };

  const handleFeaturedToggle = async (petId, currentFeatured) => {
    try {
      const newFeatured = !currentFeatured;
      const response = await api.patch(`/api/pets/${petId}`, { featured: newFeatured });
      
      if (response.data.success) {
        setPets(pets.map(pet => 
          pet._id === petId ? { ...pet, featured: newFeatured } : pet
        ));
        console.log('✅ Pet featured status updated:', petId, newFeatured);
      } else {
        throw new Error(response.data.message || 'Failed to update featured status');
      }
    } catch (err) {
      console.error('❌ Featured update error:', err);
      setError(`Failed to update featured status: ${err.message}`);
    }
  };

  const handleViewDetails = (pet) => {
    setSelectedPet(pet);
    setShowModal(true);
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/pets/${petId}`);
      
      if (response.data.success) {
        setPets(pets.filter(pet => pet._id !== petId));
        console.log('✅ Pet deleted:', petId);
      } else {
        throw new Error(response.data.message || 'Failed to delete pet');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(`Failed to delete pet: ${err.message}`);
    }
  };

  // Helper functions
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'pending': return 'warning';
      case 'adopted': return 'info';
      case 'not-available': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading pets...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">
                  <i className="fas fa-paw me-2 text-primary"></i>
                  Pet Management
                </h4>
                <small className="text-muted">
                  {pets.length} pet{pets.length !== 1 ? 's' : ''} found
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  as={Link} 
                  to="/admin/pets/add"
                  size="sm"
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Pet
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={loadPets}
                  size="sm"
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  Refresh
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filter.status}
                    onChange={(e) => setFilter({...filter, status: e.target.value})}
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="adopted">Adopted</option>
                    <option value="not-available">Not Available</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filter.type}
                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                  >
                    <option value="all">All Types</option>
                    <option value="dog">Dogs</option>
                    <option value="cat">Cats</option>
                    <option value="bird">Birds</option>
                    <option value="fish">Fish</option>
                    <option value="rabbit">Rabbits</option>
                    <option value="hamster">Hamsters</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filter.featured}
                    onChange={(e) => setFilter({...filter, featured: e.target.value})}
                  >
                    <option value="all">All Pets</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Not Featured</option>
                  </Form.Select>
                </Col>
              </Row>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Pets Table */}
              {pets.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No pets found</h5>
                  <p className="text-muted">Try adjusting your filters or add a new pet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '80px' }}>Image</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Breed</th>
                        <th>Age</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Created</th>
                        <th style={{ width: '140px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pets.map((pet) => (
                        <tr key={pet._id}>
                          {/* Use SafeImage instead of raw img */}
                          <td>
                            <div style={{ width: 60, height: 60 }}>
                              <SafeImage
                                alt={pet.name}
                                src={getPetImageUrl(pet)}
                                size="small"
                                className="rounded"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{pet.name}</strong>
                              {pet._id && (
                                <div className="small text-muted">
                                  ID: {pet._id.slice(-6)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg="secondary" className="text-capitalize">
                              {pet.type}
                            </Badge>
                          </td>
                          <td>{pet.breed || 'N/A'}</td>
                          <td>{pet.age || 'N/A'}</td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant={getStatusBadgeVariant(pet.status)}
                                size="sm"
                                className="text-capitalize"
                              >
                                {pet.status}
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item 
                                  onClick={() => handleStatusChange(pet._id, 'available')}
                                >
                                  Available
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleStatusChange(pet._id, 'pending')}
                                >
                                  Pending
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleStatusChange(pet._id, 'adopted')}
                                >
                                  Adopted
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleStatusChange(pet._id, 'not-available')}
                                >
                                  Not Available
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                          <td>
                            <Form.Check
                              type="switch"
                              checked={pet.featured || false}
                              onChange={() => handleFeaturedToggle(pet._id, pet.featured)}
                            />
                          </td>
                          <td>{formatDate(pet.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewDetails(pet)}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                as={Link}
                                to={`/admin/pets/edit/${pet._id}`}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeletePet(pet._id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pet Details Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-paw me-2 text-primary"></i>
            Pet Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPet && (
            <Row>
              <Col md={4}>
                {/* Use SafeImage with helper function in modal */}
                <SafeImage
                  alt={selectedPet.name}
                  src={getPetImageUrl(selectedPet)}
                  size="large"
                  className="rounded w-100"
                  style={{ objectFit: 'cover' }}
                />
              </Col>
              <Col md={8}>
                <h5>{selectedPet.name}</h5>
                <div className="mb-3">
                  <Badge bg={getStatusBadgeVariant(selectedPet.status)} className="me-2">
                    {selectedPet.status}
                  </Badge>
                  {selectedPet.featured && (
                    <Badge bg="warning">
                      <i className="fas fa-star me-1"></i>
                      Featured
                    </Badge>
                  )}
                </div>
                
                <Row className="mb-3">
                  <Col sm={6}>
                    <strong>Type:</strong> {selectedPet.type}
                  </Col>
                  <Col sm={6}>
                    <strong>Breed:</strong> {selectedPet.breed || 'N/A'}
                  </Col>
                  <Col sm={6}>
                    <strong>Age:</strong> {selectedPet.age || 'N/A'}
                  </Col>
                  <Col sm={6}>
                    <strong>Gender:</strong> {selectedPet.gender || 'N/A'}
                  </Col>
                  <Col sm={6}>
                    <strong>Size:</strong> {selectedPet.size || 'N/A'}
                  </Col>
                  <Col sm={6}>
                    <strong>Color:</strong> {selectedPet.color || 'N/A'}
                  </Col>
                </Row>

                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedPet.description || 'No description available.'}</p>
                </div>

                {selectedPet.personalityTraits && selectedPet.personalityTraits.length > 0 && (
                  <div className="mb-3">
                    <strong>Personality Traits:</strong>
                    <div className="mt-1">
                      {selectedPet.personalityTraits.map((trait, index) => (
                        <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="small text-muted">
                  <div><strong>Created:</strong> {formatDate(selectedPet.createdAt)}</div>
                  <div><strong>Updated:</strong> {formatDate(selectedPet.updatedAt)}</div>
                  <div><strong>ID:</strong> {selectedPet._id}</div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            as={Link} 
            to={`/admin/pets/edit/${selectedPet?._id}`}
            onClick={() => setShowModal(false)}
          >
            Edit Pet
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPets;