import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import StatsCard from '../../components/admin/StatsCard';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.data.stats);
      setRecentActivity(response.data.data.recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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
            value={stats.totalPets || 0}
            icon="fa-paw"
            color="primary"
            subtitle={`${stats.availablePets || 0} available`}
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon="fa-users"
            color="success"
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Contact Messages"
            value={stats.totalContacts || 0}
            icon="fa-envelope"
            color="info"
            subtitle={`${stats.newContacts || 0} new`}
          />
        </Col>
        <Col md={3}>
          <StatsCard
            title="Available Pets"
            value={stats.availablePets || 0}
            icon="fa-heart"
            color="warning"
          />
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row className="g-4">
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>Recent Pets
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0">
                <tbody>
                  {recentActivity.pets?.map(pet => (
                    <tr key={pet._id}>
                      <td>
                        <img 
                          src={pet.image} 
                          alt={pet.name}
                          className="rounded"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      </td>
                      <td>
                        <div>
                          <strong>{pet.name}</strong>
                          <br />
                          <small className="text-muted">{pet.breed}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <small className="text-muted">
                          {new Date(pet.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>Recent Users
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0">
                <tbody>
                  {recentActivity.users?.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{user.username}</strong>
                          <br />
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <small className="text-muted">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-envelope me-2"></i>Recent Contacts
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0">
                <tbody>
                  {recentActivity.contacts?.map(contact => (
                    <tr key={contact._id}>
                      <td>
                        <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          <i className="fas fa-envelope"></i>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{contact.name}</strong>
                          <br />
                          <small className="text-muted">{contact.subject}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <small className="text-muted">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminDashboard;