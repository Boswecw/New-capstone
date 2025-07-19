// client/src/pages/Products.js - Updated to use SafeImage
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

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

  // Render pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const currentPageNum = pagination.currentPage || 1;
    const totalPages = pagination.totalPages;

    // Calculate page range
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPageNum === 1}
        onClick={() => handlePageChange(currentPageNum - 1)}
      />
    );

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        pages.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPageNum}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      pages.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    pages.push(
      <Pagination.Next
        key="next"
        disabled={currentPageNum === totalPages}
        onClick={() => handlePageChange(currentPageNum + 1)}
      />
    );

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>{pages}</Pagination>
      </div>
    );
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-4 mb-3">Pet Products</h1>
        <p className="lead text-muted">
          Everything your furry, feathered, or scaled friends need
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            {/* Search */}
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
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
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
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
                  {brands.map((brand, index) => (
                    <option key={index} value={brand}>
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

            {/* Clear Filters */}
            <Col md={1} className="mb-3 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                Clear
              </Button>
            </Col>
          </Row>

          {/* Sort Options */}
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="category">Category</option>
                  <option value="brand">Brand</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Order</Form.Label>
                <Form.Select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={7} className="d-flex align-items-end">
              {pagination.totalItems && (
                <small className="text-muted">
                  Showing {products.length} of {pagination.totalItems} products
                </small>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-5">
              <h4 className="text-muted">No products found</h4>
              <p className="text-muted">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <Row>
              {products.map((product) => (
                <Col key={product._id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm product-card">
                    {/* Product Image - USING UNIFIED SAFEIMAGE */}
                    <SafeImage
                      item={product}
                      category="product"
                      size="card"
                      className="card-img-top"
                      showLoader={true}
                    />
                    
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h6 mb-2">
                        {product.name}
                      </Card.Title>
                      
                      <Card.Text className="text-muted small mb-2 flex-grow-1">
                        {product.description && product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description || 'No description available'
                        }
                      </Card.Text>
                      
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
                      
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="h5 mb-0 text-primary">
                          {formatPrice(product.price)}
                        </span>
                        
                        <Button
                          as={Link}
                          to={`/products/${product._id}`}
                          variant="primary"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                      
                      {product.inStock === false && (
                        <Badge bg="danger" className="mt-2">
                          Out of Stock
                        </Badge>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default Products;