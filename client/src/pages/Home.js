// client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI, productAPI } from '../services/api';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [petsResponse, productsResponse] = await Promise.all([
          petAPI.get('/featured?limit=6'),
          productAPI.get('/featured?limit=6')
        ]);

        console.log('Featured pets response:', petsResponse.data);
        console.log('Featured products response:', productsResponse.data);

        setFeaturedPets(petsResponse.data?.data || []);
        setFeaturedProducts(productsResponse.data?.data || []);
        
      } catch (error) {
        console.error('Error fetching featured content:', error);
        setError('Failed to load featured content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Loading featured content...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Oops! Something went wrong</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div>
      <div 
        className="hero-section bg-primary text-white py-5 mb-5"
        style={{
          background: 'linear-gradient(135deg, #007bff 0%, #6f42c1 100%)',
          minHeight: '400px'
        }}
      >
        <Container className="h-100 d-flex align-items-center">
          <Row className="w-100">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Find Your Perfect Companion
              </h1>
              <p className="lead mb-4">
                Discover loving pets looking for their forever homes and find everything 
                you need to keep them happy and healthy.
              </p>
              <div className="d-flex gap-3">
                <Link to="/pets" className="btn btn-light btn-lg">
                  <i className="fas fa-paw me-2"></i>
                  Browse Pets
                </Link>
                <Link to="/products" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-shopping-bag me-2"></i>
                  Shop Supplies
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="px-4">
        <Row className="mb-5">
          <Col>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold text-dark">
                <i className="fas fa-star text-warning me-3"></i>
                Featured Pets
              </h2>
              <p className="lead text-muted">
                Meet some of our special friends waiting for their forever homes
              </p>
            </div>
            
            {featuredPets.length > 0 ? (
              <Row className="g-4">
                {featuredPets.slice(0, 6).map(pet => (
                  <Col key={pet._id} xl={4} lg={6} md={6} className="d-flex">
                    <PetCard pet={pet} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert variant="info" className="text-center">
                <i className="fas fa-info-circle me-2"></i>
                No featured pets available at the moment. Check back soon!
              </Alert>
            )}
            
            <div className="text-center mt-5">
              <Link to="/pets" className="btn btn-primary btn-lg px-5">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Link>
            </div>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold text-dark">
                <i className="fas fa-star text-warning me-3"></i>
                Featured Products
              </h2>
              <p className="lead text-muted">
                Everything your furry friend needs to live their best life
              </p>
            </div>
            
            {featuredProducts.length > 0 ? (
              <Row className="g-4">
                {featuredProducts.slice(0, 6).map(product => (
                  <Col key={product._id} xl={4} lg={6} md={6} className="d-flex">
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert variant="info" className="text-center">
                <i className="fas fa-info-circle me-2"></i>
                No featured products available at the moment. Check back soon!
              </Alert>
            )}
            
            <div className="text-center mt-5">
              <Link to="/products" className="btn btn-success btn-lg px-5">
                <i className="fas fa-shopping-bag me-2"></i>
                Shop All Products
              </Link>
            </div>
          </Col>
        </Row>

        <Row className="my-5 py-5 bg-light rounded">
          <Col className="text-center">
            <h3 className="fw-bold mb-3">Ready to Make a Difference?</h3>
            <p className="lead text-muted mb-4">
              Every pet deserves a loving home. Start your adoption journey today!
            </p>
            <Link to="/pets" className="btn btn-primary btn-lg me-3">
              <i className="fas fa-heart me-2"></i>
              Adopt a Pet
            </Link>
            <Link to="/contact" className="btn btn-outline-primary btn-lg">
              <i className="fas fa-envelope me-2"></i>
              Contact Us
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;