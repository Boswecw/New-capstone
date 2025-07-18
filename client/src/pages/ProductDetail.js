// client/src/pages/ProductDetail.js - COMPLETE FIX - Displays all product information
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { productAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          setError({
            type: 'missing_id',
            message: 'No product ID provided',
            suggestion: 'Please select a product from our store'
          });
          setLoading(false);
          return;
        }

        // Validate both MongoDB ObjectIds AND custom product IDs
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const isCustomProductId = /^(prod|p)\d{3}$/.test(id); // Matches prod001, p001, etc.
        
        if (!isValidObjectId && !isCustomProductId) {
          setError({
            type: 'invalid_id',
            message: `Invalid product ID format: "${id}"`,
            suggestion: 'Product IDs should be either MongoDB ObjectIds or custom format like prod001, p001',
            examples: 'Valid examples: prod001, p001, prod025'
          });
          setLoading(false);
          return;
        }

        console.log('🛒 Fetching product details for ID:', id);
        const res = await productAPI.getProductById(id);
        
        if (res?.data?.success && res.data.data) {
          const productData = res.data.data;
          console.log('✅ Product data received:', productData);
          setProduct(productData);
        } else if (res?.data) {
          // Handle case where API returns data directly
          console.log('✅ Product data received (direct):', res.data);
          setProduct(res.data);
        } else {
          setError({
            type: 'not_found',
            message: 'Product not found',
            suggestion: 'This product may no longer be available'
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('❌ Fetch Product Error:', err);
        
        let errorInfo = { type: 'unknown', message: 'Unable to fetch product details' };
        
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          
          switch (status) {
            case 400:
              errorInfo = {
                type: 'bad_request',
                message: data?.message || 'Invalid product ID format',
                suggestion: 'Make sure you\'re using a valid product ID (like prod001, p001)',
                technical: data?.error || 'Bad request',
                examples: data?.examples || ['prod001', 'p001']
              };
              break;
            case 404:
              errorInfo = {
                type: 'not_found', 
                message: 'Product not found',
                suggestion: 'This product may no longer be available or has been removed'
              };
              break;
            case 500:
              errorInfo = {
                type: 'server_error',
                message: 'Server error occurred',
                suggestion: 'Please try again in a few moments',
                technical: data?.error || 'Internal server error'
              };
              break;
            default:
              errorInfo = {
                type: 'network_error',
                message: `Network error (${status})`,
                suggestion: 'Please check your internet connection and try again'
              };
          }
        } else if (err.request) {
          errorInfo = {
            type: 'network_error',
            message: 'Unable to connect to server',
            suggestion: 'Please check your internet connection'
          };
        }
        
        setError(errorInfo);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBackToProducts = () => {
    navigate('/products');
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log(`Adding ${quantity} of ${product.name} to cart`);
    alert(`Added ${quantity} ${product.name} to cart!`);
  };

  const getImageUrl = (product) => {
    if (!product) return null;
    
    // If product has imageUrl already computed
    if (product.imageUrl) return product.imageUrl;
    
    // If product has image path, construct URL
    if (product.image) {
      return `https://storage.googleapis.com/furbabies-petstore/${product.image}`;
    }
    
    // Fallback
    return null;
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'Price not available';
  };

  const formatCategory = (category) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  // Loading state
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p>Loading product details...</p>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error.type === 'invalid_id' && 'Invalid Product ID'}
            {error.type === 'missing_id' && 'Missing Product ID'}
            {error.type === 'not_found' && 'Product Not Found'}
            {error.type === 'server_error' && 'Server Error'}
            {error.type === 'network_error' && 'Connection Error'}
            {error.type === 'bad_request' && 'Invalid Request'}
            {error.type === 'unknown' && 'Error Loading Product'}
          </Alert.Heading>
          <p className="mb-2">{error.message}</p>
          {error.suggestion && (
            <p className="mb-3 text-muted">
              <i className="fas fa-lightbulb me-1"></i>
              {error.suggestion}
            </p>
          )}
          {error.examples && (
            <p className="mb-3 small">
              <strong>Valid ID examples:</strong> {error.examples.join(', ')}
            </p>
          )}
          {error.technical && (
            <details className="mb-3">
              <summary className="text-muted small">Technical Details</summary>
              <p className="small text-muted mt-2">{error.technical}</p>
            </details>
          )}
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handleBackToProducts}>
              <i className="fas fa-arrow-left me-2"></i>
              Browse All Products
            </Button>
            <Button variant="outline-secondary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Main product details view
  return (
    <Container className="mt-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0 text-decoration-none" onClick={handleBackToProducts}>
              <i className="fas fa-store me-1"></i>
              All Products
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button 
              variant="link" 
              className="p-0 text-decoration-none" 
              onClick={() => navigate(`/products?category=${product.category}`)}
            >
              {formatCategory(product.category)}
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Details Card */}
      <Card className="shadow-lg mb-4">
        <Row className="g-0">
          {/* Product Image */}
          <Col md={6}>
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <SafeImage 
                item={product} 
                category="product"
                alt={product?.name}
                fitMode="cover"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                src={getImageUrl(product)}
              />
            </div>
          </Col>
          
          {/* Product Information */}
          <Col md={6} className="p-4">
            {/* Header with name and stock status */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h1 className="mb-2">{product.name}</h1>
                {product.brand && (
                  <p className="text-muted mb-0">
                    By {product.brand}
                  </p>
                )}
              </div>
              <Badge 
                bg={product.inStock !== false ? 'success' : 'danger'} 
                className="fs-6 px-3 py-2"
              >
                <i className={`fas ${
                  product.inStock !== false ? 'fa-check-circle' : 'fa-times-circle'
                } me-1`}></i>
                {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>
            
            {/* Price */}
            <div className="mb-4">
              <h2 className="text-primary mb-0">{formatPrice(product.price)}</h2>
              {product.category && (
                <small className="text-muted">
                  <i className="fas fa-tag me-1"></i>
                  {formatCategory(product.category)}
                </small>
              )}
            </div>

            {/* Featured Badge */}
            {product.featured && (
              <div className="mb-3">
                <Badge bg="warning" text="dark" className="px-3 py-2">
                  <i className="fas fa-star me-1"></i>
                  Featured Product
                </Badge>
              </div>
            )}

            {/* Product Details Grid */}
            <Row className="mb-4">
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-barcode text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">Product ID</small>
                    <strong className="small">{product._id}</strong>
                  </div>
                </div>
              </Col>
              <Col xs={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-eye text-primary me-2"></i>
                  <div>
                    <small className="text-muted d-block">Views</small>
                    <strong>{product.views || 0}</strong>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Quantity Selector */}
            {product.inStock !== false && (
              <div className="mb-4">
                <label className="form-label">
                  <strong>Quantity:</strong>
                </label>
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="mx-3 fw-bold">{quantity}</span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-grid gap-2 d-md-flex">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className="flex-fill"
              >
                <i className="fas fa-shopping-cart me-2"></i>
                {product.inStock !== false ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button variant="outline-secondary" size="lg">
                <i className="fas fa-heart me-2"></i>
                Wishlist
              </Button>
              <Button variant="outline-info" size="lg" onClick={() => navigate('/contact')}>
                <i className="fas fa-question-circle me-2"></i>
                Questions?
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Description Section */}
      {product.description && (
        <Card className="shadow mb-4">
          <Card.Body>
            <h4 className="mb-3">
              <i className="fas fa-info-circle text-primary me-2"></i>
              Product Description
            </h4>
            <p className="lead text-muted mb-0">{product.description}</p>
          </Card.Body>
        </Card>
      )}

      {/* Product Information */}
      <Card className="shadow mb-4">
        <Card.Body>
          <h4 className="mb-3">
            <i className="fas fa-clipboard-list text-primary me-2"></i>
            Product Information
          </h4>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Name:</strong> {product.name}
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
                  <strong>Availability:</strong> {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </li>
                <li className="mb-2">
                  <strong>Views:</strong> {product.views || 0}
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Related Products */}
      <Card className="shadow">
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
              <pre className="small mb-0">
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