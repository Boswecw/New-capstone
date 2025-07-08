// client/src/pages/ProductDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/products/${id}`);
      if (response.data?.success) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const getProductImageUrl = (product) => {
    const fallback = 'product/placeholder.png';
    if (!product) return `https://storage.googleapis.com/furbabies-petstore/${fallback}`;
    const rawImage = product.image || product.imageUrl || fallback;
    return `https://storage.googleapis.com/furbabies-petstore/${rawImage}`;
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading product details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/products')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Products
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <i className="fas fa-search me-2"></i>
          Product not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/products')}
          className="mb-3"
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Products
        </Button>
      </div>

      <Row>
        {/* Product Image */}
        <Col md={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <div className="position-relative">
              <Card.Img
                src={getProductImageUrl(product)}
                alt={product.name}
                style={{ 
                  height: '400px', 
                  objectFit: 'contain',
                  objectPosition: 'center',
                  backgroundColor: '#f8f9fa'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400?text=Product+Image';
                }}
              />
              
              {/* Stock Badge */}
              <Badge 
                bg={product.inStock ? 'success' : 'danger'}
                className="position-absolute top-0 end-0 m-3"
                style={{ fontSize: '0.9rem' }}
              >
                {product.inStock ? (
                  <>
                    <i className="fas fa-check-circle me-1"></i>
                    In Stock
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle me-1"></i>
                    Out of Stock
                  </>
                )}
              </Badge>
            </div>
          </Card>
        </Col>

        {/* Product Details */}
        <Col md={6}>
          <div className="h-100 d-flex flex-column">
            {/* Product Header */}
            <div className="mb-4">
              <h1 className="display-5 mb-3">{product.name}</h1>
              
              {/* Category and Brand */}
              <div className="mb-3">
                {product.category && (
                  <Badge bg="primary" className="me-2">
                    <i className="fas fa-tag me-1"></i>
                    {product.category}
                  </Badge>
                )}
                {product.brand && (
                  <Badge bg="secondary">
                    <i className="fas fa-building me-1"></i>
                    {product.brand}
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <h2 className="text-success mb-0">
                  <i className="fas fa-dollar-sign me-2"></i>
                  {formatPrice(product.price)}
                </h2>
                {!product.inStock && (
                  <small className="text-danger">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Currently unavailable
                  </small>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 flex-grow-1">
              <h4 className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                Description
              </h4>
              <p className="lead text-muted">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto">
              <div className="d-grid gap-2 d-md-flex">
                <Button 
                  variant="primary" 
                  size="lg"
                  disabled={!product.inStock}
                  className="flex-fill"
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                
                <Button 
                  variant="outline-primary" 
                  size="lg"
                  className="flex-fill"
                >
                  <i className="fas fa-heart me-2"></i>
                  Add to Wishlist
                </Button>
              </div>

              {/* Contact for Questions */}
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Questions about this product?{' '}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0"
                    onClick={() => navigate('/contact')}
                  >
                    Contact us
                  </Button>
                </small>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Additional Product Information */}
      <Row className="mt-5">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-clipboard-list me-2"></i>
                Product Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Product ID:</dt>
                    <dd className="col-sm-8"><code>{product._id}</code></dd>
                    
                    <dt className="col-sm-4">Category:</dt>
                    <dd className="col-sm-8">{product.category || 'Not specified'}</dd>
                    
                    <dt className="col-sm-4">Brand:</dt>
                    <dd className="col-sm-8">{product.brand || 'Not specified'}</dd>
                  </dl>
                </Col>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Price:</dt>
                    <dd className="col-sm-8">{formatPrice(product.price)}</dd>
                    
                    <dt className="col-sm-4">Availability:</dt>
                    <dd className="col-sm-8">
                      <Badge bg={product.inStock ? 'success' : 'danger'}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </dd>
                    
                    <dt className="col-sm-4">Added:</dt>
                    <dd className="col-sm-8">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </dd>
                  </dl>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;