import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import PetCard from '../components/PetCard';
import api from '../services/api';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchPets();
  }, [filters]);

  const fetchPets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/pets?${params.toString()}`);
      setPets(response.data.data);
    } catch (error) {
      setError('Error fetching pets. Please try again.');
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVote = (petId, voteType) => {
    setPets(prev => prev.map(pet => {
      if (pet._id === petId) {
        const newPet = { ...pet };
        if (voteType === 'up') {
          newPet.votes = { ...newPet.votes, up: (newPet.votes?.up || 0) + 1 };
        } else {
          newPet.votes = { ...newPet.votes, down: (newPet.votes?.down || 0) + 1 };
        }
        return newPet;
      }
      return pet;
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      size: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: 'newest'
    });
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <h2 className="text-center mb-4">Browse All Pets</h2>
      
      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Form className="p-3 bg-light rounded">
            <Row className="g-3">
              <Col md={2}>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                  <option value="fish">Fish</option>
                  <option value="bird">Birds</option>
                  <option value="small-pet">Small Pets</option>
                  <option value="supply">Supplies</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Label>Size</Form.Label>
                <Form.Select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="">Any Size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </Form.Select>
              </Col>
              
              <Col md={1}>
                <Form.Label>Min Price</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </Col>
              
              <Col md={1}>
                <Form.Label>Max Price</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="$999"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </Col>
              
              <Col md={2}>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </Form.Select>
              </Col>
              
              <Col md={3}>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search pets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Col>
              
              <Col md={1} className="d-flex align-items-end">
                <Button variant="outline-secondary" onClick={clearFilters}>
                  Clear
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Results */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="loading-spinner">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <span className="text-muted">
              {pets.length} pet{pets.length !== 1 ? 's' : ''} found
            </span>
          </div>
          
          <Row className="g-4">
            {pets.map(pet => (
              <Col key={pet._id} sm={6} md={4} lg={3}>
                <PetCard pet={pet} onVote={handleVote} />
              </Col>
            ))}
          </Row>
          
          {pets.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4>No pets found</h4>
              <p className="text-muted">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Browse;