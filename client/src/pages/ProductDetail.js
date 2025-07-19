// client/src/pages/ProductDetail.js - SIMPLIFIED AND FIXED
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { productAPI } from '../services/api';
import ProductImage from '../components/ProductImage';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('No product ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🛒 Fetching product details for ID: ${id}`);
        const response = await productAPI.getProductById(id);
        
        if (response?.data?.success && response.data.data) {
          setProduct(response.data.data);
          console.log('✅ Product loaded successfully:', response.data.data.name);
        } else if (response?.data && response.data._id) {
          // Handle direct product object response
          setProduct(response.data);
          console.log('✅ Product loaded successfully:', response.data.name);
        } else {
          throw new Error('Product not found');
        }
        
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        
        if (err.response?.status === 404) {
          setError('Product not found');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Unable to load product details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Utility functions
  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : 'Price N/A';
  };

  const formatCategory = (category) => {
    if (!category) return 'Products';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading product details...</h4>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Unable to Load Product
          </Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/products')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Products
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Product not found
  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Product Not Found</Alert.Heading>
          <p>The product you're looking for doesn't exist or may have been removed.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            <i className="fas fa-arrow-left me-2"></i>
            Browse All Products
          </Button>
        </Alert>
      </Container>
    );
  }

  // Main product display
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/')}>
              Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/products')}>
              Products
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name || 'Product Details'}
          </li>
        </ol>
      </nav>

      {/* Main Product Section */}
      <Row className="mb-4">
        {/* Product Image */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="text-center">
              <ProductImage
                product={product}
                size="large"
                className="img-fluid rounded"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Product Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Product Name */}
              <h1 className="mb-3">{product.name}</h1>

              {/* Price */}
              <div className="mb-3">
                <h2 className="text-primary mb-0">
                  {formatPrice(product.price)}
                </h2>
              </div>

              {/* Categories and Tags */}
              <div className="mb-3">
                {product.category && (
                  <Badge bg="primary" className="me-2 mb-1">
                    <i className="fas fa-tag me-1"></i>
                    {formatCategory(product.category)}
                  </Badge>
                )}
                {product.brand && (
                  <Badge bg="info" className="me-2 mb-1">
                    <i className="fas fa-building me-1"></i>
                    {product.brand}
                  </Badge>
                )}
                {product.inStock !== false ? (
                  <Badge bg="success" className="mb-1">
                    <i className="fas fa-check-circle me-1"></i>
                    In Stock
                  </Badge>
                ) : (
                  <Badge bg="danger" className="mb-1">
                    <i className="fas fa-times-circle me-1"></i>
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h5>Description</h5>
                  <p className="text-muted">{product.description}</p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-4">
                <h6>Quantity</h6>
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <i className="fas fa-minus"></i>
                  </Button>
                  <span className="mx-3 fw-bold">{quantity}</span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  disabled={product.inStock === false}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  {product.inStock === false ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                
                <Button variant="outline-secondary">
                  <i className="fas fa-heart me-2"></i>
                  Add to Wishlist
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Details */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-info-circle text-primary me-2"></i>
            Product Details
          </h4>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Product ID:</strong> {product._id}
                </li>
                <li className="mb-2">
                  <strong>Category:</strong> {formatCategory(product.category)}
                </li>
                {product.brand && (
                  <li className="mb-2">
                    <strong>Brand:</strong> {product.brand}
                  </li>
                )}
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Price:</strong> {formatPrice(product.price)}
                </li>
                <li className="mb-2">
                  <strong>Availability:</strong> {product.inStock !== false ? 
                    'In Stock' : 'Out of Stock'}
                </li>
                <li className="mb-2">
                  <strong>Views:</strong> {product.views || 0}
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Related Products Navigation */}
      <Card className="shadow-sm">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-search text-primary me-2"></i>
            Find Similar Products
          </h4>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate(`/products?category=${product.category}`)}
            >
              More {formatCategory(product.category)} Products
            </Button>
            {product.brand && (
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(`/products?brand=${encodeURIComponent(product.brand)}`)}
              >
                More {product.brand} Products
              </Button>
            )}
            <Button 
              variant="outline-info" 
              onClick={() => navigate('/products?featured=true')}
            >
              Featured Products
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductDetail;