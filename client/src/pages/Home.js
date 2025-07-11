// client/src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import { petAPI, productAPI } from '../services/api';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const petsRes = await petAPI.getFeaturedPets({ limit: 6 });
        setFeaturedPets(Array.isArray(petsRes.data?.data) ? petsRes.data.data : []);

        const productsRes = await productAPI.getFeaturedProducts({ limit: 6 });
        setFeaturedProducts(Array.isArray(productsRes.data?.data) ? productsRes.data.data : []);
      } catch (err) {
        console.error('❌ Error loading featured items:', err);
        setError('Failed to load featured pets and products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <HeroBanner />

      <Container className="py-5">
        <SectionHeader title="Featured Pets" subtitle="Meet our most adorable friends available for adoption." />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading featured pets...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : (
          <Row className="g-4">
            {featuredPets.map((pet) => (
              <Col key={pet._id} xs={12} sm={6} md={4} lg={3}>
                <PetCard pet={pet} priority />
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Container className="py-5 bg-light">
        <SectionHeader title="Featured Products" subtitle="Top-rated pet products for your furry companions." />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading featured products...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : (
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product._id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard product={product} priority />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default Home;
