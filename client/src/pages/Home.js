// client/src/pages/Home.js - Updated with Random Pet Selection

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Components
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';

// Services
import { petAPI, productAPI } from '../services/api';

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);

  // Fetch 4 random pets from your 55 pets database
  const fetchRandomPets = async () => {
    try {
      console.log('🏠 Home: Fetching random pets from database...');
      setPetsLoading(true);
      setPetsError(null);
      
      // ✅ KEY FIX: Get more pets than we need so we can randomize
      const response = await petAPI.getAllPets({ 
        limit: 25,  // Get 25 pets from your 55 total
        status: 'available',
        sort: 'newest'
      });
      
      const allPets = response.data?.data || [];
      
      if (allPets.length > 0) {
        // ✅ RANDOMIZE: Shuffle array and take first 4
        const shuffledPets = [...allPets].sort(() => Math.random() - 0.5);
        const randomPets = shuffledPets.slice(0, 4);
        
        console.log('✅ Random pets loaded:', randomPets.length);
        console.log('🎲 Selected pets:', randomPets.map(p => p.name));
        
        setFeaturedPets(randomPets);
      } else {
        console.warn('⚠️ No pets found in database');
        setPetsError('No pets available at this time.');
      }
    } catch (err) {
      console.error('❌ Error loading random pets:', err);
      const errorMessage = err.response?.data?.message || 'Unable to load pets at this time.';
      setPetsError(errorMessage);
    } finally {
      setPetsLoading(false);
    }
  };

  // Fetch featured products
  const fetchFeaturedProducts = async () => {
    try {
      console.log('🏠 Home: Fetching featured products...');
      setProductsLoading(true);
      setProductsError(null);
      
      const response = await productAPI.getAllProducts({ 
        featured: true, 
        limit: 4,
        status: 'available' 
      });
      
      const products = response.data?.data || [];
      
      if (products.length > 0) {
        console.log('✅ Featured products loaded:', products.length);
        setFeaturedProducts(products);
      } else {
        console.warn('⚠️ No featured products found');
        setProductsError('No featured products available at this time.');
      }
    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      const errorMessage = err.response?.data?.message || 'Unable to load products at this time.';
      setProductsError(errorMessage);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchRandomPets();
    fetchFeaturedProducts();
  }, []);

  // Refresh pets (get new random selection)
  const refreshPets = () => {
    fetchRandomPets();
  };

  // Refresh products
  const refreshProducts = () => {
    fetchFeaturedProducts();
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Featured Pets Section */}
      <section className="py-5">
        <Container>
          <SectionHeader 
            title="Meet Our Featured Pets" 
            subtitle="Discover amazing companions waiting for their forever homes"
          />
          
          {/* Section Controls */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">
                {featuredPets.length > 0 ? `${featuredPets.length} pets featured` : 'Loading pets...'}
              </h5>
              <small className="text-muted">Randomly selected from our available pets</small>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={refreshPets}
                disabled={petsLoading}
                className="me-2"
              >
                {petsLoading ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <i className="fas fa-refresh me-1"></i>
                )}
                New Selection
              </Button>
              <Button 
                as={Link} 
                to="/browse" 
                variant="primary" 
                size="sm"
              >
                <i className="fas fa-paw me-1"></i>
                Browse All
              </Button>
            </div>
          </div>

          {/* Pets Loading State */}
          {petsLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted">Loading featured pets...</p>
            </div>
          )}

          {/* Pets Error State */}
          {petsError && !petsLoading && (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Pets Temporarily Unavailable</strong>
              <div className="mt-2">{petsError}</div>
              <Button variant="outline-warning" size="sm" className="mt-3" onClick={refreshPets}>
                <i className="fas fa-retry me-1"></i>
                Try Again
              </Button>
            </Alert>
          )}

          {/* Pets Grid */}
          {!petsLoading && !petsError && featuredPets.length > 0 && (
            <Row className="g-4">
              {featuredPets.map((pet, index) => (
                <Col key={pet._id} xs={12} sm={6} md={4} lg={3}>
                  <PetCard pet={pet} priority={index < 2} />
                </Col>
              ))}
            </Row>
          )}

          {/* Empty State */}
          {!petsLoading && !petsError && featuredPets.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-paw fa-4x text-muted opacity-50 mb-3"></i>
              <h4 className="text-muted">No pets available right now</h4>
              <p className="text-muted">Check back soon for new arrivals!</p>
            </div>
          )}
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="py-5 bg-light">
        <Container>
          <SectionHeader 
            title="Featured Products" 
            subtitle="Everything your pet needs for a happy, healthy life"
          />
          
          {/* Section Controls */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">
                {featuredProducts.length > 0 ? `${featuredProducts.length} products featured` : 'Loading products...'}
              </h5>
              <small className="text-muted">Handpicked essentials for your furry friends</small>
            </div>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={refreshProducts}
                disabled={productsLoading}
                className="me-2"
              >
                {productsLoading ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <i className="fas fa-refresh me-1"></i>
                )}
                Refresh
              </Button>
              <Button 
                as={Link} 
                to="/products" 
                variant="secondary" 
                size="sm"
              >
                <i className="fas fa-shopping-cart me-1"></i>
                Shop All
              </Button>
            </div>
          </div>

          {/* Products Loading State */}
          {productsLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="secondary" className="mb-3" />
              <p className="text-muted">Loading featured products...</p>
            </div>
          )}

          {/* Products Error State */}
          {productsError && !productsLoading && (
            <Alert variant="info" className="text-center">
              <i className="fas fa-shopping-cart me-2"></i>
              <strong>Products Temporarily Unavailable</strong>
              <div className="mt-2">{productsError}</div>
              <Button variant="outline-info" size="sm" className="mt-3" onClick={refreshProducts}>
                <i className="fas fa-retry me-1"></i>
                Try Again
              </Button>
            </Alert>
          )}

          {/* Products Grid */}
          {!productsLoading && !productsError && featuredProducts.length > 0 && (
            <Row className="g-4">
              {featuredProducts.map((product, index) => (
                <Col key={product._id} xs={12} sm={6} md={4} lg={3}>
                  <ProductCard product={product} priority={index < 2} />
                </Col>
              ))}
            </Row>
          )}

          {/* Empty State */}
          {!productsLoading && !productsError && featuredProducts.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart fa-4x text-muted opacity-50 mb-3"></i>
              <h4 className="text-muted">No featured products available</h4>
              <p className="text-muted">Check back soon for new arrivals!</p>
            </div>
          )}
        </Container>
      </section>

      {/* News Section */}
      <NewsSection />

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="h3 mb-3">Ready to Find Your Perfect Pet?</h2>
              <p className="lead mb-4">
                Browse our full collection of loving pets waiting for their forever homes.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button 
                  as={Link} 
                  to="/browse" 
                  variant="light" 
                  size="lg"
                  className="px-4"
                >
                  <i className="fas fa-paw me-2"></i>
                  Browse All Pets
                </Button>
                <Button 
                  as={Link} 
                  to="/products" 
                  variant="outline-light" 
                  size="lg"
                  className="px-4"
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Shop Products
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;