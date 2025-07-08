// client/src/pages/Products.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Form } from 'react-bootstrap';
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
      
      const response = await api.get(`/products?${params.toString()}`);
      
      if (response.data?.success) {
        setProducts(response.data.data || []);
      } else {
        setError('No products found');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data?.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await api.get('/products/brands');
      if (response.data?.success) {
        setBrands(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
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

  const getProductImageUrl = (product) => {
    const fallback = 'product/placeholder.png';
    if (!product) return `https://storage.googleapis.com/furbabies-petstore/${fallback}`;
    const rawImage = product.image || product.imageUrl || fallback;
    return `https://storage.googleapis.com/furbabies-petstore/${rawImage}`;
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">
          <i className="fas fa-shopping-cart me-3"></i>
          Pet Products
        </h1>
        <p className="lead text-muted">
          Everything your furry friends need for a happy, healthy life
        </p>
      </div>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="bg-light p-4 rounded">
            <h5 className="mb-3">
              <i className="fas fa-filter me-2"></i>
              Filter Products
            </h5>
            
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
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
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

              {/* Stock Status */}
              <Col md={2} className="mb-3">
                <Form.Group>
                  <Form.Label>Availability</Form.Label>
                  <Form.Select
                    value={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Sort */}
              <Col md={2} className="mb-3">
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="createdAt">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Clear Filters Button */}
              <Col md={1} className="mb-3 d-flex align-items-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                  className="w-100"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Results */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>
              {loading ? 'Loading...' : `${products.length} Products Found`}
            </h4>
          </div>
        </Col>
      </Row>

      {/* Error Message */}
      {error && (
        <Alert variant="warning" className="text-center mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
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
          ) : (
            <Col xs={12}>
              <Alert variant="info" className="text-center">
                <i className="fas fa-search me-2"></i>
                No products found matching your criteria.
                <div className="mt-2">
                  <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                    <i className="fas fa-refresh me-1"></i>
                    Clear Filters
                  </Button>
                </div>
              </Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default Products;