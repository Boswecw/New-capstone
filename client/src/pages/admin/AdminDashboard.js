// src/pages/admin/AdminDashboard.js - FIXED VERSION

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import SafeImage from '../../components/SafeImage';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPets: 0,
      availablePets: 0,
      adoptedPets: 0,
      pendingPets: 0,
      totalProducts: 0,
      totalUsers: 0,
      recentAdoptions: 0
    },
    recentPets: [],
    recentUsers: [],
    recentContacts: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: Fetch dashboard data using configured API instance
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching admin dashboard data...');
        
        // FIXED: Use api instance instead of fetch
        const response = await api.get('/admin/dashboard');
        
        console.log('✅ Dashboard response:', response.data);
        
        if (response.data.success) {
          // FIXED: Map the backend response to frontend expected structure
          const backendData = response.data.data;
          const mappedData = {
            stats: {
              totalPets: backendData.stats?.pets?.total || 0,
              availablePets: backendData.stats?.pets?.available || 0,
              adoptedPets: backendData.stats?.pets?.adopted || 0,
              pendingPets: backendData.stats?.pets?.pending || 0,
              totalProducts: backendData.stats?.products?.total || 0,
              totalUsers: backendData.stats?.users?.total || 0,
              recentAdoptions: backendData.stats?.pets?.adopted || 0
            },
            recentPets: backendData.recentActivity?.pets || [],
            recentUsers: backendData.recentActivity?.users || [],
            recentContacts: backendData.recentActivity?.contacts || [],
            alerts: backendData.alerts || []
          };
          console.log('🔄 Mapped dashboard data:', mappedData);
          setDashboardData(mappedData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('❌ Dashboard fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading dashboard...</span>
            </div>
            <p className="mt-3 text-muted">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error Loading Dashboard
                  </h4>
                </div>
                <div className="card-body">
                  <p className="card-text">{error}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentPets, recentUsers, recentContacts, alerts } = dashboardData;

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-tachometer-alt me-3"></i>
          Admin Dashboard
        </h1>
        <p>Manage your pet store and monitor key metrics</p>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <h2>System Alerts</h2>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert ${alert.type}`}>
                <div className="alert-icon">
                  <i className={`fas ${
                    alert.type === 'warning' ? 'fa-exclamation-triangle' :
                    alert.type === 'error' ? 'fa-times-circle' :
                    alert.type === 'success' ? 'fa-check-circle' :
                    'fa-info-circle'
                  }`}></i>
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <small>{alert.timestamp}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon pets">
              <i className="fas fa-paw"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.totalPets || 0}</h3>
              <p>Total Pets</p>
              <small>{stats.availablePets || 0} available</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon users">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.totalUsers || 0}</h3>
              <p>Total Users</p>
              <small>Registered members</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon adoptions">
              <i className="fas fa-heart"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.adoptedPets || 0}</h3>
              <p>Adoptions</p>
              <small>{stats.recentAdoptions || 0} this month</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <div className="stat-info">
              <h3>{stats.totalProducts || 0}</h3>
              <p>Products</p>
              <small>In inventory</small>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="row">
          {/* Recent Pets */}
          <div className="col-lg-4 col-md-6">
            <div className="activity-section">
              <h3>
                <i className="fas fa-paw me-2"></i>
                Recent Pets
              </h3>
              <div className="activity-list">
                {recentPets && recentPets.length > 0 ? (
                  recentPets.slice(0, 5).map((pet) => (
                    <div key={pet._id || pet.id} className="activity-item">
                      <div className="activity-image">
                        <SafeImage
                          src={getOptimizedImageUrl(pet.image, 'thumbnail')}
                          alt={pet.name}
                          fallback="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60&h=60&fit=crop"
                        />
                      </div>
                      <div className="activity-content">
                        <h5>{pet.name}</h5>
                        <p>{pet.breed} • {pet.type}</p>
                        <small className="text-muted">
                          Added {new Date(pet.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="activity-status">
                        <span className={`badge bg-${pet.status === 'available' ? 'success' : pet.status === 'adopted' ? 'primary' : 'warning'}`}>
                          {pet.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-3">
                    <i className="fas fa-paw fa-2x mb-2"></i>
                    <p>No recent pets</p>
                  </div>
                )}
              </div>
              <div className="activity-footer">
                <Link to="/admin/pets" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-eye me-1"></i>
                  View All Pets
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="col-lg-4 col-md-6">
            <div className="activity-section">
              <h3>
                <i className="fas fa-users me-2"></i>
                Recent Users
              </h3>
              <div className="activity-list">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.slice(0, 5).map((user) => (
                    <div key={user._id || user.id} className="activity-item">
                      <div className="activity-icon">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="activity-content">
                        <h5>{user.name}</h5>
                        <p>{user.email}</p>
                        <small className="text-muted">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="activity-status">
                        <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'moderator' ? 'warning' : 'success'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-3">
                    <i className="fas fa-users fa-2x mb-2"></i>
                    <p>No recent users</p>
                  </div>
                )}
              </div>
              <div className="activity-footer">
                <Link to="/admin/users" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-eye me-1"></i>
                  View All Users
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="col-lg-4 col-md-12">
            <div className="activity-section">
              <h3>
                <i className="fas fa-envelope me-2"></i>
                Recent Contacts
              </h3>
              <div className="activity-list">
                {recentContacts && recentContacts.length > 0 ? (
                  recentContacts.slice(0, 5).map((contact) => (
                    <div key={contact._id || contact.id} className="activity-item">
                      <div className="activity-icon">
                        <i className="fas fa-envelope text-info"></i>
                      </div>
                      <div className="activity-content">
                        <h5>{contact.name}</h5>
                        <p>{contact.subject}</p>
                        <small className="text-muted">
                          From {contact.email} • {new Date(contact.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="activity-status">
                        <span className={`badge bg-${contact.status === 'new' ? 'warning' : contact.status === 'read' ? 'info' : 'success'}`}>
                          {contact.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-3">
                    <i className="fas fa-envelope fa-2x mb-2"></i>
                    <p>No recent contacts</p>
                  </div>
                )}
              </div>
              <div className="activity-footer">
                <Link to="/admin/contacts" className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-eye me-1"></i>
                  View All Contacts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/pets" className="action-card">
            <div className="action-icon">
              <i className="fas fa-plus"></i>
            </div>
            <h4>Add New Pet</h4>
            <p>Add a new pet for adoption</p>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">
              <i className="fas fa-users"></i>
            </div>
            <h4>Manage Users</h4>
            <p>View and manage user accounts</p>
          </Link>

          <Link to="/admin/contacts" className="action-card">
            <div className="action-icon">
              <i className="fas fa-envelope"></i>
            </div>
            <h4>Contact Messages</h4>
            <p>Review customer inquiries</p>
          </Link>

          <Link to="/admin/reports" className="action-card">
            <div className="action-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <h4>View Reports</h4>
            <p>Analyze performance metrics</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;