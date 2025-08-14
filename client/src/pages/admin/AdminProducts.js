// client/src/pages/admin/AdminProducts.js - FIXED IMAGE IMPORTS
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils'; // ✅ FIXED: Use consolidated utility

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productAPI.get('/', {
        params: {
          limit: 50,
          sort: 'newest'
        }
      });

      const productData = response.data?.data || [];
      setProducts(productData);
      console.log('✅ Loaded products for admin:', productData.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    setDeleteModal({ show: true, product });
  };

  const confirmDelete = async () => {
    if (!deleteModal.product) return;
    
    try {
      setDeleting(true);
      await productAPI.delete(`/${deleteModal.product._id}`);
      
      // Remove from local state
      setProducts(products.filter(p => p._id !== deleteModal.product._id));
      setDeleteModal({ show: false, product: null });
      
      console.log('✅ Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleStockToggle = async (product) => {
    try {
      const response = await productAPI.patch(`/${product._id}/toggle-stock`);

      if (response.data?.success) {
        // Update local state
        setProducts(products.map(p => 
          p._id === product._id ? { ...p, inStock: !p.inStock } : p
        ));
        console.log(`✅ Product stock updated: ${product.name}`);
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      setError('Failed to update product stock.');
    }
  };

  // Filter products based on search and filter criteria
  const filteredProducts = products.filter(product => {
    const matchesSearch = search === '' || 
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.brand?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' ||
      (filter === 'inStock' && product.inStock) ||
      (filter === 'outOfStock' && !product.inStock) ||
      (filter === 'featured' && product.featured);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading products...</span>
          </Spinner>
          <p className="mt-2">Loading products...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold">
                <i className="fas fa-box me-2 text-success"></i>
                Manage Products ({products.length})
              </h2>
              <p className="text-muted">Manage product catalog and inventory</p>
            </div>
            <Link to="/admin/products/new" className="btn btn-success">
              <i className="fas fa-plus me-2"></i>
              Add New Product
            </Link>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Products</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name, brand, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Stock</Form.Label>
            <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Products ({products.length})</option>
              <option value="inStock">In Stock ({products.filter(p => p.inStock).length})</option>
              <option value="outOfStock">Out of Stock ({products.filter(p => !p.inStock).length})</option>
              <option value="featured">Featured ({products.filter(p => p.featured).length})</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group>
            <Form.Label>&nbsp;</Form.Label>
            <Button variant="outline-secondary" className="w-100" onClick={fetchProducts}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </Form.Group>
        </Col>
      </Row>

      {/* Products Table */}
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover className="bg-white">
              <thead className="table-dark">
                <tr>
                  <th>Image</th>
                  <th>Product Details</th>
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
                          src={getImageUrl(product.image || product.imageUrl, 'product', product.category) || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop&q=80'}
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
                        <small className="text-muted">ID: {product._id?.slice(-8)}</small>
                      </td>
                      <td>
                        <Badge bg="info" className="text-capitalize">
                          {product.category || 'Uncategorized'}
                        </Badge>
                      </td>
                      <td>{product.brand || 'Generic'}</td>
                      <td>
                        <>
                          <strong className="text-success">
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </strong>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <br />
                              <small className="text-muted text-decoration-line-through">
                                ${parseFloat(product.originalPrice).toFixed(2)}
                              </small>
                            </>
                          )}
                        </>
                      </td>
                      <td>
                        <>
                          <Badge bg={product.inStock ? 'success' : 'danger'}>
                            <i className={`fas fa-${product.inStock ? 'check-circle' : 'times-circle'} me-1`}></i>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                          {product.stockQuantity && (
                            <>
                              <br />
                              <small className="text-muted">Qty: {product.stockQuantity}</small>
                            </>
                          )}
                        </>
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
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            to={`/products/${product._id}`}
                            className="btn btn-outline-info"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="btn btn-outline-primary"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleStockToggle(product)}
                            title="Toggle Stock"
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(product)}
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
                        <i className="fas fa-search fa-2x mb-2"></i>
                        <p>
                          {search || filter !== 'all' 
                            ? 'No products match your current filters' 
                            : 'No products found. Add some products to get started!'}
                        </p>
                        {(search || filter !== 'all') && (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => {
                              setSearch('');
                              setFilter('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Summary Stats */}
      <Row className="mt-4">
        <Col>
          <div className="bg-light p-3 rounded">
            <Row className="text-center">
              <Col md={3}>
                <strong className="text-success">{products.filter(p => p.inStock).length}</strong>
                <br />
                <small className="text-muted">In Stock</small>
              </Col>
              <Col md={3}>
                <strong className="text-danger">{products.filter(p => !p.inStock).length}</strong>
                <br />
                <small className="text-muted">Out of Stock</small>
              </Col>
              <Col md={3}>
                <strong className="text-warning">{products.filter(p => p.featured).length}</strong>
                <br />
                <small className="text-muted">Featured</small>
              </Col>
              <Col md={3}>
                <strong className="text-info">
                  ${products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0).toFixed(2)}
                </strong>
                <br />
                <small className="text-muted">Total Value</small>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, product: null })}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteModal.product && (
            <>
              <p>Are you sure you want to delete <strong>{deleteModal.product.name}</strong>?</p>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                This action cannot be undone. The product will be permanently removed from the catalog.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, product: null })}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash me-2"></i>
                Delete Product
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProducts;