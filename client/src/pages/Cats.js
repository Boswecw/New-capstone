import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import api from '../services/api';

const Cats = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCats();
  }, []);

  const fetchCats = async () => {
    try {
      const response = await api.get('/pets/type/cat');
      setCats(response.data.data);
    } catch (error) {
      setError('Error fetching cats. Please try again.');
      console.error('Error fetching cats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (petId, voteType) => {
    setCats(prev => prev.map(cat => {
      if (cat._id === petId) {
        const newCat = { ...cat };
        if (voteType === 'up') {
          newCat.votes = { ...newCat.votes, up: (newCat.votes?.up || 0) + 1 };
        } else {
          newCat.votes = { ...newCat.votes, down: (newCat.votes?.down || 0) + 1 };
        }
        return newCat;
      }
      return cat;
    }));
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="furbabies-banner">
        <Container>
          <Row className="justify-content-center align-items-center">
            <Col xs={12} md={10}>
              <h1 className="hero-title">
                <i className="fas fa-cat me-2"></i>
                Cats Available for Adoption
              </h1>
              <p className="hero-subtitle">
                <i className="fas fa-heart me-2"></i>Find Your Perfect Feline Friend
              </p>
              <Link to="/browse" className="btn btn-lg btn-light px-4 py-2">
                <i className="fas fa-search me-2"></i>Browse All Pets
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Cats Section */}
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2 className="text-center mb-3">
              <i className="fas fa-paw me-2"></i>Available Cats
            </h2>
            <p className="text-center text-muted">
              All our cats are healthy, socialized, and ready for loving homes.
            </p>
          </Col>
        </Row>

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
                {cats.length} cat{cats.length !== 1 ? 's' : ''} available for adoption
              </span>
            </div>
            
            <Row className="g-4">
              {cats.map(cat => (
                <Col key={cat._id} sm={6} md={4} lg={3}>
                  <PetCard pet={cat} onVote={handleVote} />
                </Col>
              ))}
            </Row>
            
            {cats.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-cat fa-3x text-muted mb-3"></i>
                <h4>No cats available</h4>
                <p className="text-muted">Check back soon for new arrivals!</p>
                <Link to="/browse" className="btn btn-primary">
                  Browse All Pets
                </Link>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default Cats;