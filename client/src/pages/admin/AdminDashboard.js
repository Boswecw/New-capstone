// client/src/pages/admin/AdminDashboard.js - QUICK FIX VERSION
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert } from 'react-bootstrap';
import StatsCard from '../../components/admin/StatsCard';
// ✅ QUICK FIX: Import axios directly and create instance
import axios from 'axios';

// ✅ Create axios instance specifically for admin
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
  console.log(`📡 Admin API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Admin API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Admin API Error:', error.response?.status, error.response?.data);
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
      
      // ✅ FIXED: Use the adminApi instance
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
        <button 
          className="btn btn-outline-danger" 
          onClick={fetchDashboardData}
        >
          Try Again
        </button>
      </Alert>
    );
  }

  const { stats, recentActivities, charts } = dashboardData;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-chart-line me-2"></i>Dashboard</h1>
      </div>

      {/* Stats Cards */}
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

      <Row className="g-4">
        {/* Recent Pets */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>Recent Pets
              </h5>
            </Card.Header>
            <Card.Body>
              {recentActivities?.pets?.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Species</th>
                      <th>Status</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.pets.slice(0, 5).map((pet) => (
                      <tr key={pet._id}>
                        <td>
                          <strong>{pet.name}</strong>
                          <br />
                          <small className="text-muted">{pet.breed}</small>
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {pet.species || pet.category}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${
                            pet.status === 'available' ? 'success' :
                            pet.status === 'adopted' ? 'info' : 'warning'
                          }`}>
                            {pet.status || 'available'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(pet.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-3">No recent pets to display</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Users */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>Recent Users
              </h5>
            </Card.Header>
            <Card.Body>
              {recentActivities?.users?.length > 0 ? (
                <Table striped hover responsive>
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
                          <span className={`badge bg-${
                            user.role === 'admin' ? 'danger' : 
                            user.role === 'moderator' ? 'warning' : 'secondary'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(user.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-3">No recent users to display</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Contacts */}
      <Row className="g-4 mt-2">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-envelope me-2"></i>Recent Contact Messages
              </h5>
            </Card.Header>
            <Card.Body>
              {recentActivities?.contacts?.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
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
                        </td>
                        <td>
                          <small>{contact.email}</small>
                        </td>
                        <td>
                          {contact.subject}
                        </td>
                        <td>
                          <span className={`badge bg-${
                            contact.status === 'resolved' ? 'success' :
                            contact.status === 'pending' ? 'warning' : 'secondary'
                          }`}>
                            {contact.status || 'new'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(contact.createdAt).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-3">No recent contact messages to display</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminDashboard;