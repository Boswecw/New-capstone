// client/src/pages/Home.js - SIMPLIFIED FIX for product loading
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import PetCard from '../components/PetCard';
import { productAPI, petAPI } from '../services/api';

const Home = () => {
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // State for featured pets
  const [featuredPets, setFeaturedPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState(null);

  // 🔧 SIMPLIFIED: Direct API call without complex retry logic
  const loadFeaturedProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      console.log('🏠 Loading featured products...');
      
      const response = await productAPI.getFeaturedProducts(4);
      
      if (response?.data?.success && response.data.data?.length > 0) {
        setFeaturedProducts(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} featured products`);
      } else if (response?.data && Array.isArray(response.data)) {
        // Handle case where API returns array directly
        setFeaturedProducts(response.data);
        console.log(`✅ Loaded ${response.data.length} featured products (direct array)`);
      } else {
        console.log('⚠️ No featured products found');
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('❌ Error loading featured products:', error);
      setProductsError(error.response?.data?.message || 'Failed to load featured products');
      setFeaturedProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // 🔧 SIMPLIFIED: Direct API call for pets
  const loadFeaturedPets = async () => {
    try {
      setPetsLoading(true);
      setPetsError(null);
      console.log('🏠 Loading featured pets...');
      
      const response = await petAPI.getFeaturedPets(6);
      
      if (response?.data?.success && response.data.data?.length > 0) {
        setFeaturedPets(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} featured pets`);
      } else if (response?.data && Array.isArray(response.data)) {
        setFeaturedPets(response.data);
        console.log(`✅ Loaded ${response.data.length} featured pets (direct array)`);
      } else {
        console.log('⚠️ No featured pets found');
        setFeaturedPets([]);
      }
    } catch (error) {
      console.error('❌ Error loading featured pets:', error);
      setPetsError(error.response?.data?.message || 'Failed to load featured pets');
      setFeaturedPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  // 🔧 SIMPLIFIED: Load content on mount without complex sequencing
  useEffect(() => {
    const loadContent = async () => {
      console.log('🏠 Home page loading content...');
      
      // Load pets and products simultaneously (no staggering)
      await Promise.allSettled([
        loadFeaturedPets(),
        loadFeaturedProducts()
      ]);
      
      console.log('🏠 Home page content loading complete');
    };

    loadContent();
  }, []); // Empty dependency array - only run on mount

  return (
    <Container fluid className="px-0">
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white text-center py-5 mb-5">
        <Container>
          <Row>
            <Col>
              <h1 className="display-4 fw-bold mb-3">Welcome to FurBabies Pet Store</h1>
              <p className="lead mb-4">Find your perfect companion and everything they need to thrive</p>
              <div className="d-flex justify-content-center gap-3">
                <Button as={Link} to="/pets" variant="light" size="lg">
                  <i className="fas fa-paw me-2"></i>
                  Browse Pets
                </Button>
                <Button as={Link} to="/products" variant="outline-light" size="lg">
                  <i className="fas fa-shopping-cart me-2"></i>
                  Shop Products
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container>
        {/* Featured Pets Section */}
        <section className="mb-5">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Row className="mb-4">
                <Col>
                  <h2 className="text-center mb-3">
                    <i className="fas fa-star text-warning me-2"></i>
                    Featured Pets
                  </h2>
                  <p className="text-center text-muted">Meet some of our adorable pets looking for homes</p>
                </Col>
              </Row>

              {petsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <h5 className="mt-3">Loading featured pets...</h5>
                </div>
              ) : petsError ? (
                <Alert variant="warning" className="text-center">
                  <Alert.Heading>Unable to Load Pets</Alert.Heading>
                  <p>{petsError}</p>
                  <Button variant="outline-warning" onClick={loadFeaturedPets}>
                    <i className="fas fa-redo me-2"></i>Try Again
                  </Button>
                </Alert>
              ) : featuredPets.length > 0 ? (
                <>
                  <Row>
                    {featuredPets.slice(0, 6).map((pet) => (
                      <Col key={pet._id} xs={12} sm={6} md={4} lg={2} className="mb-4">
                        <PetCard pet={pet} />
                      </Col>
                    ))}
                  </Row>
                  <div className="text-center">
                    <Button as={Link} to="/pets" variant="primary" size="lg">
                      <i className="fas fa-paw me-2"></i>
                      View All Pets
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="info" className="text-center">
                  <h5>No Featured Pets Available</h5>
                  <p>Check back soon for new arrivals!</p>
                  <Button as={Link} to="/pets" variant="primary">
                    Browse All Pets
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </section>

        {/* Featured Products Section */}
        <section className="mb-5">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Row className="mb-4">
                <Col>
                  <h2 className="text-center mb-3">
                    <i className="fas fa-shopping-bag text-success me-2"></i>
                    Featured Products
                  </h2>
                  <p className="text-center text-muted">Essential supplies for your furry friends</p>
                </Col>
              </Row>

              {productsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="success" />
                  <h5 className="mt-3">Loading featured products...</h5>
                </div>
              ) : productsError ? (
                <Alert variant="warning" className="text-center">
                  <Alert.Heading>Unable to Load Products</Alert.Heading>
                  <p>{productsError}</p>
                  <Button variant="outline-warning" onClick={loadFeaturedProducts}>
                    <i className="fas fa-redo me-2"></i>Try Again
                  </Button>
                </Alert>
              ) : featuredProducts.length > 0 ? (
                <>
                  <Row>
                    {featuredProducts.slice(0, 4).map((product) => (
                      <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                        <ProductCard product={product} />
                      </Col>
                    ))}
                  </Row>
                  <div className="text-center">
                    <Button as={Link} to="/products" variant="success" size="lg">
                      <i className="fas fa-shopping-cart me-2"></i>
                      Shop All Products
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="info" className="text-center">
                  <h5>No Featured Products Available</h5>
                  <p>Check back soon for new arrivals!</p>
                  <Button as={Link} to="/products" variant="success">
                    Browse All Products
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </section>

        {/* Call to Action Section */}
        <section className="mb-5">
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body className="p-5">
              <Row>
                <Col md={6}>
                  <h3>Why Choose FurBabies?</h3>
                  <ul>
                    <li>Verified healthy pets from trusted sources</li>
                    <li>High-quality pet supplies and accessories</li>
                    <li>Expert advice and customer support</li>
                    <li>Secure adoption process</li>
                  </ul>
                </Col>
                <Col md={6} className="text-center">
                  <h3>Ready to Find Your Perfect Match?</h3>
                  <p>Start your journey with us today!</p>
                  <Button as={Link} to="/about" variant="outline-primary" className="me-2">
                    Learn More
                  </Button>
                  <Button as={Link} to="/contact" variant="primary">
                    Contact Us
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </section>
      </Container>
    </Container>
  );
};

export default Home;