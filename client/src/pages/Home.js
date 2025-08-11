// client/src/pages/Home.js

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Placeholder } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { bucketFolders, findBestMatchingImage } from '../utils/bucketUtils';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPets();
    loadFeaturedProductsWithFallback();
  }, []);

  // --- Pets ---
  const fetchFeaturedPets = async () => {
    try {
      setLoadingPets(true);
      setError(''); // Clear any previous errors
      const response = await api.get('/pets/featured?limit=6');
      if (response.data && response.data.success) {
        setFeaturedPets(response.data.data || []);
      } else {
        setFeaturedPets([]);
      }
    } catch (err) {
      setFeaturedPets([]);
      setError('Failed to load featured pets. Please try again later.');
    } finally {
      setLoadingPets(false);
    }
  };

  // --- Products (prefer /products imageUrl, fallback to GCS match) ---
  const loadFeaturedProductsWithFallback = async () => {
    try {
      setLoadingProducts(true);

      // 1) Get featured products from Mongo
      const prodRes = await api.get('/products/featured?limit=3');
      const products = prodRes?.data?.success ? (prodRes.data.data || []) : [];
      setFeaturedProducts(products);

      // 2) Only fetch GCS images if at least one product lacks an imageUrl
      const needsFallback = products.some(p => !p?.imageUrl);
      if (needsFallback) {
        const gcsRes = await api.get(
          `/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`
        );
        const imgs = gcsRes?.data?.success ? (gcsRes.data.data || []) : [];
        setProductImages(imgs);
      } else {
        setProductImages([]); // no fallback needed
      }
    } catch (err) {
      // If /products fails, show nothing; if GCS fails we still render products with placeholders
      setFeaturedProducts([]);
      setProductImages([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const findProductImage = (product) => {
    if (!product) return 'product/placeholder.png';
    try {
      return findBestMatchingImage(
        productImages,
        [product.name, product.category, product.brand],
        product.image
      );
    } catch {
      return product.image || 'product/placeholder.png';
    }
  };

  const getProductImageUrl = (product) => {
    // 1) Prefer the API-provided URL
    if (product?.imageUrl) return product.imageUrl;

    // 2) Fallback to GCS match
    const imagePath = findProductImage(product);
    return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
  };

  const testimonials = [
    { name: "Jessica R.", text: "FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!", icon: "fa-dog", rating: 5.0 },
    { name: "Marcus D.", text: "My cat LOVES the toys I got here. Fast delivery and great prices!", icon: "fa-cat", rating: 4.8 },
    { name: "Linda M.", text: "Excellent customer service and a wide variety of pet products. Highly recommended!", icon: "fa-heart", rating: 5.0 }
  ];

  // --- Subtle product skeleton ---
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

  return (
    <div className="home-page">
      <Navbar />
      <HeroBanner />

      <Container className="py-5">
        {/* Featured Pets */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">Featured Pets</h2>

          {loadingPets ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">{error}</Alert>
          ) : featuredPets && featuredPets.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map(pet =>
                pet && pet._id ? (
                  <Col key={pet._id} md={4}>
                    <PetCard pet={pet} />
                  </Col>
                ) : null
              )}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured pets available at the moment.
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">View All Pets</Button>
            </Link>
          </div>
        </section>

        {/* Featured Products */}
        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">Featured Products</h2>

          {loadingProducts ? (
            <Row className="g-4">
              {[1, 2, 3].map((k) => (
                <Col md={4} key={k}><ProductSkeleton /></Col>
              ))}
            </Row>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map(product =>
                product && product._id ? (
                  <Col key={product._id} md={4}>
                    <Card className="h-100 shadow-sm">
                      <Card.Img
                        variant="top"
                        src={getProductImageUrl(product)}
                        alt={product.name || 'Product'}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Product+Image';
                        }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="d-flex align-items-center">
                          <i className="fas fa-box-open me-2 text-primary"></i>
                          {product.name || 'Unknown Product'}
                        </Card.Title>
                        <Card.Text className="text-muted flex-grow-1">
                          {product.description || 'No description available'}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 text-primary mb-0">
                            ${product.price ? product.price.toFixed(2) : '0.00'}
                          </span>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : null
              )}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured products available at the moment.
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-secondary" size="lg">View All Products</Button>
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials">
          <h2 className="text-center mb-4">What Our Customers Say</h2>
          <Row className="g-4">
            {testimonials.map((t, i) => (
              <Col key={i} md={4}>
                <Card className="h-100 text-center shadow-sm">
                  <Card.Body>
                    <i className={`fas ${t.icon} fa-3x text-primary mb-3`}></i>
                    <Card.Text>"{t.text}"</Card.Text>
                    <Card.Title className="h6">{t.name}</Card.Title>
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
