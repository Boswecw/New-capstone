// client/src/pages/Home.js - CONSISTENT SAFEIMAGE APPROACH

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Placeholder } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import SafeImage from '../components/SafeImage';
import { usePetFilters } from '../hooks/usePetFilters';
import api from '../services/api';

const Home = () => {
  // ✅ Use usePetFilters for featured pets
  const {
    results: featuredPets,
    loading: loadingPets,
    error: petsError,
    setFilter: setPetFilter,
    totalResults: totalFeaturedPets
  } = usePetFilters();

  // Set up filters for featured pets on mount
  useEffect(() => {
    setPetFilter('featured', true);
    setPetFilter('status', 'available');
    setPetFilter('limit', 6);
    setPetFilter('sort', 'newest');
  }, [setPetFilter]);

  // Products state - simplified since SafeImage handles image logic
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  // ✅ SIMPLIFIED: Just fetch products, let SafeImage handle images
  const loadFeaturedProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError('');

      const prodRes = await api.get('/products/featured?limit=3');
      const products = prodRes?.data?.success ? (prodRes.data.data || []) : [];
      setFeaturedProducts(products);
      
      console.log('🛍️ Loaded', products.length, 'featured products');

    } catch (err) {
      console.error('Error loading featured products:', err);
      setFeaturedProducts([]);
      setProductsError('Failed to load featured products. Please try again later.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const testimonials = [
    { name: "Jessica R.", text: "FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!", icon: "fa-dog", rating: 5.0 },
    { name: "Marcus D.", text: "My cat LOVES the toys I got here. Fast delivery and great prices!", icon: "fa-cat", rating: 4.8 },
    { name: "Linda M.", text: "Excellent customer service and a wide variety of pet products. Highly recommended!", icon: "fa-heart", rating: 5.0 }
  ];

  // --- Skeletons ---
  const ProductSkeleton = () => (
    <Card className="h-100 shadow-sm">
      <div className="bg-light" style={{ height: '200px' }} />
      <Card.Body className="d-flex flex-column">
        <Placeholder as={Card.Title} animation="glow" className="mb-2">
          <Placeholder xs={6} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow" className="flex-grow-1">
          <Placeholder xs={12} /> <Placeholder xs={10} /> <Placeholder xs={8} />
        </Placeholder>
        <div className="d-flex justify-content-between align-items-center">
          <Placeholder animation="glow">
            <Placeholder xs={3} />
          </Placeholder>
          <Placeholder.Button variant="outline-primary" xs={4} />
        </div>
      </Card.Body>
    </Card>
  );

  // ✅ CONSISTENT: ProductCard using SafeImage (same as PetCard approach)
  const ProductCard = ({ product }) => (
    <Card className="h-100 shadow-sm">
      <div style={{ height: '200px', overflow: 'hidden' }}>
        <SafeImage
          item={product}
          category="product"
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
          alt={product?.name || 'Product'}
        />
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex align-items-center">
          <i className="fas fa-box-open me-2 text-primary"></i>
          {product?.name || 'Unknown Product'}
        </Card.Title>
        <Card.Text className="text-muted flex-grow-1">
          {product?.description?.length > 100 
            ? `${product.description.substring(0, 100)}...`
            : product?.description || 'No description available'
          }
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <span className="h5 text-primary mb-0">
            ${product?.price ? product.price.toFixed(2) : '0.00'}
          </span>
          <Button 
            variant="outline-primary" 
            size="sm"
            as={Link}
            to={`/products/${product?._id || ''}`}
          >
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="home-page">
      <HeroBanner />

      <Container className="py-5">
        {/* Featured Pets - Using SafeImage via PetCard */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-paw text-primary me-2"></i>
            Featured Pets
          </h2>

          {loadingPets ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : petsError ? (
            <Alert variant="danger" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {petsError}
            </Alert>
          ) : featuredPets && featuredPets.length > 0 ? (
            <>
              <Row className="g-4">
                {featuredPets.slice(0, 3).map(pet =>
                  pet && pet._id ? (
                    <Col key={pet._id} md={4}>
                      <PetCard pet={pet} />
                    </Col>
                  ) : null
                )}
              </Row>
              
              <div className="text-center mt-3">
                <small className="text-muted">
                  Showing 3 of {totalFeaturedPets || featuredPets.length} featured pets
                  {totalFeaturedPets > 3 && (
                    <span className="ms-2">
                      • <Link to="/browse" className="text-decoration-none">View all featured pets</Link>
                    </span>
                  )}
                </small>
              </div>
            </>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured pets available at the moment.
              <div className="mt-2">
                <Link to="/browse">
                  <Button variant="outline-primary" size="sm">
                    Browse All Available Pets
                  </Button>
                </Link>
              </div>
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/browse">
              <Button variant="primary" size="lg">
                <i className="fas fa-search me-2"></i>
                Browse All Pets
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Products - Using SafeImage consistently */}
        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-shopping-bag text-primary me-2"></i>
            Featured Products
          </h2>

          {loadingProducts ? (
            <Row className="g-4">
              {[1, 2, 3].map((k) => (
                <Col md={4} key={k}><ProductSkeleton /></Col>
              ))}
            </Row>
          ) : productsError ? (
            <Alert variant="danger" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {productsError}
            </Alert>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <>
              <Row className="g-4">
                {featuredProducts.map(product =>
                  product && product._id ? (
                    <Col key={product._id} md={4}>
                      <ProductCard product={product} />
                    </Col>
                  ) : null
                )}
              </Row>
              
              <div className="text-center mt-3">
                <small className="text-muted">
                  Showing {featuredProducts.length} featured products
                </small>
              </div>
            </>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured products available at the moment.
              <div className="mt-2">
                <Link to="/products">
                  <Button variant="outline-primary" size="sm">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-secondary" size="lg">
                <i className="fas fa-box-open me-2"></i>
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials">
          <h2 className="text-center mb-4">
            <i className="fas fa-comments text-primary me-2"></i>
            What Our Customers Say
          </h2>
          <Row className="g-4">
            {testimonials.map((t, i) => (
              <Col key={i} md={4}>
                <Card className="h-100 text-center shadow-sm border-0">
                  <Card.Body>
                    <i className={`fas ${t.icon} fa-3x text-primary mb-3`}></i>
                    <Card.Text className="fst-italic">"{t.text}"</Card.Text>
                    <Card.Title className="h6 mb-1">{t.name}</Card.Title>
                    <div className="text-warning">
                      {'★'.repeat(Math.floor(t.rating))}
                      {t.rating % 1 !== 0 && '☆'}
                      <span className="ms-2 text-muted">({t.rating})</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </div>
  );
};

export default Home;