import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import api from '../services/api';

const Dogs = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await api.get('/pets/type/dog');
        setDogs(response.data.data);
      } catch (error) {
        setError('Error fetching dogs. Please try again.');
        console.error('Error fetching dogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDogs();
  }, []);

  const handleVote = (petId, voteType) => {
    setDogs(prev => prev.map(dog => {
      if (dog._id === petId) {
        const newDog = { ...dog };
        if (voteType === 'up') {
          newDog.votes = { ...newDog.votes, up: (newDog.votes?.up || 0) + 1 };
        } else {
          newDog.votes = { ...newDog.votes, down: (newDog.votes?.down || 0) + 1 };
        }
        return newDog;
      }
      return dog;
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
                <i className="fas fa-dog me-2"></i>
                Dogs Available for Adoption
              </h1>
              <p className="hero-subtitle">
                <i className="fas fa-heart me-2"></i>Find Your Perfect Canine Companion
              </p>
              <Link to="/browse" className="btn btn-lg btn-light px-4 py-2">
                <i className="fas fa-search me-2"></i>Browse All Pets
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Dogs Section */}
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2 className="text-center mb-3">
              <i className="fas fa-paw me-2"></i>Available Dogs
            </h2>
            <p className="text-center text-muted">
              All our dogs come from ethical sources and are ready for their forever homes.
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
                {dogs.length} dog{dogs.length !== 1 ? 's' : ''} available for adoption
              </span>
            </div>
            
            <Row className="g-4">
              {dogs.map(dog => (
                <Col key={dog._id} sm={6} md={4} lg={3}>
                  <PetCard pet={dog} onVote={handleVote} />
                </Col>
              ))}
            </Row>
            
            {dogs.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-dog fa-3x text-muted mb-3"></i>
                <h4>No dogs available</h4>
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

export default Dogs;