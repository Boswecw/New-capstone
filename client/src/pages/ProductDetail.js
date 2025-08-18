// ===== ENHANCED ProductDetail.js - Complete Updated File =====
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaArrowLeft, 
  FaShare,
  FaLayerGroup,
  FaBoxes,
  FaTruck,
  FaInfoCircle,
  FaDollarSign,
  FaCalculator,
  FaStar,
  FaStarHalfAlt
} from 'react-icons/fa';
import { api } from '../services/api';
import { getProductImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

// Import enhanced styling
import '../styles/components.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);

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

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price && price !== 0) return '0.00';
    return typeof price === 'number' ? price.toFixed(2) : price;
  };

  // Helper function to get stock status
  const getStockStatus = (product) => {
    const stock = product.stock_quantity || product.stock || 0;
    if (stock > 10) return { status: 'In Stock', variant: 'success', icon: '✅' };
    if (stock > 0) return { status: 'Low Stock', variant: 'warning', icon: '⚠️' };
    return { status: 'Out of Stock', variant: 'danger', icon: '❌' };
  };

  // Helper function to render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-muted" />);
    }
    
    return stars;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Loading product details...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <FaInfoCircle className="me-2" />
              <strong>Error:</strong> {error}
              
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/products')}
                  className="me-2"
                >
                  <FaArrowLeft className="me-2" />
                  Browse All Products
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // No product found
  if (!product) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              Product not found.
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  const stockInfo = getStockStatus(product);
  const stockQuantity = product.stock_quantity || product.stock || 0;
  const maxQuantity = Math.min(10, stockQuantity);

  // Success state - render product details
  return (
    <Container className="py-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/products')}
          className="detailButton"
        >
          <FaArrowLeft className="me-2" />
          Back to Products
        </Button>
      </div>

      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="detailCard">
            {/* Enhanced Product Image */}
            <div className="detailImgContainer productDetailImgContainer">
              <img 
                src={getProductImageUrl(product.image_url || product.image)} 
                alt={product.name || 'Product'}
                className={`detailImg ${imageLoading ? 'loading' : ''}`}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  console.log('🖼️ Image error, using fallback');
                  e.target.src = FALLBACK_IMAGES.product;
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <div className="detailImageError">
                  <Spinner animation="border" variant="secondary" />
                  <span className="error-text mt-2">Loading image...</span>
                </div>
              )}
            </div>

            <Card.Body className="detailCardBody">
              {/* Product Name & Category */}
              <div className="mb-3">
                <h1 className="detailTitle">
                  {product.name || 'Unnamed Product'}
                </h1>
                {product.brand && (
                  <h5 className="text-muted">
                    by {product.brand}
                  </h5>
                )}
              </div>

              {/* Product Rating */}
              {product.rating && (
                <div className="text-center mb-3">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <div className="d-flex">
                      {renderStarRating(product.rating)}
                    </div>
                    <span className="text-muted">
                      ({product.rating}/5) • {product.reviews || 0} reviews
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Status Badge */}
              <div className="text-center mb-4">
                <Badge 
                  className={`detailBadge badge-${stockInfo.variant}`}
                >
                  {stockInfo.icon} {stockInfo.status}
                </Badge>
              </div>

              {/* Enhanced Product Info Grid */}
              <div className="detailInfoGrid">
                <div className="detailInfoItem">
                  <FaDollarSign />
                  <div className="info-content">
                    <div className="info-label">Price</div>
                    <div className="info-value">${formatPrice(product.price)}</div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaLayerGroup />
                  <div className="info-content">
                    <div className="info-label">Category</div>
                    <div className="info-value">
                      {product.category?.charAt(0).toUpperCase() + product.category?.slice(1) || 'General'}
                    </div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaBoxes />
                  <div className="info-content">
                    <div className="info-label">Stock</div>
                    <div className="info-value">{stockQuantity} units</div>
                  </div>
                </div>
                
                <div className="detailInfoItem">
                  <FaTruck />
                  <div className="info-content">
                    <div className="info-label">Shipping</div>
                    <div className="info-value">
                      {product.free_shipping ? 'Free Delivery' : 'Standard Shipping'}
                    </div>
                  </div>
                </div>

                {product.weight && (
                  <div className="detailInfoItem">
                    <i className="fas fa-weight-hanging"></i>
                    <div className="info-content">
                      <div className="info-label">Weight</div>
                      <div className="info-value">{product.weight}</div>
                    </div>
                  </div>
                )}

                {product.dimensions && (
                  <div className="detailInfoItem">
                    <i className="fas fa-ruler-combined"></i>
                    <div className="info-content">
                      <div className="info-label">Dimensions</div>
                      <div className="info-value">{product.dimensions}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Description */}
              {product.description && (
                <div>
                  <h3 className="detailSectionHeader">Product Details</h3>
                  <p className="detailDescription">{product.description}</p>
                </div>
              )}

              {/* Features or Specifications */}
              {product.features && (
                <div>
                  <h3 className="detailSectionHeader">Features</h3>
                  <p className="detailDescription">{product.features}</p>
                </div>
              )}

              {/* Quantity Selector (Only if in stock) */}
              {stockQuantity > 0 && (
                <div className="detailInfoItem mb-3">
                  <FaCalculator />
                  <div className="info-content">
                    <div className="info-label">Quantity</div>
                    <div className="info-value">
                      <Form.Select 
                        value={quantity} 
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        style={{ width: '100px', display: 'inline-block' }}
                        className="form-select-sm"
                      >
                        {[...Array(maxQuantity)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </Form.Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="d-grid gap-3 mt-4">
                {stockQuantity > 0 ? (
                  <Button className="detailButton btn-primary" size="lg">
                    <FaShoppingCart className="me-2" />
                    Add to Cart - ${(parseFloat(formatPrice(product.price)) * quantity).toFixed(2)}
                  </Button>
                ) : (
                  <Button className="detailButton btn-secondary" size="lg" disabled>
                    <FaBoxes className="me-2" />
                    Out of Stock
                  </Button>
                )}
                
                <Row>
                  <Col>
                    <Button className="detailButton btn-outline-primary w-100">
                      <FaHeart className="me-2" />
                      Add to Wishlist
                    </Button>
                  </Col>
                  <Col>
                    <Button 
                      className="detailButton btn-outline-secondary w-100"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: product.name,
                            text: `Check out this ${product.category} - ${product.name}!`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                    >
                      <FaShare className="me-2" />
                      Share
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Additional Product Information */}
              {(product.ingredients || product.materials) && (
                <div className="mt-4">
                  <h3 className="detailSectionHeader">
                    {product.ingredients ? 'Ingredients' : 'Materials'}
                  </h3>
                  <p className="detailDescription">
                    {product.ingredients || product.materials}
                  </p>
                </div>
              )}

              {/* Care Instructions */}
              {product.care_instructions && (
                <div>
                  <h3 className="detailSectionHeader">Care Instructions</h3>
                  <p className="detailDescription">{product.care_instructions}</p>
                </div>
              )}

              {/* Product ID for reference */}
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Product ID: {product._id}
                  {product.sku && ` • SKU: ${product.sku}`}
                  {product.brand && ` • Brand: ${product.brand}`}
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