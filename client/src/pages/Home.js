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
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">Featured Pets</h2>
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
          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Button>
            </Link>
          </div>
        </section>

        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">Featured Products</h2>
          {loadingProducts ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : featuredProducts?.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map((product) => (
                <Col key={product._id} md={4}>
                  <ProductCard product={product} imageUrl={getProductImageUrl(product)} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured products available at the moment.
            </Alert>
          )}
          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-primary" size="lg">
                <i className="fas fa-shopping-cart me-2"></i>
                View All Products
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Home;