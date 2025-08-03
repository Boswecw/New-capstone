// client/src/pages/Pets.js - Updated to use PetCard and card.module.css
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI } from '../services/api';
import PetCard from '../components/PetCard';
import styles from '../components/Card.module.css';

const Pets = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState({ totalPets: 0, availablePets: 0, adoptedPets: 0, featuredPets: 0 });

  const fetchFeaturedPets = useCallback(async () => {
    try {
      const response = await petAPI.getFeaturedPets(6);
      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
      }
    } catch (err) {
      console.error('❌ Error fetching featured pets:', err);
    }
  }, []);

  const fetchAllPets = useCallback(async () => {
    try {
      const queryParams = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (selectedType !== 'all') queryParams.type = selectedType;

      const response = await petAPI.getAllPets(queryParams);

      if (response.data?.success) {
        const pets = response.data.data || [];
        setAllPets(pets);

        const totalPets = pets.length;
        const availablePets = pets.filter(pet => !pet.adopted).length;
        const adoptedPets = pets.filter(pet => pet.adopted).length;
        const featuredPets = pets.filter(pet => pet.featured).length;

        setStats({ totalPets, availablePets, adoptedPets, featuredPets });
      }
    } catch (err) {
      console.error('❌ Error fetching pets:', err);
      setError('Unable to load pets. Please try again.');
    }
  }, [searchTerm, selectedType]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchFeaturedPets(), fetchAllPets()]);
      } catch (err) {
        setError('Unable to load pet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchFeaturedPets, fetchAllPets]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllPets();
  };

  const petTypes = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other'];

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-3 mb-3">
          <i className="fas fa-heart text-danger me-3"></i>
          Find Your Perfect Companion
        </h1>
        <p className="lead text-muted mb-4">
          Every pet deserves a loving home. Browse our wonderful animals looking for their forever families.
        </p>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end">
                <Col md={5} className="mb-2">
                  <Form.Group>
                    <Form.Label>Search Pets</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, breed, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-2">
                  <Form.Group>
                    <Form.Label>Pet Type</Form.Label>
                    <Form.Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      {petTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="mb-2">
                  <Button type="submit" variant="primary" className="w-100">
                    <i className="fas fa-search me-2"></i>Search
                  </Button>
                </Col>
                <Col md={2} className="mb-2">
                  <Button as={Link} to="/browse" variant="outline-secondary" className="w-100">
                    <i className="fas fa-filter me-2"></i>Advanced
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>

      <Row className="mb-5">
        {[{
          icon: 'paw', color: 'primary', label: 'Total Pets', value: stats.totalPets
        }, {
          icon: 'home', color: 'success', label: 'Available', value: stats.availablePets
        }, {
          icon: 'heart', color: 'info', label: 'Happy Homes', value: stats.adoptedPets
        }, {
          icon: 'star', color: 'warning', label: 'Featured', value: stats.featuredPets
        }].map((stat, idx) => (
          <Col md={3} key={idx} className="mb-3">
            <Card className="text-center h-100 shadow-sm">
              <Card.Body>
                <div className={`text-${stat.color} mb-2`}>
                  <i className={`fas fa-${stat.icon} fa-2x`}></i>
                </div>
                <h4 className={`text-${stat.color}`}>{loading ? '...' : stat.value}</h4>
                <p className="text-muted mb-0">{stat.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {error && <Alert variant="danger" className="mb-4"><i className="fas fa-exclamation-triangle me-2"></i>{error}</Alert>}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading our wonderful pets...</p>
        </div>
      )}

      {!loading && featuredPets.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-star text-warning me-2"></i>Featured Pets</h2>
            <Button as={Link} to="/browse?featured=true" variant="outline-primary">View All Featured</Button>
          </div>
          <Row>
            {featuredPets.map((pet) => (
              <Col key={pet._id} lg={4} md={6} className="mb-4">
                <PetCard pet={pet} showStatus className={styles.card} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {!loading && allPets.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-clock text-info me-2"></i>
              {searchTerm || selectedType !== 'all' ? 'Search Results' : 'Recent Additions'}</h2>
            <Button as={Link} to="/browse" variant="outline-primary">Browse All Pets</Button>
          </div>
          <Row>
            {allPets.slice(0, 8).map((pet) => (
              <Col key={pet._id} lg={3} md={4} sm={6} className="mb-4">
                <PetCard pet={pet} showStatus className={styles.card} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {!loading && (
        <Card className="bg-light text-center shadow-sm">
          <Card.Body className="py-5">
            <h3 className="mb-3">Ready to Find Your New Best Friend?</h3>
            <p className="lead text-muted mb-4">
              Browse our full collection of amazing pets or learn more about the adoption process.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link} to="/browse" variant="primary" size="lg">
                <i className="fas fa-search me-2"></i>Browse All Pets
              </Button>
              <Button as={Link} to="/about" variant="outline-primary" size="lg">
                <i className="fas fa-info-circle me-2"></i>Adoption Process
              </Button>
              <Button as={Link} to="/contact" variant="outline-secondary" size="lg">
                <i className="fas fa-envelope me-2"></i>Contact Us
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Pets;
