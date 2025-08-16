// ===== FIXED ProductDetail.js =====
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaShoppingCart, FaHeart, FaArrowLeft, FaShare } from 'react-icons/fa';
import { api } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      // Debug logging
      console.log('🛒 ProductDetail: URL params:', { id });
      console.log('🛒 ProductDetail: Current URL:', window.location.href);
      
      if (!id || id === 'undefined') {
        setError('No product ID provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        console.log('🛒 ProductDetail: Fetching product details for ID:', id);
        
        const response = await api.get(`/products/${id}`);
        console.log('🛒 ProductDetail: API response:', response);
        
        if (response.data?.success && response.data.data) {
          setProduct(response.data.data);
          console.log('✅ ProductDetail: Product loaded successfully:', response.data.data.name);
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        console.error('❌ ProductDetail: Error fetching product details:', error);
        
        if (error.response?.status === 404) {
          setError('Product not found. It may have been discontinued.');
        } else if (error.response?.status === 400) {
          setError('Invalid product ID format. Please check the URL.');
        } else {
          setError('Failed to load product details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading product details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Product Not Found</Alert.Heading>
          <p>{error}</p>
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/products')}>
              Browse All Products
            </Button>
            <Button variant="outline-secondary" className="ms-2" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <p>Product data could not be loaded.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Browse All Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Back Button */}
      <Button 
        variant="outline-secondary" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <Row>
        {/* Product Image */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <Card.Img
                variant="top"
                src={product.imageUrl || `https://via.placeholder.com/400x400?text=${product.name}`}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x400?text=${product.name}`;
                }}
              />
            </div>
          </Card>
        </Col>

        {/* Product Details */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              
              {/* Product Name & Brand */}
              <div className="mb-3">
                <h1 className="display-6 fw-bold text-primary mb-2">
                  {product.name || 'Unnamed Product'}
                </h1>
                <h5 className="text-muted">
                  {product.brand || 'Generic Brand'} • {product.category?.charAt(0).toUpperCase() + product.category?.slice(1) || 'Product'}
                </h5>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="display-6 fw-bold text-success">
                  ${product.price || '0.00'}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-3">
                <Badge 
                  bg={product.inStock ? 'success' : 'danger'}
                  className="fs-6 px-3 py-2"
                >
                  {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </Badge>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h6 className="fw-bold mb-2">Description</h6>
                <p className="text-muted">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Quantity Selector */}
              {product.inStock && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Quantity</h6>
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
              <div className="d-grid gap-3">
                {product.inStock ? (
                  <Button variant="primary" size="lg" className="fw-bold">
                    <FaShoppingCart className="me-2" />
                    Add to Cart - ${(product.price * quantity).toFixed(2)}
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    Out of Stock
                  </Button>
                )}
                
                <Row>
                  <Col>
                    <Button variant="outline-primary" className="w-100">
                      <FaHeart className="me-2" />
                      Wishlist
                    </Button>
                  </Col>
                  <Col>
                    <Button variant="outline-secondary" className="w-100">
                      <FaShare className="me-2" />
                      Share
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Product ID for reference */}
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Product ID: {product._id}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;