// ===== 7. client/src/pages/admin/AdminDashboard.js (COMPLETE UPDATED FILE) =====
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI, productAPI } from '../../services/api';
import { normalizeImageUrl } from '../../utils/image';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPets: 0,
    availablePets: 0,
    totalProducts: 0,
    inStockProducts: 0
  });
  const [recentPets, setRecentPets] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [petsResponse, productsResponse] = await Promise.all([
        petAPI.get('/', { params: { limit: 5, sort: 'newest' } }),
        productAPI.get('/', { params: { limit: 5, sort: 'newest' } })
      ]);

      const pets = petsResponse.data?.data || [];
      const products = productsResponse.data?.data || [];

      setStats({
        totalPets: pets.length,
        availablePets: pets.filter(pet => pet.status === 'available').length,
        totalProducts: products.length,
        inStockProducts: products.filter(product => product.inStock).length
      });

      setRecentPets(pets.slice(0, 5));
      setRecentProducts(products.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">
            <i className="fas fa-tachometer-alt me-2 text-primary"></i>
            Admin Dashboard
          </h2>
          <p className="text-muted">Overview of your pet store management</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-primary mb-2">
                <i className="fas fa-paw fa-2x"></i>
              </div>
              <h3 className="fw-bold text-primary">{stats.totalPets}</h3>
              <p className="text-muted mb-0">Total Pets</p>
              <small className="text-success">
                {stats.availablePets} available
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-success mb-2">
                <i className="fas fa-box fa-2x"></i>
              </div>
              <h3 className="fw-bold text-success">{stats.totalProducts}</h3>
              <p className="text-muted mb-0">Total Products</p>
              <small className="text-success">
                {stats.inStockProducts} in stock
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-warning mb-2">
                <i className="fas fa-heart fa-2x"></i>
              </div>
              <h3 className="fw-bold text-warning">{stats.availablePets}</h3>
              <p className="text-muted mb-0">Available Pets</p>
              <small className="text-muted">
                Ready for adoption
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-info mb-2">
                <i className="fas fa-chart-line fa-2x"></i>
              </div>
              <h3 className="fw-bold text-info">{stats.inStockProducts}</h3>
              <p className="text-muted mb-0">In Stock</p>
              <small className="text-muted">
                Products available
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>
                Recent Pets
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {recentPets.length > 0 ? (
                <Table responsive hover className="mb-0">
                  <tbody>
                    {recentPets.map(pet => (
                      <tr key={pet._id}>
                        <td style={{ width: '60px' }}>
                          <img
                            src={normalizeImageUrl(pet.image || pet.imageUrl) || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=40&h=40&fit=crop&q=80'}
                            alt={pet.name}
                            className="rounded-circle"
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=40&h=40&fit=crop&q=80';
                            }}
                          />
                        </td>
                        <td>
                          <strong>{pet.name}</strong>
                          <br />
                          <small className="text-muted">{pet.type} • {pet.breed}</small>
                        </td>
                        <td>
                          <Badge bg={pet.status === 'available' ? 'success' : 'secondary'}>
                            {pet.status}
                          </Badge>
                        </td>
                        <td>
                          <Link 
                            to={`/admin/pets/${pet._id}/edit`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-paw fa-2x mb-2"></i>
                  <p>No pets yet</p>
                </div>
              )}
              <Card.Footer className="text-center">
                <Link to="/admin/pets" className="btn btn-outline-primary btn-sm">
                  View All Pets
                </Link>
              </Card.Footer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>
                Recent Products
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {recentProducts.length > 0 ? (
                <Table responsive hover className="mb-0">
                  <tbody>
                    {recentProducts.map(product => (
                      <tr key={product._id}>
                        <td style={{ width: '60px' }}>
                          <img
                            src={normalizeImageUrl(product.image || product.imageUrl) || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&q=80'}
                            alt={product.name}
                            className="rounded"
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&q=80';
                            }}
                          />
                        </td>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.category}</small>
                        </td>
                        <td>
                          <strong className="text-success">${product.price}</strong>
                        </td>
                        <td>
                          <Badge bg={product.inStock ? 'success' : 'danger'}>
                            {product.inStock ? 'In Stock' : 'Out'}
                          </Badge>
                        </td>
                        <td>
                          <Link 
                            to={`/admin/products/${product._id}/edit`} 
                            className="btn btn-sm btn-outline-success"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-box fa-2x mb-2"></i>
                  <p>No products yet</p>
                </div>
              )}
              <Card.Footer className="text-center">
                <Link to="/admin/products" className="btn btn-outline-success btn-sm">
                  View All Products
                </Link>
              </Card.Footer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;