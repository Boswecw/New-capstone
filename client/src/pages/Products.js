// client/src/pages/Products.js - Products Listing Page
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const Products = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    brand: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch products with filters
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛍️ Products: Fetching products...', { filters, page });
      
      // Build query parameters
      const queryParams = {
        page,
        limit: itemsPerPage,
        ...filters
      };
      
      // Remove 'all' values and empty strings
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      const response = await productAPI.getAllProducts(queryParams);
      
      if (response.data?.success) {
        setProducts(response.data.data || []);
        setPagination(response.data.pagination || {});
        console.log(`✅ Loaded ${response.data.data?.length || 0} products`);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch products');
      }
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Unable to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching product categories...');
      const response = await productAPI.getProductCategories();
      
      if (response.data?.success) {
        setCategories(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} categories`);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
    }
  }, []);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      console.log('🏷️ Fetching product brands...');
      const response = await productAPI.getProductBrands();
      
      if (response.data?.success) {
        setBrands(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} brands`);
      }
    } catch (err) {
      console.error('❌ Error fetching brands:', err);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  // Fetch products when filters or page change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      brand: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setCurrentPage(1);
  };

  // Format price
  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : 'Price N/A';
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const totalPages = pagination.totalPages || 1;
    const current = currentPage;
    
    // Show pages around current page
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(totalPages, current + 2);
    
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === current}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h1 className="display-4 fw-bold mb-3">
              <i className="fas fa-shopping-bag text-primary me-3"></i>
              Pet Products
            </h1>
            <p className="lead text-muted">
              Everything your furry friends need for a happy, healthy life
            </p>
          </div>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filter Products
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {/* Search */}
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label>Search Products</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </Form.Group>
                </Col>

                {/* Category */}
                <Col md={2} className="mb-3">
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Brand */}
                <Col md={2} className="mb-3">
                  <Form.Group>
                    <Form.Label>Brand</Form.Label>
                    <Form.Select
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                    >
                      <option value="all">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Price Range */}
                <Col md={2} className="mb-3">
                  <Form.Group>
                    <Form.Label>Min Price</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="$0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={2} className="mb-3">
                  <Form.Group>
                    <Form.Label>Max Price</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="$999"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </Form.Group>
                </Col>

                {/* Sort */}
                <Col md={1} className="mb-3">
                  <Form.Group>
                    <Form.Label>Sort</Form.Label>
                    <Form.Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                    >
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="price-asc">Price Low-High</option>
                      <option value="price-desc">Price High-Low</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Filter Actions */}
              <Row>
                <Col>
                  <Button variant="outline-secondary" onClick={clearFilters} className="me-2">
                    <i className="fas fa-undo me-2"></i>
                    Clear Filters
                  </Button>
                  <Button variant="outline-primary" as={Link} to="/">
                    <i className="fas fa-home me-2"></i>
                    Back to Home
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Summary */}
      {!loading && (
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {pagination.totalItems ? (
                  <>
                    Showing {products.length} of {pagination.totalItems} products
                    <Badge bg="primary" className="ms-2">{pagination.totalItems}</Badge>
                  </>
                ) : (
                  'No products found'
                )}
              </h5>
            </div>
          </Col>
        </Row>
      )}

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {loading ? (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" variant="primary" size="lg" />
            <h5 className="mt-3">Loading Products...</h5>
            <p className="text-muted">Finding the best products for your pets</p>
          </Col>
        </Row>
      ) : (
        <>
          {/* Products Grid */}
          {products.length > 0 ? (
            <Row>
              {products.map((product) => (
                <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm product-card">
                    {/* Product Image */}
                    <div className="position-relative overflow-hidden" style={{ height: '250px' }}>
                      <Card.Img
                        variant="top"
                        src={product.imageUrl || product.image || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop'}
                        alt={product.name}
                        className="h-100 w-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop';
                        }}
                      />
                      
                      {/* Stock Badge */}
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge bg={product.inStock ? 'success' : 'danger'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>

                    <Card.Body className="d-flex flex-column">
                      {/* Product Info */}
                      <div className="mb-2">
                        <Badge bg="secondary" className="mb-2">
                          {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
                        </Badge>
                        <Card.Title className="h5">{product.name}</Card.Title>
                        <Card.Subtitle className="text-muted mb-2">
                          {product.brand}
                        </Card.Subtitle>
                      </div>

                      {/* Description */}
                      <Card.Text className="text-muted mb-3 flex-grow-1">
                        {product.description || 'Quality product for your pet\'s needs.'}
                      </Card.Text>

                      {/* Price and Actions */}
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-success mb-0">
                            {formatPrice(product.price)}
                          </h5>
                        </div>
                        
                        <div className="d-grid gap-2">
                          <Button 
                            variant="primary" 
                            as={Link} 
                            to={`/products/${product._id}`}
                            disabled={!product.inStock}
                          >
                            <i className="fas fa-eye me-2"></i>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row>
              <Col>
                <Alert variant="info" className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h4>No Products Found</h4>
                  <p>Try adjusting your search criteria or browse our featured products.</p>
                  <Button variant="outline-primary" onClick={clearFilters} className="me-2">
                    <i className="fas fa-undo me-2"></i>
                    Clear Filters
                  </Button>
                  <Button variant="primary" as={Link} to="/">
                    <i className="fas fa-home me-2"></i>
                    Browse Featured
                  </Button>
                </Alert>
              </Col>
            </Row>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Row className="mt-4">
              <Col>
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.First 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                    />
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                    
                    {generatePaginationItems()}
                    
                    <Pagination.Next 
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                    <Pagination.Last 
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.totalPages)}
                    />
                  </Pagination>
                </div>
                
                <div className="text-center mt-2">
                  <small className="text-muted">
                    Page {currentPage} of {pagination.totalPages} 
                    ({pagination.totalItems} total products)
                  </small>
                </div>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      `}</style>
    </Container>
  );
};

export default Products;