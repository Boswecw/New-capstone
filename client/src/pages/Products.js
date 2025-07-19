// client/src/pages/Products.js - FIXED Product browsing component
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // ✅ FIXED: Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    brand: searchParams.get('brand') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featured: searchParams.get('featured') || 'all',
    sort: searchParams.get('sort') || 'name'
  });
  
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const itemsPerPage = 12;

  // Available sort options
  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'price', label: 'Price Low to High' },
    { value: 'price-desc', label: 'Price High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'featured', label: 'Featured First' }
  ];

  // ✅ FIXED: Watch for URL parameter changes
  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || 'all',
      brand: searchParams.get('brand') || 'all',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      featured: searchParams.get('featured') || 'all',
      sort: searchParams.get('sort') || 'name'
    };
    
    const newPage = parseInt(searchParams.get('page')) || 1;
    
    console.log('🌐 Products URL changed - Current search params:', Object.fromEntries(searchParams.entries()));
    console.log('🔄 Products URL parameters changed, updating filters:', newFilters);
    
    setFilters(newFilters);
    setCurrentPage(newPage);
  }, [searchParams]);

  // ✅ FIXED: Improved product navigation
  const handleProductClick = useCallback((productId) => {
    console.log('🛍️ Navigating to product:', productId);
    navigate(`/products/${productId}`);
  }, [navigate]);

  const handleFilterReset = useCallback(() => {
    const newFilters = {
      search: '',
      category: 'all',
      brand: 'all',
      minPrice: '',
      maxPrice: '',
      featured: 'all',
      sort: 'name'
    };
    setFilters(newFilters);
    setCurrentPage(1);
    navigate('/products', { replace: true });
  }, [navigate]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters, page = 1) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });
    
    if (page > 1) {
      params.set('page', page.toString());
    }

    const newURL = params.toString() ? `/products?${params.toString()}` : '/products';
    navigate(newURL, { replace: true });
  }, [navigate]);

  // ✅ FIXED: Improved fetchProducts with better error handling
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛍️ Products: Fetching products with filters:', filters);
      if (filters.category !== 'all') {
        console.log(`🏷️ Filtering by category: ${filters.category}`);
      }
      
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      
      // Remove 'all' values from query
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      console.log('📡 Products API Query Parameters:', queryParams);
      
      const response = await productAPI.getAllProducts(queryParams);
      
      if (response?.data?.success) {
        setProducts(response.data.data || []);
        setPagination(response.data.pagination || {});
        console.log(`✅ Loaded ${response.data.data?.length || 0} products matching filters`);
        
        if (filters.category !== 'all') {
          console.log(`🎯 Successfully filtered ${response.data.data?.length || 0} products in ${filters.category}`);
        }
      } else {
        throw new Error('Failed to fetch products');
      }
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // ✅ FIXED: Safe fetchCategories with fallback
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching product categories...');
      const response = await productAPI.getProductCategories();
      
      if (response?.data?.success) {
        setCategories(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} categories`);
      } else {
        // ✅ FIXED: Fallback categories if API fails
        console.log('⚠️ Categories API failed, using fallback categories');
        setCategories(['Dog Care', 'Cat Care', 'Aquarium & Fish Care', 'Training & Behavior', 'Grooming & Health']);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      // ✅ FIXED: Fallback categories
      setCategories(['Dog Care', 'Cat Care', 'Aquarium & Fish Care', 'Training & Behavior', 'Grooming & Health']);
    }
  }, []);

  // ✅ FIXED: Safe fetchBrands with fallback
  const fetchBrands = useCallback(async () => {
    try {
      console.log('🏷️ Fetching product brands...');
      const response = await productAPI.getProductBrands();
      
      if (response?.data?.success) {
        setBrands(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} brands`);
      } else {
        // ✅ FIXED: Fallback brands if API fails
        console.log('⚠️ Brands API failed, using fallback brands');
        setBrands(['Generic', 'Premium Pet', 'AquaWorld', 'PetPlus']);
      }
    } catch (err) {
      console.error('❌ Error fetching brands:', err);
      // ✅ FIXED: Fallback brands
      setBrands(['Generic', 'Premium Pet', 'AquaWorld', 'PetPlus']);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  }, [filters, updateURL]);

  // Handle page changes
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    updateURL(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, updateURL]);

  // Handle search
  const handleSearch = useCallback((searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  }, [filters, updateURL]);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  // Load products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ FIXED: Safe price formatting
  const formatPrice = useCallback((price) => {
    if (typeof price === 'number' && price >= 0) {
      return `$${price.toFixed(2)}`;
    }
    return '$0.00';
  }, []);

  // Generate pagination items
  const paginationItems = useMemo(() => {
    const items = [];
    const totalPages = pagination.totalPages || 1;
    const current = currentPage;
    
    if (totalPages <= 1) return items;
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev"
        disabled={current === 1}
        onClick={() => handlePageChange(current - 1)}
      />
    );
    
    // Page numbers
    for (let page = 1; page <= totalPages; page++) {
      if (
        page === 1 || 
        page === totalPages || 
        (page >= current - 2 && page <= current + 2)
      ) {
        items.push(
          <Pagination.Item
            key={page}
            active={page === current}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        );
      } else if (
        page === current - 3 || 
        page === current + 3
      ) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${page}`} />);
      }
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next"
        disabled={current === totalPages}
        onClick={() => handlePageChange(current + 1)}
      />
    );
    
    return items;
  }, [pagination.totalPages, currentPage, handlePageChange]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading products...</h4>
          <p className="text-muted">Please wait while we fetch our product catalog.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">
            <i className="fas fa-shopping-bag me-2"></i>
            Pet Products
            {/* ✅ FIXED: Show active filter in title */}
            {filters.category !== 'all' && (
              <Badge bg="primary" className="ms-2">
                {filters.category}
              </Badge>
            )}
            {filters.featured === 'true' && (
              <Badge bg="warning" className="ms-2">
                <i className="fas fa-star me-1"></i>
                Featured
              </Badge>
            )}
          </h1>
          <p className="text-muted mb-0">
            {pagination.total 
              ? `Found ${pagination.total} product${pagination.total > 1 ? 's' : ''} for your pets` 
              : 'Everything your pets need and more'}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={handleFilterReset}
            size="sm"
          >
            <i className="fas fa-undo me-1"></i>
            Reset Filters
          </Button>
          <Button 
            variant="outline-success" 
            onClick={() => handleFilterChange('featured', 'true')}
            size="sm"
          >
            <i className="fas fa-star me-1"></i>
            Featured Only
          </Button>
        </div>
      </div>

      {/* ✅ FIXED: Active Filters Display */}
      {(filters.category !== 'all' || filters.brand !== 'all' || filters.featured !== 'all' || 
        filters.search || filters.minPrice || filters.maxPrice) && (
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <small className="text-muted fw-bold">Active Filters:</small>
            {filters.search && (
              <Badge bg="info" className="d-flex align-items-center">
                <i className="fas fa-search me-1"></i>
                "{filters.search}"
                <button 
                  className="btn btn-link btn-sm text-white p-0 ms-1"
                  onClick={() => handleFilterChange('search', '')}
                  style={{ fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.category !== 'all' && (
              <Badge bg="primary" className="d-flex align-items-center">
                <i className="fas fa-tag me-1"></i>
                {filters.category}
                <button 
                  className="btn btn-link btn-sm text-white p-0 ms-1"
                  onClick={() => handleFilterChange('category', 'all')}
                  style={{ fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.brand !== 'all' && (
              <Badge bg="secondary" className="d-flex align-items-center">
                <i className="fas fa-building me-1"></i>
                {filters.brand}
                <button 
                  className="btn btn-link btn-sm text-white p-0 ms-1"
                  onClick={() => handleFilterChange('brand', 'all')}
                  style={{ fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.featured === 'true' && (
              <Badge bg="warning" className="d-flex align-items-center">
                <i className="fas fa-star me-1"></i>
                Featured
                <button 
                  className="btn btn-link btn-sm text-white p-0 ms-1"
                  onClick={() => handleFilterChange('featured', 'all')}
                  style={{ fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge bg="success" className="d-flex align-items-center">
                <i className="fas fa-dollar-sign me-1"></i>
                ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                <button 
                  className="btn btn-link btn-sm text-white p-0 ms-1"
                  onClick={() => {
                    handleFilterChange('minPrice', '');
                    handleFilterChange('maxPrice', '');
                  }}
                  style={{ fontSize: '0.7rem' }}
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}

      <Row>
        {/* Filters Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filter Products
              </h6>
            </Card.Header>
            <Card.Body className="p-3">
              {/* Search */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Search Products</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Form.Group>

              {/* Category */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Category</Form.Label>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Brand */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Brand</Form.Label>
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

              {/* Price Range */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Price Range</Form.Label>
                <Row>
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="Min"
                      min="0"
                      step="0.01"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="Max"
                      min="0"
                      step="0.01"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </Col>
                </Row>
              </Form.Group>

              {/* Featured */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Featured Products Only"
                  checked={filters.featured === 'true'}
                  onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : 'all')}
                />
              </Form.Group>

              {/* Sort */}
              <Form.Group className="mb-0">
                <Form.Label className="fw-bold small">Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Results */}
        <Col lg={9}>
          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              {loading && <Spinner size="sm" animation="border" className="me-2" />}
              <span className="text-muted">
                {pagination.total > 0 
                  ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, pagination.total)} of ${pagination.total} products`
                  : 'No products found'
                }
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error Loading Products
              </Alert.Heading>
              <p className="mb-0">{error}</p>
              <hr />
              <Button variant="outline-danger" onClick={fetchProducts}>
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
            </Alert>
          )}

          {/* No Results */}
          {!loading && !error && products.length === 0 && (
            <Alert variant="info" className="text-center">
              <Alert.Heading>
                <i className="fas fa-search me-2"></i>
                No Products Found
              </Alert.Heading>
              <p>Try adjusting your filters to find more products.</p>
              <Button variant="primary" onClick={handleFilterReset}>
                <i className="fas fa-undo me-2"></i>
                Reset All Filters
              </Button>
            </Alert>
          )}

          {/* Product Grid */}
          {products.length > 0 && (
            <>
              <Row>
                {products.map((product) => (
                  <Col key={product._id} sm={6} lg={4} className="mb-4">
                    <Card 
                      className="h-100 shadow-sm product-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleProductClick(product._id)} // ✅ FIXED: Use products navigation
                    >
                      <div className="position-relative">
                        <SafeImage
                          item={product}
                          category={product.category || 'product'}
                          size="card"
                          className="card-img-top"
                          style={{ height: '200px', objectFit: 'cover' }}
                          alt={`Photo of ${product.name}`}
                        />
                        
                        {/* Status Badges */}
                        <div className="position-absolute top-0 start-0 p-2">
                          {product.featured && (
                            <Badge bg="warning" className="me-1">
                              <i className="fas fa-star me-1"></i>
                              Featured
                            </Badge>
                          )}
                          {product.inStock === false && (
                            <Badge bg="danger">
                              <i className="fas fa-times me-1"></i>
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h6 mb-2">{product.name}</Card.Title>
                        
                        <div className="mb-2">
                          {product.category && (
                            <Badge bg="secondary" className="me-2">
                              {product.category}
                            </Badge>
                          )}
                          {product.brand && (
                            <Badge bg="info">
                              {product.brand}
                            </Badge>
                          )}
                        </div>
                        
                        {product.description && (
                          <Card.Text className="small mb-3 flex-grow-1">
                            {product.description.length > 100 
                              ? `${product.description.substring(0, 100)}...` 
                              : product.description
                            }
                          </Card.Text>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <span className="h6 text-primary mb-0">
                            {formatPrice(product.price)}
                          </span>
                          
                          <Button 
                            size="sm" 
                            variant={product.inStock === false ? "outline-secondary" : "primary"}
                            disabled={product.inStock === false}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              if (product.inStock !== false) {
                                handleProductClick(product._id);
                              }
                            }}
                          >
                            {product.inStock === false ? (
                              <>
                                <i className="fas fa-times me-1"></i>
                                Out of Stock
                              </>
                            ) : (
                              <>
                                <i className="fas fa-info-circle me-1"></i>
                                View Details
                              </>
                            )}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination size="lg">
                    {paginationItems}
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>

      {/* Floating Action Button for Mobile */}
      <div className="d-lg-none">
        <Button
          variant="primary"
          className="position-fixed bottom-0 end-0 m-3 rounded-circle"
          style={{ zIndex: 1000, width: '60px', height: '60px' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fas fa-arrow-up"></i>
        </Button>
      </div>
    </Container>
  );
};

export default Products;