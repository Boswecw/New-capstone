// client/src/pages/ProductDetail.js - ZERO ESLint ERRORS VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import SafeImage from '../components/SafeImage';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // ✅ FIXED: useCallback with proper dependencies
  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🛍️ Fetching product details for ID: ${id}`);
      
      const response = await api.get(`/products/${id}`);
      
      if (response.data?.success && response.data?.data) {
        const productData = response.data.data;
        
        // Normalize product data
        const normalizedProduct = {
          _id: productData._id,
          name: productData.name || productData.title || 'Unnamed Product',
          title: productData.title || productData.name,
          description: productData.description || 'No description available.',
          category: productData.category || 'Uncategorized',
          brand: productData.brand || 'Generic',
          price: Number(productData.price) || 0,
          originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
          image: productData.image || productData.imageUrl || '',
          inStock: Boolean(productData.inStock !== false),
          stockQuantity: Number(productData.stockQuantity) || 0,
          featured: Boolean(productData.featured),
          weight: productData.weight || null,
          dimensions: productData.dimensions || null,
          sku: productData.sku || productData._id,
          rating: productData.rating ? {
            average: Number(productData.rating.average || productData.rating) || 0,
            count: Number(productData.rating.count) || 0
          } : { average: 0, count: 0 },
          features: Array.isArray(productData.features) ? productData.features : [],
          benefits: Array.isArray(productData.benefits) ? productData.benefits : [],
          dateAdded: productData.dateAdded || productData.createdAt || new Date().toISOString(),
          updatedAt: productData.updatedAt || null
        };
        
        setProduct(normalizedProduct);
        console.log('✅ Product loaded successfully:', normalizedProduct.name);
      } else {
        throw new Error('Product data is missing or incomplete');
      }
      
    } catch (err) {
      console.error('❌ Error fetching product:', err);
      
      if (err.response?.status === 404) {
        setError(`Product "${id}" not found. This product may no longer be available.`);
      } else if (err.response?.status === 400) {
        setError(`Invalid product ID format "${id}". Please check the URL and try again.`);
      } else if (err.response?.status === 500) {
        setError(`Server error when loading product "${id}". Please try again later.`);
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`Unable to load product "${id}". ${err.message || 'Please try again later.'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ✅ FIXED: Proper useEffect with correct dependencies
  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleAddToCart = async () => {
    if (!product?.inStock) return;
    
    try {
      setAddingToCart(true);
      console.log(`🛒 Adding to cart: ${product.name} (Quantity: ${quantity})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Added ${quantity} × ${product.name} to cart!`);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  const getStockStatus = () => {
    if (!product?.inStock) return { variant: 'danger', text: 'Out of Stock', icon: 'times-circle' };
    if (product.stockQuantity > 10) return { variant: 'success', text: 'In Stock', icon: 'check-circle' };
    if (product.stockQuantity > 0) return { variant: 'warning', text: `Only ${product.stockQuantity} left`, icon: 'exclamation-triangle' };
    return { variant: 'success', text: 'In Stock', icon: 'check-circle' };
  };

  const calculateSavings = () => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return null;
    const savings = product.originalPrice - product.price;
    const percentage = ((savings / product.originalPrice) * 100).toFixed(0);
    return { amount: savings, percentage };
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading product details...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading product details...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Oops! Something went wrong</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-danger" onClick={fetchProductDetails}>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/products')}>
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
            Browse All Products
          </Button>
        </Alert>
      </Container>
    );
  }

  const stockStatus = getStockStatus();
  const savings = calculateSavings();

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/products')} 
              className="p-0 border-0 bg-transparent text-primary text-decoration-none"
            >
              <i className="fas fa-shopping-bag me-1"></i>
              Products
            </Button>
          </li>
          {product.category && (
            <li className="breadcrumb-item">
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)} 
                className="p-0 border-0 bg-transparent text-primary text-decoration-none"
              >
                {product.category}
              </Button>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Section */}
      <Row className="mb-4">
        {/* Product Image */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="text-center p-0">
              <SafeImage
                src={product.image}
                entityType="product"
                category={product.category}
                showLoader={true}
                className="img-fluid"
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                alt={`Photo of ${product.name}`}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Product Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Header with name and brand */}
              <div className="mb-3">
                <h1 className="h2 mb-2">{product.name}</h1>
                <p className="text-muted mb-2">
                  by {product.brand} • {product.category}
                </p>
                {product.sku && (
                  <small className="text-muted">SKU: {product.sku}</small>
                )}
              </div>

              {/* Badges */}
              <div className="mb-3">
                <Badge bg={stockStatus.variant} className="me-2">
                  <i className={`fas fa-${stockStatus.icon} me-1`}></i>
                  {stockStatus.text}
                </Badge>
                {product.featured && (
                  <Badge bg="warning" text="dark" className="me-2">
                    <i className="fas fa-star me-1"></i>
                    Featured
                  </Badge>
                )}
                {savings && (
                  <Badge bg="success" className="me-2">
                    <i className="fas fa-tag me-1"></i>
                    Save {savings.percentage}%
                  </Badge>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <span className="text-success fw-bold fs-2 me-3">
                    ${formatPrice(product.price)}
                  </span>
                  {savings && (
                    <span className="text-muted text-decoration-line-through fs-5">
                      ${formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                {savings && (
                  <small className="text-success">
                    <i className="fas fa-tag me-1"></i>
                    You save ${formatPrice(savings.amount)}!
                  </small>
                )}
              </div>

              {/* Product Details Grid */}
              <Row className="mb-4">
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-tag text-primary me-2"></i>
                    <div>
                      <small className="text-muted d-block">Category</small>
                      <span className="fw-semibold">{product.category}</span>
                    </div>
                  </div>
                </Col>
                
                <Col sm={6} className="mb-2">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-building text-primary me-2"></i>
                    <div>
                      <small className="text-muted d-block">Brand</small>
                      <span className="fw-semibold">{product.brand}</span>
                    </div>
                  </div>
                </Col>
                
                {product.weight && (
                  <Col sm={6} className="mb-2">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-weight text-primary me-2"></i>
                      <div>
                        <small className="text-muted d-block">Weight</small>
                        <span className="fw-semibold">{product.weight}</span>
                      </div>
                    </div>
                  </Col>
                )}
                
                {product.dimensions && (
                  <Col sm={6} className="mb-2">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-ruler text-primary me-2"></i>
                      <div>
                        <small className="text-muted d-block">Dimensions</small>
                        <span className="fw-semibold">{product.dimensions}</span>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Rating */}
              {product.rating.average > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="text-warning">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`${i < Math.floor(product.rating.average) ? 'fas' : 'far'} fa-star`}
                        ></i>
                      ))}
                    </div>
                    <span className="fw-semibold">{product.rating.average.toFixed(1)}</span>
                    <span className="text-muted">({product.rating.count} reviews)</span>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              {product.inStock && (
                <Row className="mb-4">
                  <Col xs={4}>
                    <label className="form-label">Quantity</label>
                    <select 
                      className="form-select"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {[...Array(Math.min(10, product.stockQuantity || 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </Col>
                  <Col xs={8} className="d-flex align-items-end">
                    <Button 
                      variant="success" 
                      size="lg"
                      className="w-100"
                      onClick={handleAddToCart}
                      disabled={addingToCart || !product.inStock}
                    >
                      {addingToCart ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Adding to Cart...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart me-2"></i>
                          Add to Cart • ${formatPrice(product.price * quantity)}
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              )}

              {/* Out of Stock Button */}
              {!product.inStock && (
                <Button variant="secondary" size="lg" className="w-100 mb-4" disabled>
                  <i className="fas fa-times-circle me-2"></i>
                  Out of Stock
                </Button>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary"
                  onClick={() => navigate('/products')}
                >
                  <i className="fas fa-shopping-bag me-2"></i>
                  Continue Shopping
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Description */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <i className="fas fa-align-left me-2"></i>
                Product Description
              </h5>
              <p className="mb-0">{product.description}</p>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Product Features/Benefits */}
        <Col lg={4}>
          {product.features.length > 0 && (
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="fas fa-check-circle me-2 text-success"></i>
                  Key Features
                </h6>
                <ul className="list-unstyled">
                  {product.features.map((feature, index) => (
                    <li key={index} className="mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
          
          {product.benefits.length > 0 && (
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="fas fa-heart me-2 text-primary"></i>
                  Benefits
                </h6>
                <ul className="list-unstyled">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="mb-2">
                      <i className="fas fa-arrow-right text-primary me-2"></i>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Related Products Section */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-shopping-bag me-2"></i>
            Explore More Products
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)}
            >
              <i className="fas fa-tag me-1"></i>
              More in {product.category}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(`/products?brand=${encodeURIComponent(product.brand)}`)}
            >
              <i className="fas fa-building me-1"></i>
              More from {product.brand}
            </Button>
            <Button 
              variant="outline-success" 
              onClick={() => navigate('/products?featured=true')}
            >
              <i className="fas fa-star me-1"></i>
              Featured Products
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Product Information */}
      <Card className="shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Important Information</h5>
          <div className="row text-center">
            <div className="col-md-3 mb-3">
              <i className="fas fa-truck text-primary fs-2 mb-2 d-block"></i>
              <h6>Free Shipping</h6>
              <small className="text-muted">On orders over $50</small>
            </div>
            <div className="col-md-3 mb-3">
              <i className="fas fa-undo text-primary fs-2 mb-2 d-block"></i>
              <h6>30-Day Returns</h6>
              <small className="text-muted">Hassle-free returns</small>
            </div>
            <div className="col-md-3 mb-3">
              <i className="fas fa-shield-alt text-primary fs-2 mb-2 d-block"></i>
              <h6>Quality Guaranteed</h6>
              <small className="text-muted">Premium pet products</small>
            </div>
            <div className="col-md-3 mb-3">
              <i className="fas fa-headset text-primary fs-2 mb-2 d-block"></i>
              <h6>Customer Support</h6>
              <small className="text-muted">24/7 assistance</small>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductDetail;