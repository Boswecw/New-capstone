// ===== 5. client/src/pages/admin/AdminPets.js (COMPLETE UPDATED FILE) =====
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI } from '../../services/api';
import { normalizeImageUrl } from '../../utils/image';

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await petAPI.get('/', {
        params: {
          limit: 50,
          sort: 'newest'
        }
      });
      setPets(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setError('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await petAPI.delete(`/${petId}`);
        setPets(pets.filter(pet => pet._id !== petId));
      } catch (error) {
        console.error('Error deleting pet:', error);
        setError('Failed to delete pet');
      }
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name?.toLowerCase().includes(search.toLowerCase()) ||
                         pet.breed?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || pet.status === filter;
    return matchesSearch && matchesFilter;
  });

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
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-bold">
              <i className="fas fa-paw me-2 text-primary"></i>
              Manage Pets
            </h2>
            <Link to="/admin/pets/new" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Add New Pet
            </Link>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search pets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="adopted">Adopted</option>
            <option value="pending">Pending</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Pets Table */}
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.length > 0 ? (
                  filteredPets.map(pet => (
                    <tr key={pet._id}>
                      <td>
                        <img
                          src={normalizeImageUrl(pet.image || pet.imageUrl) || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&h=60&fit=crop&q=80'}
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
                        <small className="text-muted">ID: {pet._id.slice(-8)}</small>
                      </td>
                      <td>
                        <Badge bg="info">{pet.type}</Badge>
                      </td>
                      <td>{pet.breed || 'Mixed'}</td>
                      <td>{pet.age || 'Unknown'}</td>
                      <td>
                        <Badge bg={
                          pet.status === 'available' ? 'success' :
                          pet.status === 'adopted' ? 'primary' :
                          pet.status === 'pending' ? 'warning' : 'secondary'
                        }>
                          {pet.status}
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
                        <div className="btn-group btn-group-sm">
                          <Link 
                            to={`/pets/${pet._id}`} 
                            className="btn btn-outline-primary"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link 
                            to={`/admin/pets/${pet._id}/edit`} 
                            className="btn btn-outline-warning"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(pet._id)}
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
                    <td colSpan="8" className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-search fa-2x mb-3"></i>
                        <p>No pets found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPets;