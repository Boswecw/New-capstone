import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import api from '../services/api';

const Aquatics = () => {
  const [fish, setFish] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFish();
  }, []);

  const fetchFish = async () => {
    try {
      const response = await api.get('/pets/type/fish');
      setFish(response.data.data);
    } catch (error) {
      setError('Error fetching aquatic pets. Please try again.');
      console.error('Error fetching fish:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (petId, voteType) => {
    setFish(prev => prev.map(pet => {
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

  return (
    <>
      {/* Hero Banner */}
      <section className="furbabies-banner">
        <Container>
          <Row className="justify-content-center align-items-center">
            <Col xs={12} md={10}>
              <h1 className="hero-title">
                <i className="fas fa-fish me-2"></i>
                Aquatic Pets & Supplies
              </h1>
              <p className="hero-subtitle">
                <i className="fas fa-heart me-2"></i>Dive Into Our Aquatic Collection
              </p>
              <Link to="/browse" className="btn btn-lg btn-light px-4 py-2">
                <i className="fas fa-search me-2"></i>Browse All Pets
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Aquatics Section */}
      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h2 className="text-center mb-3">
              <i className="fas fa-paw me-2"></i>Available Aquatic Pets
            </h2>
            <p className="text-center text-muted">
              Beautiful fish and aquatic companions, plus everything you need to care for them.
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
                {fish.length} aquatic pet{fish.length !== 1 ? 's' : ''} available
              </span>
            </div>
            
            <Row className="g-4">
              {fish.map(pet => (
                <Col key={pet._id} sm={6} md={4} lg={3}>
                  <PetCard pet={pet} onVote={handleVote} />
                </Col>
              ))}
            </Row>
            
            {fish.length === 0 && (
              <div className="text-center py-5">
                <i className="fas fa-fish fa-3x text-muted mb-3"></i>
                <h4>No aquatic pets available</h4>
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

export default Aquatics;