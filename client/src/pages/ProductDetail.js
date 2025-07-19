// client/src/pages/ProductDetail.js - CORRECTED Product detail page
import React, { useState, useEffect, useCallback } from 'react';
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
  const [addingToCart, setAddingToCart] = useState(false);

  // ✅ FIXED: Fetch PRODUCT data using productAPI (not petAPI!)
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
        
        console.log(`🛍️ Fetching product details for ID: ${id}`);
        const response = await productAPI.getProductById(id); // ✅ FIXED: Use productAPI!
        
        console.log('📊 Product API Response:', response.data);
        
        // Handle different response formats from your backend
        let productData = null;
        
        if (response?.data?.success && response.data.data) {
          // Standard format: { success: true, data: productObject }
          productData = response.data.data;
          console.log('✅ Using standard API response format');
        } else if (response?.data && response.data._id) {
          // Direct product object format
          productData = response.data;
          console.log('✅ Using direct product object format');
        } else {
          console.error('❌ Unexpected API response format:', response.data);
          throw new Error('Invalid response format from server');
        }
        
        if (productData && productData._id) {
          // ✅ FIXED: Normalize product data to handle backend field variations safely
          const normalizedProduct = {
            ...productData,
            // Ensure basic fields are strings, not objects
            _id: String(productData._id || ''),
            name: String(productData.name || 'Unnamed Product'),
            category: String(productData.category || 'General'),
            brand: String(productData.brand || 'Generic'),
            
            // Handle description safely
            description: productData.description ? String(productData.description) : 'This product will make your pet happy!',
            
            // Handle price safely
            price: Number(productData.price || 0),
            originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
            
            // Handle image field safely
            image: productData.image || productData.imageUrl || '',
            
            // Handle boolean fields safely
            inStock: Boolean(productData.inStock !== false),
            featured: Boolean(productData.featured),
            
            // Handle numeric fields safely
            rating: productData.rating ? {
              average: Number(productData.rating.average || productData.rating || 0),
              count: Number(productData.rating.count || 0)
            } : { average: 0, count: 0 },
            
            // Handle stock quantity
            stockQuantity: Number(productData.stockQuantity || 0),
            
            // Handle dates safely
            dateAdded: productData.dateAdded || productData.createdAt || new Date().toISOString(),
            
            // Handle additional fields
            weight: productData.weight ? String(productData.weight) : null,
            dimensions: productData.dimensions ? String(productData.dimensions) : null,
            sku: productData.sku ? String(productData.sku) : null
          };
          
          setProduct(normalizedProduct);
          console.log('✅ Product loaded successfully:', normalizedProduct.name);
          console.log('📋 Product data fields:', Object.keys(normalizedProduct));
        } else {
          throw new Error('Product data is incomplete or missing required ID');
        }
        
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        
        if (err.response?.status === 404) {
          setError('Product not found. This product may no longer be available.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID format. Please check the URL and try again.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else if (err.code === 'NETWORK_ERROR') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(err.message || 'Unable to load product details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!product || product.inStock === false || addingToCart) return;
    
    try {
      setAddingToCart(true);
      console.log(`🛒 Adding ${quantity} x ${product.name} to cart`);
      
      // Here you would typically call a cart API
      // For now, we'll just simulate adding to cart
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Product added to cart successfully');
      // You could show a toast notification here
      
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, addingToCart]);

  // ✅ FIXED: Safe utility functions with proper null checking
  const formatPrice = useCallback((price) => {
    if (typeof price === 'number' && price >= 0) {
      return `$${price.toFixed(2)}`;
    }
    return '$0.00';
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  }, []);

  const getStockStatus = useCallback(() => {
    if (!product) return { text: 'Unknown', variant: 'secondary', icon: 'question' };
    
    if (product.inStock === false || product.stockQuantity === 0) {
      return { text: 'Out of Stock', variant: 'danger', icon: 'times' };
    } else if (product.stockQuantity && product.stockQuantity < 5) {
      return { text: 'Low Stock', variant: 'warning', icon: 'exclamation-triangle' };
    } else {
      return { text: 'In Stock', variant: 'success', icon: 'check' };
    }
  }, [product]);

  // ✅ FIXED: Safe render functions with proper null checking
  const renderStarRating = useCallback((rating = 0, size = 'sm') => {
    const stars = [];
    const numRating = Number(rating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= numRating;
      stars.push(
        <i 
          key={`star-${i}`}
          className={`fas fa-star ${filled ? 'text-warning' : 'text-muted opacity-25'}`}
          style={{ fontSize: size === 'lg' ? '1.2rem' : '1rem' }}
        ></i>
      );
    }
    return stars;
  }, []);

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading product details...</h4>
          <p className="text-muted">Please wait while we fetch information about this product.</p>
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
          <div className="d-flex gap-2 justify-content-center flex-wrap">
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

  // Product not found (safety check)
  if (!product || !product._id) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>
            <i className="fas fa-search me-2"></i>
            Product Not Found
          </Alert.Heading>
          <p>The product you're looking for doesn't exist or may no longer be available.</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="primary" onClick={() => navigate('/products')}>
              <i className="fas fa-shopping-bag me-2"></i>
              Browse All Products
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const stockStatus = getStockStatus();

  // ✅ FIXED: Main product display with safe rendering
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/')}>
              <i className="fas fa-home me-1"></i>
              Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="link" className="p-0" onClick={() => navigate('/products')}>
              <i className="fas fa-shopping-bag me-1"></i>
              Products
            </Button>
          </li>
          {product.category && (
            <li className="breadcrumb-item">
              <Button 
                variant="link" 
                className="p-0" 
                onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)}
              >
                {product.category}
              </Button>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {/* ✅ FIXED: Safe string rendering */}
            {product.name || 'Product Details'}
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
                item={product}
                category={product.category || 'product'}
                size="large"
                className="img-fluid"
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                showLoader={true}
                alt={`Photo of ${product.name || 'product'}`}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Product Information */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {/* Header with name and status */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="h2 mb-2">{product.name}</h1>
                  <p className="text-muted mb-2">
                    {product.brand} • {product.category}
                  </p>
                </div>
                <Badge 
                  bg={stockStatus.variant} 
                  className="fs-6 px-3 py-2"
                >
                  <i className={`fas fa-${stockStatus.icon} me-2`}></i>
                  {stockStatus.text}
                </Badge>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="h3 text-primary mb-0">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="h5 text-muted text-decoration-line-through mb-0">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <Badge bg="success">
                        Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Rating */}
              {product.rating && product.rating.count > 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex">
                      {renderStarRating(product.rating.average, 'lg')}
                    </div>
                    <span className="text-muted">
                      {product.rating.average.toFixed(1)} ({product.rating.count} review{product.rating.count > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              {product.inStock && (
                <div className="mb-4">
                  <Row className="align-items-center">
                    <Col xs={4}>
                      <label className="form-label small fw-bold">Quantity:</label>
                      <select 
                        className="form-select form-select-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                      >
                        {[...Array(Math.min(10, product.stockQuantity || 10))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </Col>
                    <Col xs={8}>
                      <Button 
                        variant="primary" 
                        size="lg"
                        className="w-100"
                        onClick={handleAddToCart}
                        disabled={addingToCart || product.inStock === false}
                      >
                        {addingToCart ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Adding to Cart...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-shopping-cart me-2"></i>
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Product Details */}
              <div className="border-top pt-3">
                <h6 className="mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Product Details
                </h6>
                <Row className="small">
                  <Col sm={6}>
                    {product.sku && (
                      <div className="mb-2">
                        <strong>SKU:</strong> {product.sku}
                      </div>
                    )}
                    <div className="mb-2">
                      <strong>Brand:</strong> {product.brand}
                    </div>
                    <div className="mb-2">
                      <strong>Category:</strong> {product.category}
                    </div>
                  </Col>
                  <Col sm={6}>
                    {product.weight && (
                      <div className="mb-2">
                        <strong>Weight:</strong> {product.weight}
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="mb-2">
                        <strong>Dimensions:</strong> {product.dimensions}
                      </div>
                    )}
                    <div className="mb-2">
                      <strong>Added:</strong> {formatDate(product.dateAdded)}
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Description Section */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-align-left me-2"></i>
            Product Description
          </h5>
          <p className="mb-0">{product.description}</p>
        </Card.Body>
      </Card>

      {/* Related Products */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="fas fa-shopping-bag me-2"></i>
            Explore More Products
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-primary" 
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

      {/* ✅ FIXED: Safe debug info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4 bg-light">
          <Card.Header>
            <h6 className="mb-0">
              <i className="fas fa-bug me-2"></i>
              Debug Information (Development Only)
            </h6>
          </Card.Header>
          <Card.Body>
            <details>
              <summary className="fw-bold mb-2">Product Data (Click to expand)</summary>
              <pre className="small" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {/* ✅ FIXED: Safe JSON.stringify with error handling */}
                {(() => {
                  try {
                    return JSON.stringify(product, null, 2);
                  } catch (error) {
                    return `Error serializing product data: ${error.message}`;
                  }
                })()}
              </pre>
            </details>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ProductDetail;