// client/src/pages/Home.js - IMPROVED VERSION WITH BETTER ERROR HANDLING
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import { petAPI, productAPI } from '../services/api';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPetsError(null);
      setProductsError(null);

      // Fetch pets and products separately with individual error handling
      await Promise.allSettled([
        fetchFeaturedPets(),
        fetchFeaturedProducts()
      ]);

      setLoading(false);
    };

    fetchData();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      console.log('🏠 Home: Fetching featured pets...');
      const petsRes = await petAPI.getFeaturedPets({ limit: 4 });
      
      // Handle different response structures
      const petsData = petsRes.data?.data || petsRes.data || [];
      const validPets = Array.isArray(petsData) ? petsData : [];
      
      console.log('🏠 Home: Featured pets received:', validPets.length);
      setFeaturedPets(validPets.slice(0, 4)); // Ensure max 4 pets
      
    } catch (err) {
      console.error('❌ Home: Error loading featured pets:', err);
      setPetsError('Unable to load featured pets at this time.');
      
      // Fallback: try to get any available pets
      try {
        console.log('🏠 Home: Trying fallback for pets...');
        const fallbackRes = await petAPI.getAllPets({ limit: 4 });
        const fallbackData = fallbackRes.data?.data || fallbackRes.data || [];
        const validFallback = Array.isArray(fallbackData) ? fallbackData : [];
        
        if (validFallback.length > 0) {
          setFeaturedPets(validFallback.slice(0, 4));
          setPetsError(null); // Clear error if fallback works
          console.log('✅ Home: Fallback pets loaded:', validFallback.length);
        }
      } catch (fallbackErr) {
        console.error('❌ Home: Fallback for pets also failed:', fallbackErr);
      }
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      console.log('🏠 Home: Fetching featured products...');
      const productsRes = await productAPI.getFeaturedProducts({ limit: 3 });
      
      // Handle different response structures
      const productsData = productsRes.data?.data || productsRes.data || [];
      const validProducts = Array.isArray(productsData) ? productsData : [];
      
      console.log('🏠 Home: Featured products received:', validProducts.length);
      setFeaturedProducts(validProducts.slice(0, 3)); // Ensure max 3 products
      
    } catch (err) {
      console.error('❌ Home: Error loading featured products:', err);
      setProductsError('Unable to load featured products at this time.');
      
      // Fallback: try to get any available products
      try {
        console.log('🏠 Home: Trying fallback for products...');
        const fallbackRes = await productAPI.getAllProducts({ limit: 3 });
        const fallbackData = fallbackRes.data?.data || fallbackRes.data || [];
        const validFallback = Array.isArray(fallbackData) ? fallbackData : [];
        
        if (validFallback.length > 0) {
          setFeaturedProducts(validFallback.slice(0, 3));
          setProductsError(null); // Clear error if fallback works
          console.log('✅ Home: Fallback products loaded:', validFallback.length);
        }
      } catch (fallbackErr) {
        console.error('❌ Home: Fallback for products also failed:', fallbackErr);
      }
    }
  };

  const retryFetch = () => {
    setLoading(true);
    setPetsError(null);
    setProductsError(null);
    
    Promise.allSettled([
      fetchFeaturedPets(),
      fetchFeaturedProducts()
    ]).then(() => {
      setLoading(false);
    });
  };

  return (
    <>
      <HeroBanner />

      {/* Featured Pets Section */}
      <Container className="py-5">
        <SectionHeader 
          title="Featured Pets" 
          subtitle="Meet our most adorable friends available for adoption." 
        />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading featured pets...</p>
          </div>
        ) : petsError ? (
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Pets Temporarily Unavailable
            </Alert.Heading>
            <p className="mb-3">{petsError}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-primary" onClick={retryFetch}>
                <i className="fas fa-sync-alt me-2"></i>Try Again
              </Button>
              <Button as={Link} to="/pets" variant="primary">
                <i className="fas fa-paw me-2"></i>Browse All Pets
              </Button>
            </div>
          </Alert>
        ) : featuredPets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <Alert.Heading>
              <i className="fas fa-info-circle me-2"></i>
              No Featured Pets Available
            </Alert.Heading>
            <p className="mb-3">We're updating our featured pets. Please check back soon!</p>
            <Button as={Link} to="/pets" variant="primary">
              <i className="fas fa-paw me-2"></i>Browse All Pets
            </Button>
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

        {/* Show "View More" link if we have pets */}
        {featuredPets.length > 0 && (
          <div className="text-center mt-4">
            <Button as={Link} to="/pets" variant="outline-primary" size="lg">
              <i className="fas fa-paw me-2"></i>View All Pets
            </Button>
          </div>
        )}
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <SectionHeader 
          title="Featured Products" 
          subtitle="Top-rated pet products for your furry companions." 
        />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading featured products...</p>
          </div>
        ) : productsError ? (
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Products Temporarily Unavailable
            </Alert.Heading>
            <p className="mb-3">{productsError}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="outline-primary" onClick={retryFetch}>
                <i className="fas fa-sync-alt me-2"></i>Try Again
              </Button>
              <Button as={Link} to="/products" variant="primary">
                <i className="fas fa-shopping-cart me-2"></i>Browse All Products
              </Button>
            </div>
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <Alert.Heading>
              <i className="fas fa-info-circle me-2"></i>
              No Featured Products Available
            </Alert.Heading>
            <p className="mb-3">We're updating our featured products. Please check back soon!</p>
            <Button as={Link} to="/products" variant="primary">
              <i className="fas fa-shopping-cart me-2"></i>Browse All Products
            </Button>
          </Alert>
        ) : (
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product._id} xs={12} sm={6} md={4}>
                <ProductCard product={product} priority />
              </Col>
            ))}
          </Row>
        )}

        {/* Show "View More" link if we have products */}
        {featuredProducts.length > 0 && (
          <div className="text-center mt-4">
            <Button as={Link} to="/products" variant="outline-primary" size="lg">
              <i className="fas fa-shopping-cart me-2"></i>View All Products
            </Button>
          </div>
        )}
      </Container>

      {/* Call to Action Section */}
      <Container className="py-5">
        <Row className="justify-content-center text-center">
          <Col lg={8}>
            <h2 className="display-5 mb-3">Ready to Find Your Perfect Pet?</h2>
            <p className="lead text-muted mb-4">
              Join thousands of families who have found their furry best friends through FurBabies.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link} to="/pets" variant="primary" size="lg">
                <i className="fas fa-heart me-2"></i>Adopt a Pet
              </Button>
              <Button as={Link} to="/products" variant="outline-primary" size="lg">
                <i className="fas fa-shopping-bag me-2"></i>Shop Supplies
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home;