import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Carousel, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { bucketFolders, findBestMatchingImage } from '../utils/bucketUtils';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState('');

  // Featured products configuration
  const featuredProducts = [
    {
      id: 'dog-food',
      title: 'Premium Dog Food',
      price: 29.99,
      icon: 'fa-bone',
      searchTerms: ['dog', 'food', 'premium'],
      fallbackImage: '/assets/Dogfood.png'
    },
    {
      id: 'cat-toys',
      title: 'Interactive Cat Toys',
      price: 14.99,
      icon: 'fa-mouse',
      searchTerms: ['cat', 'toy', 'interactive'],
      fallbackImage: '/assets/interactivecattoy.png'
    },
    {
      id: 'aquarium-kit',
      title: 'Aquarium Starter Kit',
      price: 49.99,
      icon: 'fa-fish',
      searchTerms: ['aquarium', 'fish', 'tank', 'starter'],
      fallbackImage: '/assets/Aquarium.png'
    }
  ];

  useEffect(() => {
    fetchFeaturedPets();
    fetchProductImages();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      const response = await api.get('/pets/featured');
      setFeaturedPets(response.data.data);
    } catch (error) {
      console.error('Error fetching featured pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async () => {
    setImageLoading(true);
    try {
      const response = await api.get(`/gcs/buckets/FurBabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      if (response.data.success) {
        setProductImages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError('Failed to load product images');
    } finally {
      setImageLoading(false);
    }
  };

  // Find best matching image for a product
  const findProductImage = (product) => {
    return findBestMatchingImage(productImages, product.searchTerms, product.fallbackImage);
  };

  const testimonials = [
    {
      name: "Jessica R.",
      text: "FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!",
      icon: "fa-dog",
      rating: 5.0
    },
    {
      name: "Marcus D.",
      text: "My cat LOVES the toys I got here. Fast delivery and great prices!",
      icon: "fa-cat",
      rating: 4.8
    },
    {
      name: "Linda M.",
      text: "Excellent customer service and a wide variety of pet products. Highly recommended!",
      icon: "fa-fish",
      rating: 5.0
    }
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner logoSize="large" />

      {/* Featured Products */}
      <section id="products" className="py-5">
        <Container>
          <Row className="align-items-center mb-4">
            <Col>
              <h2 className="text-center mb-0">
                <i className="fas fa-star me-2"></i>Featured Products
              </h2>
            </Col>
          </Row>

          {/* Product Images Status */}
          {imageLoading && (
            <Row className="mb-3">
              <Col className="text-center">
                <small className="text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading product images from FurBabies-petstore...
                </small>
              </Col>
            </Row>
          )}

          {error && (
            <Alert variant="warning" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error} - Using fallback images
            </Alert>
          )}

          <Row className="g-4">
            {featuredProducts.map((product, index) => (
              <Col key={product.id} md={4}>
                <Card className="p-3 h-100">
                  <div style={{ position: 'relative' }}>
                    <Card.Img 
                      variant="top" 
                      src={findProductImage(product)} 
                      alt={product.title}
                      style={{ 
                        height: '200px', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        // Fallback to local asset if bucket image fails
                        e.target.src = product.fallbackImage;
                      }}
                    />
                    {!imageLoading && productImages.length > 0 && (
                      <small className="position-absolute top-0 end-0 bg-success text-white px-2 py-1 rounded-start">
                        <i className="fas fa-cloud me-1"></i>Cloud
                      </small>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>
                      <i className={`fas ${product.icon} me-2`}></i>{product.title}
                    </Card.Title>
                    <p className="price flex-grow-1">
                      <i className="fas fa-tag me-1"></i>${product.price}
                    </p>
                    <Button variant="primary" className="w-100">
                      <i className="fas fa-cart-plus me-2"></i>Add to Cart
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Product Image Management Link */}
          <Row className="mt-4">
            <Col className="text-center">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Product images are loaded from <strong>FurBabies-petstore/product/</strong> folder
              </small>
              <br />
              <Link to="/browse" className="btn btn-outline-secondary btn-sm mt-2">
                <i className="fas fa-images me-2"></i>
                Manage Product Images
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Pets */}
      {featuredPets.length > 0 && (
        <section className="py-5 bg-light">
          <Container>
            <h2 className="text-center mb-4">
              <i className="fas fa-heart me-2"></i>Featured Pets
            </h2>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" size="lg">
                  <span className="visually-hidden">Loading pets...</span>
                </Spinner>
                <p className="mt-3 text-muted">Finding the perfect companions...</p>
              </div>
            ) : (
              <Row className="g-4">
                {featuredPets.slice(0, 3).map(pet => (
                  <Col key={pet._id} md={4}>
                    <PetCard pet={pet} />
                  </Col>
                ))}
              </Row>
            )}
            <div className="text-center mt-4">
              <Link to="/browse" className="btn btn-primary">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Customer Reviews */}
      <section id="reviews" className="py-5">
        <Container>
          <h2 className="text-center mb-5">
            <i className="fas fa-comments me-2"></i>What Our Customers Say
          </h2>
          
          <Carousel indicators={false} className="testimonial-carousel">
            {testimonials.map((testimonial, index) => (
              <Carousel.Item key={index}>
                <div className="d-flex justify-content-center">
                  <Card className="p-4 shadow" style={{ maxWidth: '700px' }}>
                    <Card.Body className="text-center">
                      <i className="fas fa-quote-left fa-2x text-muted mb-3"></i>
                      <p className="lead">{testimonial.text}</p>
                      <div className="mt-4">
                        <i className={`fas ${testimonial.icon} fa-2x text-warning mb-2`}></i>
                        <h5 className="mb-0">{testimonial.name}</h5>
                        <small className="text-muted">
                          <i className="fas fa-star text-warning"></i> {testimonial.rating} | Verified Buyer
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>
    </>
  );
};

export default Home;