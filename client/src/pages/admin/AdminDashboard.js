// client/src/pages/admin/AdminDashboard.js - FIXED IMAGE IMPORTS
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI, productAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils'; // ✅ FIXED: Use consolidated utility

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPets: 0,
    availablePets: 0,
    totalProducts: 0,
    inStockProducts: 0,
    totalUsers: 0,
    newContacts: 0
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

      const pets = petsResponse.data?.pets || petsResponse.data?.data || [];
      const products = productsResponse.data?.data || [];

      setStats({
        totalPets: pets.length,
        availablePets: pets.filter(pet => pet.status === 'available').length,
        totalProducts: products.length,
        inStockProducts: products.filter(product => product.inStock).length,
        totalUsers: 0, // TODO: Add user API call
        newContacts: 0 // TODO: Add contacts API call
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
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading dashboard...</span>
          </Spinner>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Dashboard Error</Alert.Heading>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={fetchDashboardData}>
            Try Again
          </button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">
            <i className="fas fa-tachometer-alt me-2 text-primary"></i>
            Admin Dashboard
          </h2>
          <p className="text-muted">Welcome to the FurBabies Pet Store admin panel</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                <i className="fas fa-paw fa-2x text-primary"></i>
              </div>
              <h3 className="fw-bold text-primary">{stats.totalPets}</h3>
              <p className="text-muted mb-0">Total Pets</p>
              <small className="text-success">
                <i className="fas fa-check-circle me-1"></i>
                {stats.availablePets} available
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                <i className="fas fa-box fa-2x text-success"></i>
              </div>
              <h3 className="fw-bold text-success">{stats.totalProducts}</h3>
              <p className="text-muted mb-0">Total Products</p>
              <small className="text-success">
                <i className="fas fa-check-circle me-1"></i>
                {stats.inStockProducts} in stock
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-info bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                <i className="fas fa-users fa-2x text-info"></i>
              </div>
              <h3 className="fw-bold text-info">{stats.totalUsers}</h3>
              <p className="text-muted mb-0">Total Users</p>
              <small className="text-muted">Registered members</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                <i className="fas fa-envelope fa-2x text-warning"></i>
              </div>
              <h3 className="fw-bold text-warning">{stats.newContacts}</h3>
              <p className="text-muted mb-0">New Messages</p>
              <small className="text-muted">Pending replies</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Content */}
      <Row>
        {/* Recent Pets */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
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
                            src={getImageUrl(pet.image || pet.imageUrl, 'pet', pet.type) || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=40&h=40&fit=crop&q=80'}
                            alt={pet.name}
                            className="rounded"
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
                          <Badge bg={
                            pet.status === 'available' ? 'success' :
                            pet.status === 'adopted' ? 'primary' :
                            pet.status === 'pending' ? 'warning' : 'secondary'
                          }>
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
            </Card.Body>
            <Card.Footer className="text-center">
              <Link to="/admin/pets" className="btn btn-outline-primary btn-sm">
                View All Pets
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        {/* Recent Products */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
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
                            src={getImageUrl(product.image || product.imageUrl, 'product', product.category) || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=40&h=40&fit=crop&q=80'}
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
                          <strong className="text-success">${parseFloat(product.price || 0).toFixed(2)}</strong>
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
            </Card.Body>
            <Card.Footer className="text-center">
              <Link to="/admin/products" className="btn btn-outline-success btn-sm">
                View All Products
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <Link to="/admin/pets/new" className="btn btn-primary w-100">
                    <i className="fas fa-plus me-2"></i>
                    Add New Pet
                  </Link>
                </Col>
                <Col md={3} className="mb-3">
                  <Link to="/admin/products/new" className="btn btn-success w-100">
                    <i className="fas fa-plus me-2"></i>
                    Add New Product
                  </Link>
                </Col>
                <Col md={3} className="mb-3">
                  <Link to="/admin/users" className="btn btn-info w-100">
                    <i className="fas fa-users me-2"></i>
                    Manage Users
                  </Link>
                </Col>
                <Col md={3} className="mb-3">
                  <Link to="/admin/contacts" className="btn btn-warning w-100">
                    <i className="fas fa-envelope me-2"></i>
                    View Messages
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;