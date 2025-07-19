// client/src/pages/ProductDetail.js - SIMPLIFIED AND FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { productAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // 🔧 SIMPLIFIED: Basic product fetching without complex validation
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
        
        // Handle different response formats
        let productData = null;
        
        if (response?.data?.success && response.data.data) {
          // Standard API response format
          productData = response.data.data;
        } else if (response?.data && typeof response.data === 'object' && response.data._id) {
          // Direct product object
          productData = response.data;
        }
        
        if (productData) {
          console.log('✅ Product loaded successfully:', productData.name);
          setProduct(productData);
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
          setError(err.response?.data?.message || 'Failed to load product details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // 🔧 HELPER: Format category name
  const formatCategory = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ');
  };

  // 🔧 HELPER: Format price
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'Price not available';
    return `$${price.toFixed(2)}`;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <h3 className="mt-3">Loading Product Details...</h3>
          <p className="text-muted">Please wait while we fetch the product information</p>
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
          <div className="d-flex justify-content-center gap-2 mt-3">
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

      {/* Product Details */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            {/* Product Image */}
            <Col md={6} className="mb-4">
              <div className="text-center">
                <SafeImage
                  src={product.imageUrl || product.image}
                  fallback="product"
                  alt={product.name}
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              </div>
            </Col>

            {/* Product Information */}
            <Col md={6}>
              <div className="mb-3">
                <h1 className="fw-bold">{product.name || 'Unnamed Product'}</h1>
                <p className="text-muted mb-2">
                  <i className="fas fa-tag me-2"></i>
                  Category: {formatCategory(product.category)}
                </p>
                {product.brand && (
                  <p className="text-muted mb-2">
                    <i className="fas fa-industry me-2"></i>
                    Brand: {product.brand}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="mb-3">
                <h2 className="text-success fw-bold">
                  {formatPrice(product.price)}
                </h2>
              </div>

              {/* Stock Status */}
              <div className="mb-3">
                <Badge bg={product.inStock ? 'success' : 'danger'} className="fs-6">
                  <i className={`fas ${product.inStock ? 'fa-check' : 'fa-times'} me-2`}></i>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h5>Description</h5>
                  <p className="text-muted">{product.description}</p>
                </div>
              )}

              {/* Quantity and Add to Cart (if in stock) */}
              {product.inStock && (
                <div className="mb-4">
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <label htmlFor="quantity" className="form-label">Quantity:</label>
                    </Col>
                    <Col xs="auto">
                      <input
                        type="number"
                        id="quantity"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        style={{ width: '80px' }}
                      />
                    </Col>
                  </Row>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 flex-wrap">
                {product.inStock ? (
                  <Button variant="success" size="lg">
                    <i className="fas fa-shopping-cart me-2"></i>
                    Add to Cart
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    <i className="fas fa-times me-2"></i>
                    Out of Stock
                  </Button>
                )}
                
                <Button variant="outline-primary" size="lg">
                  <i className="fas fa-heart me-2"></i>
                  Add to Wishlist
                </Button>
                
                <Button variant="outline-secondary" onClick={() => navigate('/products')}>
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Products
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Additional Product Information */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-info-circle text-info me-2"></i>
            Product Information
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
                  <strong>Availability:</strong> {product.inStock ? 'In Stock' : 'Out of Stock'}
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

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <Card bg="light">
            <Card.Body>
              <h6>Debug Information (Development Only)</h6>
              <pre className="small mb-0" style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(product, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default ProductDetail;