// client/src/pages/Home.js - IMPROVED VERSION with better error handling
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Components
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';
import ToastContainer from '../components/ToastContainer';

// Services & Hooks
import { petAPI, productAPI, testConnection } from '../services/api';
import useToast from '../hooks/useToast';

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState({
    pets: true,
    products: true,
    initial: true
  });
  const [errors, setErrors] = useState({
    pets: null,
    products: null,
    connection: null
  });
  const [retryCount, setRetryCount] = useState(0);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'up', 'down', 'starting', 'unknown'

  // Toast notifications
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // Test server connection
  const checkServerStatus = useCallback(async () => {
    try {
      setServerStatus('starting');
      const result = await testConnection();
      
      if (result.success) {
        setServerStatus('up');
        setErrors(prev => ({ ...prev, connection: null }));
        return true;
      } else {
        setServerStatus('down');
        setErrors(prev => ({ 
          ...prev, 
          connection: result.error?.message || 'Server connection failed' 
        }));
        return false;
      }
    } catch (error) {
      setServerStatus('down');
      setErrors(prev => ({ 
        ...prev, 
        connection: 'Unable to connect to server' 
      }));
      return false;
    }
  }, []);

  // Fetch featured pets with better error handling
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, pets: true }));
      setErrors(prev => ({ ...prev, pets: null }));
      
      console.log('🏠 Home: Fetching featured pets...');
      
      let response;
      try {
        // Try random pets first
        response = await petAPI.getRandomPets(4);
      } catch (error) {
        console.warn('Random pets failed, trying featured pets:', error.message);
        // Fallback to featured pets
        response = await petAPI.getFeaturedPets(4);
      }
      
      // Handle different response structures
      let pets = [];
      if (response.data) {
        pets = response.data.data || response.data.pets || response.data || [];
      }
      
      // Ensure pets is an array
      if (!Array.isArray(pets)) {
        pets = [];
      }
      
      setFeaturedPets(pets);
      console.log('✅ Featured pets loaded:', pets.length);
      
      if (pets.length === 0) {
        showInfo('No featured pets available right now. Check back soon!');
      }
      
    } catch (error) {
      console.error('❌ Error fetching pets:', error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Server is starting up, please wait...'
        : 'Unable to load featured pets at this time.';
      
      setErrors(prev => ({ ...prev, pets: errorMessage }));
      
      // Show different messages based on error type
      if (error.code === 'ECONNABORTED') {
        showInfo('Server is starting up, this may take a moment...');
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(prev => ({ ...prev, pets: false }));
    }
  }, [showInfo, showError]);

  // Fetch featured products with better error handling
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setErrors(prev => ({ ...prev, products: null }));
      
      console.log('🏠 Home: Fetching featured products...');
      
      let response;
      try {
        response = await productAPI.getRandomProducts(4);
      } catch (error) {
        console.warn('Random products failed, trying featured products:', error.message);
        response = await productAPI.getFeaturedProducts(4);
      }
      
      let products = [];
      if (response.data) {
        products = response.data.data || response.data.products || response.data || [];
      }
      
      if (!Array.isArray(products)) {
        products = [];
      }
      
      setFeaturedProducts(products);
      console.log('✅ Featured products loaded:', products.length);
      
      if (products.length === 0) {
        showInfo('No featured products available right now.');
      }
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Server is starting up, please wait...'
        : 'Unable to load featured products at this time.';
      
      setErrors(prev => ({ ...prev, products: errorMessage }));
      
      if (error.code === 'ECONNABORTED') {
        showInfo('Server is starting up, this may take a moment...');
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [showInfo, showError]);

  // Load all data with server status check
  const loadAllData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true }));
      
      // First check server status
      const serverUp = await checkServerStatus();
      
      if (serverUp) {
        // Load data in parallel
        await Promise.allSettled([
          fetchFeaturedPets(),
          fetchFeaturedProducts()
        ]);
      } else {
        // Show server status message
        showError('Server is not responding. Please try again later.');
      }
      
    } catch (error) {
      console.error('❌ Error loading home data:', error);
      showError('Failed to load home page data. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  }, [checkServerStatus, fetchFeaturedPets, fetchFeaturedProducts, showError]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Retry mechanism
  const handleRetry = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      showInfo(`Retrying... (${retryCount + 1}/3)`);
      await loadAllData();
    } else {
      showError('Maximum retry attempts reached. Please refresh the page.');
    }
  }, [retryCount, loadAllData, showInfo, showError]);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setRetryCount(0);
    showInfo('Refreshing content...');
    await loadAllData();
    showSuccess('Content refreshed successfully!');
  }, [loadAllData, showInfo, showSuccess]);

  // Server status indicator
  const ServerStatusIndicator = () => (
    <div className="d-flex align-items-center justify-content-center mb-3">
      <Badge 
        bg={serverStatus === 'up' ? 'success' : serverStatus === 'starting' ? 'warning' : 'danger'}
        className="me-2"
      >
        {serverStatus === 'up' && '🟢 Server Online'}
        {serverStatus === 'starting' && '🟡 Server Starting...'}
        {serverStatus === 'down' && '🔴 Server Offline'}
        {serverStatus === 'unknown' && '⚪ Checking Server...'}
      </Badge>
      {serverStatus !== 'up' && (
        <Button size="sm" variant="outline-primary" onClick={handleRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );

  return (
    <div className="home-page">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Hero section */}
      <HeroBanner />

      {/* Server Status */}
      <Container className="py-2">
        <ServerStatusIndicator />
      </Container>

      {/* Featured Pets Section */}
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <SectionHeader 
            title="Featured Pets" 
            subtitle="Meet our adorable pets looking for loving homes" 
          />
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={loading.initial}
          >
            <i className="fas fa-sync-alt me-2"></i>
            {loading.initial ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {errors.pets ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {errors.pets}
            <div className="mt-3">
              <Button as={Link} to="/browse" variant="primary" className="me-2">
                Browse All Pets
              </Button>
              <Button variant="outline-primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : loading.pets ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading featured pets...</p>
            <small className="text-muted">
              This may take a moment if the server is starting up
            </small>
          </div>
        ) : featuredPets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured pets available at the moment. Check back soon!
          </Alert>
        ) : (
          <Row>
            {featuredPets.map((pet, index) => (
              <Col key={pet._id || index} lg={3} md={6} className="mb-4">
                <PetCard 
                  pet={pet} 
                  priority={index < 2} // Optimize loading for first 2 images
                />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <Button as={Link} to="/browse" variant="primary" size="lg">
            <i className="fas fa-paw me-2"></i>
            View All Pets
          </Button>
        </div>
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <SectionHeader 
          title="Featured Products" 
          subtitle="Quality supplies for your furry friends" 
        />

        {errors.products ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {errors.products}
            <div className="mt-3">
              <Button as={Link} to="/products" variant="primary" className="me-2">
                Browse All Products
              </Button>
              <Button variant="outline-primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : loading.products ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading featured products...</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured products available at the moment. Check back soon!
          </Alert>
        ) : (
          <Row>
            {featuredProducts.map((product, index) => (
              <Col key={product._id || index} lg={3} md={6} className="mb-4">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <Button as={Link} to="/products" variant="primary" size="lg">
            <i className="fas fa-shopping-bag me-2"></i>
            Shop All Products
          </Button>
        </div>
      </Container>

      {/* News Section */}
      <NewsSection />
    </div>
  );
};

export default Home;