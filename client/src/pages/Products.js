// client/src/pages/Products.js - FIXED VERSION with correct API usage
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Form } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../services/api'; // ✅ FIXED: Import specific API service

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

  // ✅ FIXED: Use productAPI service methods
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.brand !== 'all') params.brand = filters.brand;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      if (filters.inStock !== 'all') params.inStock = filters.inStock;
      
      console.log('🛒 Fetching products with params:', params);
      
      // ✅ FIXED: Use productAPI.getAllProducts instead of direct api.get
      const response = await productAPI.getAllProducts(params);
      
      console.log('🛒 Products response:', response);
      
      // Handle response structure
      if (response.data?.success) {
        setProducts(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} products`);
      } else if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
        console.log(`✅ Loaded ${response.data.length} products`);
      } else {
        setError('No products found');
        setProducts([]);
        console.log('⚠️ No products in response');
      }
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ FIXED: Use productAPI service method
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching product categories...');
      
      // ✅ FIXED: Use productAPI.getProductCategories instead of direct api.get
      const response = await productAPI.getProductCategories();
      
      console.log('📂 Categories response:', response);
      
      if (response.data?.success) {
        setCategories(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} categories`);
      } else {
        console.log('⚠️ No categories found');
        setCategories([]);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setCategories([]);
    }
  }, []);

  // ✅ FIXED: Use productAPI service method  
  const fetchBrands = useCallback(async () => {
    try {
      console.log('🏷️ Fetching product brands...');
      
      // ✅ FIXED: Use productAPI.getProductBrands instead of direct api.get
      const response = await productAPI.getProductBrands();
      
      console.log('🏷️ Brands response:', response);
      
      if (response.data?.success) {
        setBrands(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} brands`);
      } else {
        console.log('⚠️ No brands found');
        setBrands([]);
      }
    } catch (err) {
      console.error('❌ Error fetching brands:', err);
      setBrands([]);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [fetchProducts, fetchCategories, fetchBrands]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      brand: 'all',
      search: '',
      sort: 'createdAt',
      inStock: 'all'
    });
  };

  const handleRetry = () => {
    setError('');
    fetchProducts();
    fetchCategories();
    fetchBrands();
  };

  return (
    <Container className="py-4" style={{ marginTop: '80px' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-primary mb-2">
          <i className="fas fa-shopping-bag me-2"></i>
          Pet Products
        </h1>
        <p className="lead text-muted">Everything your pet needs for a happy life</p>
      </div>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category.name || category}>
                  {category.name || category}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>Brand</Form.Label>
            <Form.Select 
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="all">All Brands</option>
              {brands.map((brand, index) => (
                <option key={index} value={brand.name || brand}>
                  {brand.name || brand}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>Sort By</Form.Label>
            <Form.Select 
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="createdAt">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="price">Price Low-High</option>
              <option value="-price">Price High-Low</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>Availability</Form.Label>
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
      </Row>

      {/* Search and Clear */}
      <Row className="mb-4">
        <Col md={9}>
          <Form.Control
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
            <i className="fas fa-times me-1"></i>
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" className="text-primary mb-3" />
          <p className="text-muted">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert variant="danger" className="text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Error: </strong>{error}
          <div className="mt-3">
            <Button variant="outline-danger" onClick={handleRetry}>
              <i className="fas fa-redo me-1"></i>
              Try Again
            </Button>
          </div>
        </Alert>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {/* Results Summary */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              {products.length} {products.length === 1 ? 'Product' : 'Products'} Found
            </h5>
          </div>

          {products.length > 0 ? (
            <Row>
              {products.map((product) => (
                <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-shopping-bag display-1 text-muted mb-3"></i>
              <h4>No products found</h4>
              <p className="text-muted mb-4">
                Try adjusting your search criteria or check back later for new products.
              </p>
              <Button variant="outline-primary" onClick={clearFilters}>
                <i className="fas fa-times me-1"></i>
                Clear All Filters
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Products;