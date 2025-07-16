// client/src/pages/Home.js - Updated to use random endpoints
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';
import { petAPI, productAPI } from '../services/api';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        console.log('🏠 Home: Fetching random pets and products...');

        // Fetch random pets and products in parallel
        const [petsResponse, productsResponse] = await Promise.all([
          petAPI.getRandomPets(4),
          productAPI.getRandomProducts(4)
        ]);

        console.log('🐕 Random pets response:', petsResponse.data);
        console.log('🛒 Random products response:', productsResponse.data);

        setPets(petsResponse.data?.data || []);
        setProducts(productsResponse.data?.data || []);

      } catch (err) {
        console.error('❌ Error fetching home data:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading your furry friends...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <HeroBanner />
      
      <Container className="py-5">
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Featured Pets Section */}
        <section className="mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-heart me-2 text-primary"></i>
            Meet Our Featured Pets
          </h2>
          <Row>
            {pets.length > 0 ? (
              pets.map((pet) => (
                <Col key={pet._id} lg={3} md={6} className="mb-4">
                  <PetCard pet={pet} />
                </Col>
              ))
            ) : (
              <Col className="text-center">
                <p className="text-muted">No pets available at the moment.</p>
              </Col>
            )}
          </Row>
        </section>

        {/* Featured Products Section */}
        <section className="mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-shopping-cart me-2 text-success"></i>
            Featured Products
          </h2>
          <Row>
            {products.length > 0 ? (
              products.map((product) => (
                <Col key={product._id} lg={3} md={6} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <Col className="text-center">
                <p className="text-muted">No products available at the moment.</p>
              </Col>
            )}
          </Row>
        </section>

        {/* News Section */}
        <NewsSection />
      </Container>
    </>
  );
};

export default Home;