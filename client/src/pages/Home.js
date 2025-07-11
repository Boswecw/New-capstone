// client/src/pages/Home.js - FIXED WITH FALLBACK LOGIC
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

      // Fetch pets and products separately
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
      
      // Try to get featured pets first
      const featuredRes = await petAPI.getFeaturedPets({ limit: 4 });
      const featuredData = featuredRes.data?.data || [];
      
      if (featuredData.length > 0) {
        console.log('✅ Home: Found featured pets:', featuredData.length);
        setFeaturedPets(featuredData);
      } else {
        console.log('⚠️ Home: No featured pets found, falling back to recent pets');
        
        // Fallback: get the most recent pets
        const allPetsRes = await petAPI.getAllPets({ limit: 4 });
        const allPetsData = allPetsRes.data?.data || [];
        
        if (allPetsData.length > 0) {
          console.log('✅ Home: Using recent pets as fallback:', allPetsData.length);
          setFeaturedPets(allPetsData);
        } else {
          console.log('❌ Home: No pets found at all');
          setPetsError('No pets available at this time.');
        }
      }
      
    } catch (err) {
      console.error('❌ Home: Error loading pets:', err);
      setPetsError('Unable to load pets at this time.');
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      console.log('🏠 Home: Fetching featured products...');
      
      // Try to get featured products first
      const featuredRes = await productAPI.getFeaturedProducts({ limit: 3 });
      const featuredData = featuredRes.data?.data || [];
      
      if (featuredData.length > 0) {
        console.log('✅ Home: Found featured products:', featuredData.length);
        setFeaturedProducts(featuredData);
      } else {
        console.log('⚠️ Home: No featured products found, falling back to recent products');
        
        // Fallback: get the most recent products
        const allProductsRes = await productAPI.getAllProducts({ limit: 3 });
        const allProductsData = allProductsRes.data?.data || [];
        
        if (allProductsData.length > 0) {
          console.log('✅ Home: Using recent products as fallback:', allProductsData.length);
          setFeaturedProducts(allProductsData);
        } else {
          console.log('❌ Home: No products found at all');
          setProductsError('No products available at this time.');
        }
      }
      
    } catch (err) {
      console.error('❌ Home: Error loading products:', err);
      setProductsError('Unable to load products at this time.');
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
              No Pets Available
            </Alert.Heading>
            <p className="mb-3">We're currently updating our pet listings. Please check back soon!</p>
            <Button as={Link} to="/pets" variant="primary">
              <i className="fas fa-paw me-2"></i>Browse All Pets
            </Button>
          </Alert>
        ) : (
          <Row className="g-4">
            {featuredPets.slice(0, 4).map((pet) => (
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
              <i className="fas fa-paw me-2"></i>View All Pets ({featuredPets.length > 4 ? '50+' : featuredPets.length} available)
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
              No Products Available
            </Alert.Heading>
            <p className="mb-3">We're currently updating our product catalog. Please check back soon!</p>
            <Button as={Link} to="/products" variant="primary">
              <i className="fas fa-shopping-cart me-2"></i>Browse All Products
            </Button>
          </Alert>
        ) : (
          <Row className="g-4">
            {featuredProducts.slice(0, 3).map((product) => (
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
              <i className="fas fa-shopping-cart me-2"></i>View All Products ({featuredProducts.length > 3 ? '15+' : featuredProducts.length} available)
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