// client/src/pages/Home.js - UPDATED WITH NEWS SECTION
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection'; // ✅ NEW: Import NewsSection
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
        
        // Fallback: get recent products
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

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Featured Pets Section */}
      <section className="py-5">
        <Container>
          <SectionHeader
            title="Featured Pets"
            subtitle="Meet some of our adorable pets looking for their forever homes"
            icon="fas fa-heart"
          />

          {loading ? (
            <Row className="justify-content-center py-4">
              <Col xs="auto" className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading adorable pets...</p>
              </Col>
            </Row>
          ) : petsError ? (
            <Row className="justify-content-center">
              <Col md={6}>
                <Alert variant="warning" className="text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {petsError}
                  <div className="mt-3">
                    <Button as={Link} to="/browse" variant="primary" size="sm">
                      <i className="fas fa-paw me-2"></i>
                      Browse All Pets
                    </Button>
                  </div>
                </Alert>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="g-4 mb-4">
                {featuredPets.map((pet) => (
                  <Col key={pet._id} lg={3} md={6}>
                    <PetCard pet={pet} />
                  </Col>
                ))}
              </Row>

              <Row>
                <Col className="text-center">
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="primary" 
                    size="lg"
                  >
                    <i className="fas fa-paw me-2"></i>
                    Browse All Pets
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="py-5 bg-light">
        <Container>
          <SectionHeader
            title="Featured Products"
            subtitle="Essential supplies and accessories for your beloved pets"
            icon="fas fa-shopping-bag"
          />

          {loading ? (
            <Row className="justify-content-center py-4">
              <Col xs="auto" className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading pet products...</p>
              </Col>
            </Row>
          ) : productsError ? (
            <Row className="justify-content-center">
              <Col md={6}>
                <Alert variant="warning" className="text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {productsError}
                  <div className="mt-3">
                    <Button as={Link} to="/products" variant="primary" size="sm">
                      <i className="fas fa-shopping-bag me-2"></i>
                      Browse All Products
                    </Button>
                  </div>
                </Alert>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="g-4 mb-4">
                {featuredProducts.map((product) => (
                  <Col key={product._id} lg={4} md={6}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              <Row>
                <Col className="text-center">
                  <Button 
                    as={Link} 
                    to="/products" 
                    variant="primary" 
                    size="lg"
                  >
                    <i className="fas fa-shopping-bag me-2"></i>
                    Shop All Products
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </section>

      {/* ✅ NEW: Pet News Section */}
      <NewsSection />

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="mb-3">Ready to Find Your Perfect Companion?</h2>
              <p className="lead mb-4">
                Join thousands of happy families who have found their furry friends through FurBabies
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Button 
                  as={Link} 
                  to="/browse" 
                  variant="light" 
                  size="lg"
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-heart me-2"></i>
                  Start Adopting
                </Button>
                <Button 
                  as={Link} 
                  to="/contact" 
                  variant="outline-light" 
                  size="lg"
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-envelope me-2"></i>
                  Contact Us
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