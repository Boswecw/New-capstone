import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPets();
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedPets = async () => {
    setLoadingPets(true);
    setError('');
    try {
      const response = await api.get('/pets?featured=true&limit=6');
      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
      } else {
        setError('No featured pets available');
        setFeaturedPets([]);
      }
    } catch (err) {
      console.error('Error fetching featured pets:', err);
      setError('Failed to load featured pets');
      setFeaturedPets([]);
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    setLoadingProducts(true);
    setError('');
    try {
      const response = await api.get('/products?featured=true&limit=6');
      if (response.data?.success) {
        setFeaturedProducts(response.data.data || []);
      } else {
        setError('No featured products available');
        setFeaturedProducts([]);
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError('Failed to load featured products');
      setFeaturedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getProductImageUrl = (product) => {
    const fallback = 'product/placeholder.png';
    if (!product) return `https://storage.googleapis.com/furbabies-petstore/${fallback}`;
    const rawImage = product.image || product.imageUrl || fallback;
    return `https://storage.googleapis.com/furbabies-petstore/${rawImage}`;
  };

  return (
    <div className="home-page">
      <Navbar />
      <HeroBanner />
      <Container className="py-5">
        {/* Featured Pets Section */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-paw me-2"></i>
            Featured Pets
          </h2>
          {error && (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {loadingPets ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : featuredPets?.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map((pet) => (
                <Col key={pet._id} md={4}>
                  <PetCard pet={pet} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured pets available at the moment.
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={fetchFeaturedPets}>
                  <i className="fas fa-refresh me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}
          
          {/* PETS BUTTON - Correctly links to /pets */}
          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-shopping-cart me-2"></i>
            Featured Products
          </h2>
          {loadingProducts ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : featuredProducts?.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map((product) => (
                <Col key={product._id} md={4}>
                  <ProductCard 
                    product={product} 
                    imageUrl={getProductImageUrl(product)} 
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured products available at the moment.
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={fetchFeaturedProducts}>
                  <i className="fas fa-refresh me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}
          
          {/* PRODUCTS BUTTON - Now correctly links to /products */}
          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-primary" size="lg">
                <i className="fas fa-shopping-cart me-2"></i>
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section text-center py-5 bg-light rounded">
          <Container>
            <h3 className="mb-3">Ready to Find Your Perfect Companion?</h3>
            <p className="lead text-muted mb-4">
              Browse our available pets or explore our products to give your furry friends the best care.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
              <Link to="/browse">
                <Button variant="success" size="lg" className="px-4">
                  <i className="fas fa-search me-2"></i>
                  Browse All
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline-primary" size="lg" className="px-4">
                  <i className="fas fa-envelope me-2"></i>
                  Contact Us
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* About Section */}
        <section className="about-preview mt-5 text-center">
          <h3 className="mb-4">Why Choose FurBabies?</h3>
          <Row className="g-4">
            <Col md={4}>
              <div className="feature-card p-4">
                <i className="fas fa-heart fa-3x text-danger mb-3"></i>
                <h5>Ethical Adoption</h5>
                <p className="text-muted">
                  We partner with trusted rescues and ethical breeders to ensure every pet finds a loving home.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card p-4">
                <i className="fas fa-shield-alt fa-3x text-success mb-3"></i>
                <h5>Health Guarantee</h5>
                <p className="text-muted">
                  All our pets receive proper veterinary care and come with health documentation.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card p-4">
                <i className="fas fa-users fa-3x text-primary mb-3"></i>
                <h5>Lifetime Support</h5>
                <p className="text-muted">
                  We provide ongoing support and resources to help you and your new companion thrive.
                </p>
              </div>
            </Col>
          </Row>
          <div className="mt-4">
            <Link to="/about">
              <Button variant="outline-secondary">
                <i className="fas fa-info-circle me-2"></i>
                Learn More About Us
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Home;