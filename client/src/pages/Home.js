// client/src/pages/Home.js - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Components
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';
// ✅ REMOVE ToastContainer import from here since it's now in App.js

// Services & Hooks
import { petAPI, productAPI } from '../services/api';
import useToast from '../hooks/useToast'; // ✅ This now works with ToastProvider

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ✅ Toast notifications - now properly connected to ToastProvider
  const { showSuccess, showError, showInfo } = useToast();

  // Fetch featured pets with better error handling
  const fetchFeaturedPets = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching featured pets...');
      
      // Use specific featured pets API call
      const response = await petAPI.getAllPets({ 
        featured: true, 
        limit: 4,
        status: 'available' 
      });
      
      const pets = response.data?.data || [];
      
      if (pets.length > 0) {
        console.log('✅ Featured pets loaded:', pets.length);
        setFeaturedPets(pets);
        setPetsError(null);
        
        // Only show success toast on manual refresh, not initial load
        if (!isInitialLoad) {
          showSuccess(`${pets.length} featured pets loaded!`);
        }
      } else {
        setPetsError('No featured pets available at this time.');
        showInfo('No featured pets available right now. Check back soon!');
      }
    } catch (err) {
      console.error('❌ Error loading featured pets:', err);
      const errorMessage = 'Unable to load featured pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage);
    }
  }, [showSuccess, showError, showInfo, isInitialLoad]);

  // Fetch featured products with better error handling
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching featured products...');
      
      const response = await productAPI.getAllProducts({ 
        featured: true, 
        limit: 4,
        status: 'available' 
      });
      
      const products = response.data?.data || [];
      
      if (products.length > 0) {
        console.log('✅ Featured products loaded:', products.length);
        setFeaturedProducts(products);
        setProductsError(null);
        
        if (!isInitialLoad) {
          showSuccess(`${products.length} featured products loaded!`);
        }
      } else {
        setProductsError('No featured products available at this time.');
        showInfo('No featured products available right now. Check back soon!');
      }
    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      const errorMessage = 'Unable to load featured products at this time.';
      setProductsError(errorMessage);
      showError(errorMessage);
    }
  }, [showSuccess, showError, showInfo, isInitialLoad]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchFeaturedPets(),
        fetchFeaturedProducts()
      ]);
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [fetchFeaturedPets, fetchFeaturedProducts]);

  // Manual refresh handlers
  const handleRefreshPets = () => {
    fetchFeaturedPets();
  };

  const handleRefreshProducts = () => {
    fetchFeaturedProducts();
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroBanner />

      <Container className="py-5">
        {/* Featured Pets Section */}
        <SectionHeader 
          title="Featured Pets" 
          subtitle="Find your perfect companion today"
        />
        
        {petsError ? (
          <Alert variant="warning" className="text-center">
            <p className="mb-2">{petsError}</p>
            <Button variant="outline-primary" size="sm" onClick={handleRefreshPets}>
              <i className="fas fa-sync-alt me-2"></i>Try Again
            </Button>
          </Alert>
        ) : (
          <Row className="g-4 mb-5">
            {featuredPets.length > 0 ? (
              featuredPets.map(pet => (
                <Col key={pet._id} lg={3} md={4} sm={6}>
                  <PetCard pet={pet} />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading pets...</span>
                  </div>
                  <p className="text-muted">Loading featured pets...</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        <div className="text-center mb-5">
          <Link to="/browse?type=pets" className="btn btn-outline-primary">
            <i className="fas fa-paw me-2"></i>View All Pets
          </Link>
        </div>

        {/* Featured Products Section */}
        <SectionHeader 
          title="Featured Products" 
          subtitle="Quality supplies for your furry friends"
        />
        
        {productsError ? (
          <Alert variant="warning" className="text-center">
            <p className="mb-2">{productsError}</p>
            <Button variant="outline-primary" size="sm" onClick={handleRefreshProducts}>
              <i className="fas fa-sync-alt me-2"></i>Try Again
            </Button>
          </Alert>
        ) : (
          <Row className="g-4 mb-5">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <Col key={product._id} lg={3} md={4} sm={6}>
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading products...</span>
                  </div>
                  <p className="text-muted">Loading featured products...</p>
                </div>
              </Col>
            )}
          </Row>
        )}

        <div className="text-center mb-5">
          <Link to="/browse?type=products" className="btn btn-outline-primary">
            <i className="fas fa-shopping-bag me-2"></i>View All Products
          </Link>
        </div>

        {/* News Section */}
        <NewsSection />
      </Container>

      {/* ✅ ToastContainer is now handled in App.js - no need to include here */}
    </div>
  );
};

export default Home;