// client/src/pages/Home.js - UPDATED to use HeroBanner component

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI, productAPI } from '../services/api';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import NewsSection from '../components/NewsSection';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ pets: 0, products: 0, adoptions: 247 });

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [petsResponse, productsResponse] = await Promise.all([
          petAPI.getFeaturedPets(6),
          productAPI.getFeaturedProducts(6)
        ]);

        console.log('Featured pets response:', petsResponse.data);
        console.log('Featured products response:', productsResponse.data);

        const pets = petsResponse.data?.data || [];
        const products = productsResponse.data?.data || [];

        setFeaturedPets(pets);
        setFeaturedProducts(products);
        
        // Update stats for hero banner
        setStats(prev => ({
          ...prev,
          pets: pets.length,
          products: products.length
        }));
        
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
      <>
        {/* Show hero banner even while loading */}
        <HeroBanner
          variant="home"
          showStats={false}
          title="Find Your Perfect Companion"
          subtitle="Discover loving pets looking for their forever homes and find everything you need to keep them happy and healthy."
        />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading featured content...</p>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeroBanner
          variant="home"
          showStats={false}
          title="Find Your Perfect Companion"
          subtitle="Something went wrong, but we're still here to help you find your perfect pet!"
        />
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <div>
      {/* Hero Banner with updated design */}
      <HeroBanner
        variant="home"
        title="Find Your Perfect Companion"
        subtitle="Discover loving pets looking for their forever homes and find everything you need to keep them happy and healthy."
        primaryButtonText="Find a Pet"
        primaryButtonLink="/browse"
        primaryButtonIcon="fas fa-search"
        secondaryButtonText="Shop Products"
        secondaryButtonLink="/products"
        secondaryButtonIcon="fas fa-shopping-cart"
        showStats={true}
        stats={stats}
        backgroundGradient="linear-gradient(135deg, #007bff 0%, #6f42c1 70%, #fd7e14 100%)"
        minHeight="500px"
      />

      {/* Featured Pets Section */}
      {featuredPets.length > 0 && (
        <Container className="py-5">
          <Row className="mb-4">
            <Col>
              <div className="text-center">
                <h2 className="display-5 fw-bold mb-3">
                  <i className="fas fa-heart text-danger me-3"></i>
                  Featured Pets
                </h2>
                <p className="lead text-muted mb-4">
                  These adorable companions are ready to find their forever homes
                </p>
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            {featuredPets.map((pet) => (
              <Col key={pet._id} md={6} lg={4} className="d-flex">
                <PetCard 
                  pet={pet} 
                  showFavoriteButton={true}
                  showAdoptionStatus={true}
                  className="h-100"
                />
              </Col>
            ))}
          </Row>

          <div className="text-center">
            <Link to="/pets" className="btn btn-primary btn-lg px-4">
              <i className="fas fa-paw me-2"></i>
              View All Pets
            </Link>
          </div>
        </Container>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="bg-light py-5">
          <Container>
            <Row className="mb-4">
              <Col>
                <div className="text-center">
                  <h2 className="display-5 fw-bold mb-3">
                    <i className="fas fa-shopping-bag text-primary me-3"></i>
                    Featured Products
                  </h2>
                  <p className="lead text-muted mb-4">
                    Everything your pet needs to stay happy and healthy
                  </p>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              {featuredProducts.map((product) => (
                <Col key={product._id} md={6} lg={4} className="d-flex">
                  <ProductCard 
                    product={product}
                    showAddToCart={true}
                    className="h-100"
                  />
                </Col>
              ))}
            </Row>

            <div className="text-center">
              <Link to="/products" className="btn btn-success btn-lg px-4">
                <i className="fas fa-store me-2"></i>
                Browse All Products
              </Link>
            </div>
          </Container>
        </div>
      )}

      {/* News Section */}
      <Container className="py-5">
        <NewsSection 
          limit={3}
          showHeader={true}
          title="Latest Pet News & Tips"
          subtitle="Stay updated with the latest in pet care and adoption stories"
        />
      </Container>

      {/* Call to Action Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Ready to Start Your Journey?</h2>
              <p className="lead mb-4">
                Join thousands of families who have found their perfect companions through FurBabies
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link to="/browse" className="btn btn-light btn-lg px-4">
                  <i className="fas fa-search me-2"></i>
                  Start Browsing Pets
                </Link>
                <Link to="/about" className="btn btn-outline-light btn-lg px-4">
                  <i className="fas fa-info-circle me-2"></i>
                  Learn More About Us
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;