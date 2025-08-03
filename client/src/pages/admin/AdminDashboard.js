// client/src/pages/admin/AdminDashboard.js - COMPLETE UPDATED VERSION with Products
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import StatsCard from '../../components/admin/StatsCard';
import axios from 'axios';

// ✅ Create stable admin API instance
const adminApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'
    : 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token interceptor
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 Admin Dashboard Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Admin Dashboard Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Admin Dashboard Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentActivities: {},
    charts: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching dashboard data...');
      
      const response = await adminApi.get('/admin/dashboard');
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('✅ Dashboard data loaded successfully');
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Dashboard</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={handleRefresh}>
          Try Again
        </Button>
      </Alert>
    );
  }

  const { stats, recentActivities, charts } = dashboardData;

  return (
    <>
      {/* Dashboard Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1><i className="fas fa-chart-line me-2"></i>Dashboard</h1>
          <p className="text-muted mb-0">Welcome to the admin dashboard. Monitor your pet store operations.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
          <i className="fas fa-sync-alt me-2"></i>Refresh Data
        </Button>
      </div>

      {/* ✅ UPDATED: Stats Cards Row with Products */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <StatsCard
            title="Total Pets"
            value={stats.pets?.totalPets || 0}
            icon="fa-paw"
            color="primary"
            subtitle={`${stats.pets?.availablePets || 0} available`}
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Total Users"
            value={stats.users?.totalUsers || 0}
            icon="fa-users"
            color="success"
            subtitle={`${stats.users?.activeUsers || 0} active`}
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Adoptions"
            value={stats.pets?.adoptedPets || 0}
            icon="fa-heart"
            color="danger"
            subtitle="This month"
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Contact Forms"
            value={stats.contacts?.totalContacts || 0}
            icon="fa-envelope"
            color="info"
            subtitle={`${stats.contacts?.pendingContacts || 0} pending`}
          />
        </Col>
      </Row>

      {/* ✅ NEW: Second Row of Stats Cards with Products */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <StatsCard
            title="Total Products"
            value={stats.products?.totalProducts || 0}
            icon="fa-shopping-bag"
            color="warning"
            subtitle={`${stats.products?.inStockProducts || 0} in stock`}
          />
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="bg-secondary text-white rounded p-3 me-3 d-inline-block mb-3">
                <i className="fas fa-dollar-sign fa-2x"></i>
              </div>
              <h3 className="mb-0">
                ${stats.products?.averagePrice ? stats.products.averagePrice.toFixed(2) : '0.00'}
              </h3>
              <h6 className="text-muted mb-0">Average Price</h6>
              <small className="text-muted">Product pricing</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="bg-success text-white rounded p-3 me-3 d-inline-block mb-3">
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
              <h3 className="mb-0">
                {stats.products?.inStockProducts && stats.products?.totalProducts 
                  ? ((stats.products.inStockProducts / stats.products.totalProducts) * 100).toFixed(1)
                  : '0'
                }%
              </h3>
              <h6 className="text-muted mb-0">Stock Rate</h6>
              <small className="text-muted">Products available</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="bg-info text-white rounded p-3 me-3 d-inline-block mb-3">
                <i className="fas fa-chart-bar fa-2x"></i>
              </div>
              <h3 className="mb-0">
                {((stats.pets?.adoptedPets || 0) + (stats.contacts?.totalContacts || 0))}
              </h3>
              <h6 className="text-muted mb-0">Total Activity</h6>
              <small className="text-muted">Adoptions + inquiries</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities Section */}
      <Row className="g-4 mb-4">
        {/* Recent Pets */}
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>Recent Pets
              </h5>
              <Button as={Link} to="/admin/pets" variant="outline-primary" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentActivities?.pets?.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.pets.slice(0, 5).map((pet) => (
                      <tr key={pet._id}>
                        <td>
                          <strong>{pet.name}</strong>
                        </td>
                        <td>
                          <Badge bg="primary">{pet.type || pet.species}</Badge>
                        </td>
                        <td>
                          <Badge bg={
                            pet.status === 'available' ? 'success' :
                            pet.status === 'adopted' ? 'info' : 'warning'
                          }>
                            {pet.status}
                          </Badge>
                        </td>
                        <td>
                          <small>{new Date(pet.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-paw me-2"></i>
                  No recent pets found
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Users */}
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>Recent Users
              </h5>
              <Button as={Link} to="/admin/users" variant="outline-success" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentActivities?.users?.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.users.slice(0, 5).map((user) => (
                      <tr key={user._id}>
                        <td>
                          <strong>{user.name}</strong>
                        </td>
                        <td>
                          <small>{user.email}</small>
                        </td>
                        <td>
                          <Badge bg={
                            user.role === 'admin' ? 'danger' : 
                            user.role === 'moderator' ? 'warning' : 'secondary'
                          }>
                            {user.role || 'user'}
                          </Badge>
                        </td>
                        <td>
                          <small>{new Date(user.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  No recent users found
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* ✅ NEW: Recent Products */}
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-shopping-bag me-2"></i>Recent Products
              </h5>
              <Button as={Link} to="/admin/products" variant="outline-warning" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentActivities?.products?.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.products.slice(0, 5).map((product) => (
                      <tr key={product._id}>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.brand || 'No Brand'}</small>
                        </td>
                        <td>
                          <Badge bg="primary">{product.category}</Badge>
                        </td>
                        <td>
                          <strong className="text-success">
                            ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                          </strong>
                        </td>
                        <td>
                          <Badge bg={product.inStock ? 'success' : 'danger'}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td>
                          <small>{new Date(product.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-shopping-bag me-2"></i>
                  No recent products found
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Contacts */}
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-envelope me-2"></i>Recent Contacts
              </h5>
              <Button as={Link} to="/admin/contacts" variant="outline-info" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentActivities?.contacts?.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.contacts.slice(0, 5).map((contact) => (
                      <tr key={contact._id}>
                        <td>
                          <strong>{contact.name}</strong>
                          <br />
                          <small className="text-muted">{contact.email}</small>
                        </td>
                        <td>{contact.subject}</td>
                        <td>
                          <Badge bg={
                            contact.status === 'resolved' ? 'success' :
                            contact.status === 'pending' ? 'warning' : 'secondary'
                          }>
                            {contact.status || 'new'}
                          </Badge>
                        </td>
                        <td>
                          <small>{new Date(contact.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-envelope me-2"></i>
                  No recent contacts found
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions Section */}
      <Row className="g-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Button as={Link} to="/admin/pets" variant="primary" className="w-100">
                    <i className="fas fa-paw me-2"></i>Manage Pets
                  </Button>
                </Col>
                <Col md={3}>
                  <Button as={Link} to="/admin/products" variant="warning" className="w-100">
                    <i className="fas fa-shopping-bag me-2"></i>Manage Products
                  </Button>
                </Col>
                <Col md={3}>
                  <Button as={Link} to="/admin/users" variant="success" className="w-100">
                    <i className="fas fa-users me-2"></i>Manage Users
                  </Button>
                </Col>
                <Col md={3}>
                  <Button as={Link} to="/admin/analytics" variant="info" className="w-100">
                    <i className="fas fa-chart-bar me-2"></i>View Analytics
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminDashboard;