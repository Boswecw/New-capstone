// client/src/pages/Products.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    brand: 'all',
    search: '',
    sort: 'createdAt',
    inStock: 'all'
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.brand !== 'all') params.append('brand', filters.brand);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.inStock !== 'all') params.append('inStock', filters.inStock);
      
      console.log('🛍️ Fetching products with params:', params.toString());
      const response = await api.get(`/products?${params.toString()}`);
      
      if (response.data?.success) {
        const productData = response.data.data || [];
        setProducts(productData);
        setTotalProducts(productData.length);
        console.log('✅ Products loaded:', productData.length);
      } else {
        setError('No products found');
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching categories...');
      const response = await api.get('/products/categories');
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Filter out invalid categories and ensure we have the _id field
        const validCategories = response.data.data.filter(
          category => category && typeof category === 'object' && category._id
        );
        setCategories(validCategories);
        console.log('✅ Categories loaded:', validCategories.length);
      } else {
        console.warn('⚠️ Invalid categories response:', response.data);
        setCategories([]);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setCategories([]);
    }
  }, []);

  // Fetch brands from API
  const fetchBrands = useCallback(async () => {
    try {
      console.log('🏷️ Fetching brands...');
      const response = await api.get('/products/brands');
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Filter out invalid brands and ensure we have the _id field
        const validBrands = response.data.data.filter(
          brand => brand && typeof brand === 'object' && brand._id
        );
        setBrands(validBrands);
        console.log('✅ Brands loaded:', validBrands.length);
      } else {
        console.warn('⚠️ Invalid brands response:', response.data);
        setBrands([]);
      }
    } catch (err) {
      console.error('❌ Error fetching brands:', err);
      setBrands([]);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load filter options on mount
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    console.log(`🔧 Filter changed: ${field} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      category: 'all',
      brand: 'all',
      search: '',
      sort: 'createdAt',
      inStock: 'all'
    });
  };

  // Generate product image URL with fallback
  const getProductImageUrl = (product) => {
    const fallback = 'product/placeholder.png';
    if (!product) {
      return `https://storage.googleapis.com/furbabies-petstore/${fallback}`;
    }
    const rawImage = product.image || product.imageUrl || fallback;
    return `https://storage.googleapis.com/furbabies-petstore/${rawImage}`;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.category !== 'all' ||
      filters.brand !== 'all' ||
      filters.search !== '' ||
      filters.inStock !== 'all'
    );
  };

  return (
    <Container className="py-4">
      {/* Header Section */}
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">
          <i className="fas fa-shopping-cart me-3 text-primary"></i>
          Pet Products
        </h1>
        <p className="lead text-muted">
          Everything your furry friends need for a happy, healthy life
        </p>
        {totalProducts > 0 && (
          <Badge bg="secondary" className="fs-6">
            {totalProducts} product{totalProducts !== 1 ? 's' : ''} available
          </Badge>
        )}
      </div>

      {/* Filters Section */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="bg-light p-4 rounded shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filter Products
              </h5>
              {hasActiveFilters() && (
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={clearFilters}
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-times me-1"></i>
                  Clear Filters
                </Button>
              )}
            </div>
            
            <Row>
              {/* Search */}
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-search me-1"></i>
                    Search
                  </Form.Label>
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
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-tags me-1"></i>
                    Category
                  </Form.Label>
                  <Form.Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category._id} ({category.count || 0})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Brand */}
              <Col md={2} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-building me-1"></i>
                    Brand
                  </Form.Label>
                  <Form.Select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  >
                    <option value="all">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>
                        {brand._id} ({brand.count || 0})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Stock Status */}
              <Col md={2} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-boxes me-1"></i>
                    Availability
                  </Form.Label>
                  <Form.Select
                    value={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="true">In Stock Only</option>
                    <option value="false">Out of Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Sort */}
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <i className="fas fa-sort me-1"></i>
                    Sort By
                  </Form.Label>
                  <Form.Select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="createdAt">Newest First</option>
                    <option value="-createdAt">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="-name">Name (Z-A)</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="-price">Price (High to Low)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>
                <strong>Error:</strong> {error}
                <div className="mt-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={fetchProducts}
                  >
                    <i className="fas fa-retry me-1"></i>
                    Try Again
                  </Button>
                </div>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading amazing products for your pets...</p>
        </div>
      ) : (
        /* Products Grid */
        <Row className="g-4">
          {products.length > 0 ? (
            products.map((product) => (
              <Col key={product._id} md={6} lg={4} xl={3}>
                <ProductCard 
                  product={product} 
                  imageUrl={getProductImageUrl(product)} 
                />
              </Col>
            ))
          ) : !error ? (
            <Col xs={12}>
              <div className="text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-search fa-3x text-muted"></i>
                </div>
                <h4 className="text-muted mb-3">No Products Found</h4>
                <p className="text-muted mb-4">
                  {hasActiveFilters() 
                    ? "Try adjusting your filters to see more products."
                    : "We're working on adding more amazing products for your pets!"
                  }
                </p>
                {hasActiveFilters() && (
                  <Button 
                    variant="primary" 
                    onClick={clearFilters}
                    className="d-flex align-items-center mx-auto"
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </Col>
          ) : null}
        </Row>
      )}

      {/* Results Summary */}
      {!loading && products.length > 0 && (
        <Row className="mt-4">
          <Col>
            <div className="text-center text-muted">
              <small>
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
                {hasActiveFilters() && ' matching your filters'}
              </small>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Products;