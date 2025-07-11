import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard'; // ✅ Import ProductCard
import { petAPI, productAPI } from '../services/api';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorPets, setErrorPets] = useState(null);
  const [errorProducts, setErrorProducts] = useState(null);

  // Fetch Featured Pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoadingPets(true);
        const response = await petAPI.getFeaturedPets({ limit: 6 });
        setFeaturedPets(response.data || []);
      } catch (err) {
        console.error('Error loading featured pets:', err);
        setErrorPets('Failed to load featured pets.');
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, []);

  // Fetch Featured Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await productAPI.getFeaturedProducts({ limit: 6 });
        setFeaturedProducts(response.data || []);
      } catch (err) {
        console.error('Error loading featured products:', err);
        setErrorProducts('Failed to load featured products.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      <HeroBanner />

      <Container className="my-5">
        {/* Featured Pets */}
        <h2 className="text-center mb-4">🐾 Featured Pets</h2>
        {loadingPets ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Loading pets...</p>
          </div>
        ) : errorPets ? (
          <Alert variant="danger" className="text-center">{errorPets}</Alert>
        ) : featuredPets.length === 0 ? (
          <p className="text-center text-muted">No featured pets found.</p>
        ) : (
          <Row className="g-4">
            {featuredPets.map((pet) => (
              <Col key={pet._id} xs={12} sm={6} md={4} lg={4}>
                <PetCard pet={pet} priority />
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Container className="my-5">
        {/* Featured Products */}
        <h2 className="text-center mb-4">🛍️ Popular Products</h2>
        {loadingProducts ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="secondary" />
            <p className="text-muted mt-3">Loading products...</p>
          </div>
        ) : errorProducts ? (
          <Alert variant="danger" className="text-center">{errorProducts}</Alert>
        ) : featuredProducts.length === 0 ? (
          <p className="text-center text-muted">No featured products found.</p>
        ) : (
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product._id} xs={12} sm={6} md={4} lg={4}>
                <ProductCard product={product} priority />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Home;
