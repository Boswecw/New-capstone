// ===== 6. client/src/pages/admin/AdminProducts.js (COMPLETE UPDATED FILE) =====
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { normalizeImageUrl } from '../../utils/image';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get('/', {
        params: {
          limit: 50,
          sort: 'newest'
        }
      });
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(`/${productId}`);
        setProducts(products.filter(product => product._id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase()) ||
                         product.category?.toLowerCase().includes(search.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'inStock' && product.inStock) ||
                         (filter === 'outOfStock' && !product.inStock);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-bold">
              <i className="fas fa-box me-2 text-success"></i>
              Manage Products
            </h2>
            <Link to="/admin/products/new" className="btn btn-success">
              <i className="fas fa-plus me-2"></i>
              Add New Product
            </Link>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Products</option>
            <option value="inStock">In Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Products Table */}
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={normalizeImageUrl(product.image || product.imageUrl) || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop&q=80'}
                          alt={product.name}
                          className="rounded"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover' 
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop&q=80';
                          }}
                        />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small className="text-muted">ID: {product._id.slice(-8)}</small>
                      </td>
                      <td>
                        <Badge bg="secondary">{product.category}</Badge>
                      </td>
                      <td>{product.brand || 'Generic'}</td>
                      <td>
                        <strong className="text-success">${product.price || '0.00'}</strong>
                      </td>
                      <td>
                        <Badge bg={product.inStock ? 'success' : 'danger'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </td>
                      <td>
                        {product.featured ? (
                          <Badge bg="warning" text="dark">
                            <i className="fas fa-star me-1"></i>
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link 
                            to={`/products/${product._id}`} 
                            className="btn btn-outline-primary"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link 
                            to={`/admin/products/${product._id}/edit`} 
                            className="btn btn-outline-warning"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(product._id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-search fa-2x mb-3"></i>
                        <p>No products found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminProducts;