// client/src/pages/ProductDetail.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaShoppingCart, FaHeart, FaStar, FaArrowLeft, FaShare, FaTruck } from 'react-icons/fa';
import { productAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

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
        setError('');
        
        console.log('🛒 ProductDetail: Fetching product details for ID:', id);
        
        const response = await productAPI.getProductById(id);
        console.log('🛒 ProductDetail: API response:', response);
        
        // Handle different response structures
        let productData = null;
        
        if (response?.data?.success && response.data.data) {
          // Standard API response structure
          productData = response.data.data;
        } else if (response?.data && response.data._id) {
          // Direct product object
          productData = response.data;
        } else if (response?.success && response.data) {
          // Alternative success structure
          productData = response.data;
        }
        
        if (!productData) {
          throw new Error('Product data not found in response');
        }
        
        console.log('🛒 ProductDetail: Product data:', productData);
        setProduct(productData);
        
      } catch (error) {
        console.error('❌ ProductDetail: Error fetching product details:', error);
        
        if (error.response?.status === 404) {
          setError('Product not found. It may have been discontinued.');
        } else if (error.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load product details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Get product image URL
  const getProductImageUrl = () => {
    if (imageError) {
      return 'https://via.placeholder.com/400x400/f8f9fa/6c757d?text=No+Image';
    }
    
    if (product?.imageUrl) {
      return product.imageUrl;
    }
    
    if (product?.image) {
      return `https://storage.googleapis.com/furbabies-petstore/${product.image}`;
    }
    
    return 'https://via.placeholder.com/400x400/f8f9fa/6c757d?text=No+Image';
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      await addToCart({
        id: product._id || product.id,
        name: product.name || product.displayName,
        price: product.price,
        image: product.image,
        imageUrl: getProductImageUrl(),
        quantity: quantity
      });
      
      showSuccess(`Added ${quantity} ${product.name} to cart!`);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showError('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.inStock || 999)) {
      setQuantity(newQuantity);
    }
  };

  // Get stock status
  const getStockStatus = () => {
    const stock = product?.inStock || 0;
    if (stock === 0) return { text: 'Out of Stock', variant: 'danger' };
    if (stock < 5) return { text: 'Low Stock', variant: 'warning' };
    return { text: 'In Stock', variant: 'success' };
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <h5 className="mt-3">Loading product details...</h5>
          <p className="text-muted">Please wait while we fetch the information.</p>
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
            Unable to Load Product Details
          </Alert.Heading>
          <p className="mb-3">{error}</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/products')}>
              <FaArrowLeft className="me-2" />
              Back to Products
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // No product found
  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Product Not Found</Alert.Heading>
          <p>The product you're looking for doesn't exist or may have been discontinued.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            <FaArrowLeft className="me-2" />
            Browse All Products
          </Button>
        </Alert>
      </Container>
    );
  }

  const stockStatus = getStockStatus();

  // Main product detail display
  return (
    <Container className="py-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/products')}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" />
          Back to Products
        </Button>
      </div>

      <Row>
        {/* Product Image */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <div className="position-relative">
              <img
                src={getProductImageUrl()}
                alt={product.name || 'Product photo'}
                className="card-img-top"
                style={{ 
                  height: '500px', 
                  objectFit: 'cover',
                  borderRadius: '0.375rem 0.375rem 0 0'
                }}
                onError={handleImageError}
              />
              
              {/* Stock Badge */}
              <div className="position-absolute top-0 end-0 m-3">
                <Badge 
                  bg={stockStatus.variant} 
                  className="px-3 py-2 fs-6"
                  style={{ borderRadius: '20px' }}
                >
                  {stockStatus.text}
                </Badge>
              </div>

              {/* Featured Badge */}
              {product.featured && (
                <div className="position-absolute top-0 start-0 m-3">
                  <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
                    <i className="fas fa-star me-1"></i>
                    Featured
                  </Badge>
                </div>
              )}
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
                  {product.name || product.displayName || 'Unnamed Product'}
                </h1>
                {product.brand && (
                  <h6 className="text-muted">
                    by <span className="fw-bold">{product.brand}</span>
                  </h6>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <h3 className="text-success fw-bold mb-0">
                  {formatPrice(product.price)}
                </h3>
                {product.originalPrice && product.originalPrice > product.price && (
                  <small className="text-muted text-decoration-line-through">
                    {formatPrice(product.originalPrice)}
                  </small>
                )}
              </div>

              {/* Category & Rating */}
              <div className="mb-4">
                {product.category && (
                  <Badge bg="info" className="me-2 px-3 py-2 mb-2">
                    {product.category}
                  </Badge>
                )}
                
                {product.rating && (
                  <div className="d-flex align-items-center">
                    <div className="me-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={i < product.rating ? 'text-warning' : 'text-muted'} 
                        />
                      ))}
                    </div>
                    <span className="text-muted">
                      ({product.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Product Description</h6>
                  <p className="text-muted lh-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Stock Info */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Availability:</span>
                  <Badge bg={stockStatus.variant}>
                    {stockStatus.text}
                  </Badge>
                </div>
                {product.inStock > 0 && (
                  <small className="text-muted">
                    {product.inStock} items available
                  </small>
                )}
              </div>

              {/* Quantity Selector */}
              {product.inStock > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Quantity</h6>
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="mx-3 fw-bold">{quantity}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.inStock}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-3">
                {product.inStock > 0 ? (
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="fw-bold"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Adding to Cart...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="me-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    Out of Stock
                  </Button>
                )}
                
                <Row>
                  <Col>
                    <Button variant="outline-danger" className="w-100">
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

              {/* Shipping Info */}
              <div className="mt-4 p-3 bg-light rounded">
                <div className="d-flex align-items-center">
                  <FaTruck className="text-primary me-2" />
                  <div>
                    <div className="fw-bold">Free Shipping</div>
                    <small className="text-muted">On orders over $50</small>
                  </div>
                </div>
              </div>

              {/* Product ID for reference */}
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Product ID: {product._id || product.id}
                </small>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Information Section */}
      {(product.ingredients || product.dimensions || product.weight) && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2 text-primary"></i>
                  Product Specifications
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {product.ingredients && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Ingredients</h6>
                      <p className="text-muted small">{product.ingredients}</p>
                    </Col>
                  )}
                  
                  {product.dimensions && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Dimensions</h6>
                      <p className="text-muted small">{product.dimensions}</p>
                    </Col>
                  )}
                  
                  {product.weight && (
                    <Col md={4} className="mb-3">
                      <h6 className="fw-bold">Weight</h6>
                      <p className="text-muted small">{product.weight}</p>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ProductDetail;