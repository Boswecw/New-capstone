// client/src/pages/admin/AdminPets.js - FIXED IMAGE IMPORTS
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils'; // ✅ FIXED: Use consolidated utility

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, pet: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await petAPI.get('/', {
        params: {
          limit: 50,
          sort: 'newest'
        }
      });

      const petData = response.data?.pets || response.data?.data || [];
      setPets(petData);
      console.log('✅ Loaded pets for admin:', petData.length);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pet) => {
    setDeleteModal({ show: true, pet });
  };

  const confirmDelete = async () => {
    if (!deleteModal.pet) return;
    
    try {
      setDeleting(true);
      await petAPI.delete(`/${deleteModal.pet._id}`);
      
      // Remove from local state
      setPets(pets.filter(p => p._id !== deleteModal.pet._id));
      setDeleteModal({ show: false, pet: null });
      
      console.log('✅ Pet deleted successfully');
    } catch (error) {
      console.error('Error deleting pet:', error);
      setError('Failed to delete pet. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusToggle = async (pet) => {
    try {
      const newStatus = pet.status === 'available' ? 'adopted' : 'available';
      
      const response = await petAPI.patch(`/${pet._id}`, {
        status: newStatus
      });

      if (response.data?.success) {
        // Update local state
        setPets(pets.map(p => 
          p._id === pet._id ? { ...p, status: newStatus } : p
        ));
        console.log(`✅ Pet status updated: ${pet.name} -> ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating pet status:', error);
      setError('Failed to update pet status.');
    }
  };

  // Filter pets based on search and filter criteria
  const filteredPets = pets.filter(pet => {
    const matchesSearch = search === '' || 
      pet.name?.toLowerCase().includes(search.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(search.toLowerCase()) ||
      pet.type?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' ||
      (filter === 'available' && pet.status === 'available') ||
      (filter === 'adopted' && pet.status === 'adopted') ||
      (filter === 'pending' && pet.status === 'pending') ||
      (filter === 'featured' && pet.featured);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading pets...</span>
          </Spinner>
          <p className="mt-2">Loading pets...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold">
                <i className="fas fa-paw me-2 text-primary"></i>
                Manage Pets ({pets.length})
              </h2>
              <p className="text-muted">Manage pet listings and adoption status</p>
            </div>
            <Link to="/admin/pets/new" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Add New Pet
            </Link>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Pets</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name, breed, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Status</Form.Label>
            <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Pets ({pets.length})</option>
              <option value="available">Available ({pets.filter(p => p.status === 'available').length})</option>
              <option value="adopted">Adopted ({pets.filter(p => p.status === 'adopted').length})</option>
              <option value="pending">Pending ({pets.filter(p => p.status === 'pending').length})</option>
              <option value="featured">Featured ({pets.filter(p => p.featured).length})</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group>
            <Form.Label>&nbsp;</Form.Label>
            <Button variant="outline-secondary" className="w-100" onClick={fetchPets}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </Form.Group>
        </Col>
      </Row>

      {/* Pets Table */}
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover className="bg-white">
              <thead className="table-dark">
                <tr>
                  <th>Image</th>
                  <th>Pet Details</th>
                  <th>Type</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Hearts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.length > 0 ? (
                  filteredPets.map(pet => (
                    <tr key={pet._id}>
                      <td>
                        <img
                          src={getImageUrl(pet.image || pet.imageUrl, 'pet', pet.type) || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&h=60&fit=crop&q=80'}
                          alt={pet.name}
                          className="rounded"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover' 
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&h=60&fit=crop&q=80';
                          }}
                        />
                      </td>
                      <td>
                        <strong>{pet.name}</strong>
                        <br />
                        <small className="text-muted">ID: {pet._id?.slice(-8)}</small>
                      </td>
                      <td>
                        <Badge bg="info" className="text-capitalize">
                          {pet.type || 'Unknown'}
                        </Badge>
                      </td>
                      <td>{pet.breed || 'Mixed'}</td>
                      <td>{pet.age || 'Unknown'}</td>
                      <td>
                        <Badge bg={
                          pet.status === 'available' ? 'success' :
                          pet.status === 'adopted' ? 'primary' :
                          pet.status === 'pending' ? 'warning' : 'secondary'
                        }>
                          <i className={`fas fa-${
                            pet.status === 'available' ? 'check-circle' :
                            pet.status === 'adopted' ? 'heart' :
                            pet.status === 'pending' ? 'clock' : 'question-circle'
                          } me-1`}></i>
                          {pet.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td>
                        {pet.featured ? (
                          <Badge bg="warning" text="dark">
                            <i className="fas fa-star me-1"></i>
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {pet.hearts ? (
                          <span className="text-danger">
                            <i className="fas fa-heart me-1"></i>
                            {pet.hearts}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            to={`/pets/${pet._id}`}
                            className="btn btn-outline-info"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={`/admin/pets/${pet._id}/edit`}
                            className="btn btn-outline-primary"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleStatusToggle(pet)}
                            title="Toggle Status"
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(pet)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-search fa-2x mb-2"></i>
                        <p>
                          {search || filter !== 'all' 
                            ? 'No pets match your current filters' 
                            : 'No pets found. Add some pets to get started!'}
                        </p>
                        {(search || filter !== 'all') && (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => {
                              setSearch('');
                              setFilter('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Summary Stats */}
      <Row className="mt-4">
        <Col>
          <div className="bg-light p-3 rounded">
            <Row className="text-center">
              <Col md={3}>
                <strong className="text-primary">{pets.filter(p => p.status === 'available').length}</strong>
                <br />
                <small className="text-muted">Available</small>
              </Col>
              <Col md={3}>
                <strong className="text-success">{pets.filter(p => p.status === 'adopted').length}</strong>
                <br />
                <small className="text-muted">Adopted</small>
              </Col>
              <Col md={3}>
                <strong className="text-warning">{pets.filter(p => p.featured).length}</strong>
                <br />
                <small className="text-muted">Featured</small>
              </Col>
              <Col md={3}>
                <strong className="text-info">{pets.reduce((sum, pet) => sum + (pet.hearts || 0), 0)}</strong>
                <br />
                <small className="text-muted">Total Hearts</small>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, pet: null })}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteModal.pet && (
            <>
              <p>Are you sure you want to delete <strong>{deleteModal.pet.name}</strong>?</p>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                This action cannot be undone. The pet will be permanently removed from the system.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, pet: null })}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash me-2"></i>
                Delete Pet
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPets;