// client/src/pages/admin/AdminDashboard.js - Complete Fixed Version
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📊 Fetching admin dashboard data...');
        
        const response = await api.get('/admin/dashboard');
        
        console.log('✅ Dashboard response:', response.data);
        
        if (response.data.success) {
          const backendData = response.data.data;
          
          // FIXED: Map the backend response to frontend expected structure with proper null checks
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
            // FIXED: Ensure arrays are always valid arrays, never null/undefined
            recentPets: Array.isArray(backendData.recentActivity?.pets) 
              ? backendData.recentActivity.pets 
              : [],
            recentUsers: Array.isArray(backendData.recentActivity?.users) 
              ? backendData.recentActivity.users 
              : [],
            recentContacts: Array.isArray(backendData.recentActivity?.contacts) 
              ? backendData.recentActivity.contacts 
              : [],
            alerts: Array.isArray(backendData.alerts) ? backendData.alerts : []
          };
          
          console.log('🔄 Mapped dashboard data:', mappedData);
          setDashboardData(mappedData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('❌ Dashboard fetch error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error Loading Dashboard
                  </h4>
                </div>
                <div className="card-body text-center">
                  <p className="card-text mb-3">{error}</p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.reload()}
                    >
                      <i className="fas fa-redo me-2"></i>
                      Try Again
                    </button>
                    <Link to="/admin" className="btn btn-outline-secondary">
                      <i className="fas fa-arrow-left me-2"></i>
                      Back to Admin
                    </Link>
                  </div>
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
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="mb-1">
                <i className="fas fa-tachometer-alt me-3"></i>
                Admin Dashboard
              </h1>
              <p className="text-muted mb-0">
                Welcome back! Here's what's happening with your pet store.
              </p>
            </div>
            <div className="col-auto">
              <div className="text-muted small">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section mb-4">
          <div className="container-fluid">
            <h2 className="mb-3">
              <i className="fas fa-bell me-2"></i>
              System Alerts
            </h2>
            <div className="alerts-list">
              {alerts.map((alert, index) => (
                <div 
                  key={`alert-${index}-${alert.id || alert.title || index}`} 
                  className={`alert alert-${alert.type || 'info'} alert-dismissible fade show`}
                >
                  <div className="d-flex align-items-start">
                    <div className="alert-icon me-3">
                      <i className={`fas ${
                        alert.type === 'warning' ? 'fa-exclamation-triangle' :
                        alert.type === 'error' || alert.type === 'danger' ? 'fa-times-circle' :
                        alert.type === 'success' ? 'fa-check-circle' :
                        'fa-info-circle'
                      }`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="alert-heading mb-1">{alert.title || 'System Alert'}</h6>
                      <p className="mb-1">{alert.message || 'No details available'}</p>
                      {alert.timestamp && (
                        <small className="text-muted">
                          {new Date(alert.timestamp).toLocaleString()}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid">
        {/* Stats Overview */}
        <div className="stats-overview mb-5">
          <div className="row">
            <div className="col-12 mb-3">
              <h2>
                <i className="fas fa-chart-bar me-2"></i>
                Overview
              </h2>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-xl-3 col-md-6">
              <div className="stat-card pets">
                <div className="stat-icon">
                  <i className="fas fa-paw"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalPets}</div>
                  <h3>Total Pets</h3>
                  <p className="stat-detail">
                    <span className="badge bg-success me-2">
                      {stats.availablePets} available
                    </span>
                    <span className="badge bg-warning">
                      {stats.pendingPets} pending
                    </span>
                  </p>
                  <Link to="/admin/pets" className="stat-link">
                    View all pets <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="stat-card users">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalUsers}</div>
                  <h3>Total Users</h3>
                  <p className="stat-detail text-muted">Registered members</p>
                  <Link to="/admin/users" className="stat-link">
                    Manage users <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="stat-card adoptions">
                <div className="stat-icon">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.adoptedPets}</div>
                  <h3>Successful Adoptions</h3>
                  <p className="stat-detail text-muted">
                    {stats.recentAdoptions} this month
                  </p>
                  <Link to="/admin/reports?type=adoptions" className="stat-link">
                    View reports <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="stat-card products">
                <div className="stat-icon">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalProducts}</div>
                  <h3>Products</h3>
                  <p className="stat-detail text-muted">In inventory</p>
                  <Link to="/admin/products" className="stat-link">
                    Manage products <i className="fas fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity mb-5">
          <div className="row">
            <div className="col-12 mb-3">
              <h2>
                <i className="fas fa-clock me-2"></i>
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="row g-4">
            {/* Recent Pets */}
            <div className="col-lg-4">
              <div className="activity-section">
                <div className="activity-header">
                  <h3>
                    <i className="fas fa-paw me-2"></i>
                    Recent Pets
                  </h3>
                </div>
                <div className="activity-body">
                  {recentPets.length > 0 ? (
                    <div className="activity-list">
                      {recentPets.slice(0, 5).map((pet, index) => (
                        <div key={`pet-${pet._id || pet.id || index}`} className="activity-item">
                          <div className="activity-avatar">
                            {pet.images && pet.images.length > 0 ? (
                              <SafeImage
                                src={getOptimizedImageUrl(pet.images[0], 'small')}
                                alt={pet.name || 'Pet'}
                                className="rounded-circle"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                <i className="fas fa-paw"></i>
                              </div>
                            )}
                          </div>
                          <div className="activity-content">
                            <h5 className="activity-title">
                              {pet.name || 'Unnamed Pet'}
                            </h5>
                            <p className="activity-subtitle">
                              {pet.breed || 'Unknown Breed'} • {pet.type || 'Pet'}
                            </p>
                            <small className="activity-time">
                              Added {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : 'recently'}
                            </small>
                          </div>
                          <div className="activity-status">
                            <span className={`badge bg-${
                              pet.status === 'available' ? 'success' : 
                              pet.status === 'pending' ? 'warning' : 
                              pet.status === 'adopted' ? 'info' :
                              'secondary'
                            }`}>
                              {pet.status || 'unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="activity-empty">
                      <i className="fas fa-paw fa-2x mb-2"></i>
                      <p>No recent pets</p>
                    </div>
                  )}
                </div>
                <div className="activity-footer">
                  <Link to="/admin/pets" className="btn btn-outline-primary btn-sm w-100">
                    <i className="fas fa-eye me-1"></i>
                    View All Pets
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="col-lg-4">
              <div className="activity-section">
                <div className="activity-header">
                  <h3>
                    <i className="fas fa-users me-2"></i>
                    Recent Users
                  </h3>
                </div>
                <div className="activity-body">
                  {recentUsers.length > 0 ? (
                    <div className="activity-list">
                      {recentUsers.slice(0, 5).map((user, index) => (
                        <div key={`user-${user._id || user.id || index}`} className="activity-item">
                          <div className="activity-avatar">
                            <div className="avatar-placeholder bg-primary text-white">
                              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="activity-content">
                            <h5 className="activity-title">
                              {user.name || user.username || 'Unknown User'}
                            </h5>
                            <p className="activity-subtitle">
                              {user.email || 'No email provided'}
                            </p>
                            <small className="activity-time">
                              Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}
                            </small>
                          </div>
                          <div className="activity-status">
                            <span className={`badge bg-${
                              user.role === 'admin' ? 'danger' : 
                              user.role === 'moderator' ? 'warning' : 
                              'success'
                            }`}>
                              {user.role || 'user'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="activity-empty">
                      <i className="fas fa-users fa-2x mb-2"></i>
                      <p>No recent users</p>
                    </div>
                  )}
                </div>
                <div className="activity-footer">
                  <Link to="/admin/users" className="btn btn-outline-primary btn-sm w-100">
                    <i className="fas fa-eye me-1"></i>
                    View All Users
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="col-lg-4">
              <div className="activity-section">
                <div className="activity-header">
                  <h3>
                    <i className="fas fa-envelope me-2"></i>
                    Recent Contacts
                  </h3>
                </div>
                <div className="activity-body">
                  {recentContacts.length > 0 ? (
                    <div className="activity-list">
                      {recentContacts.slice(0, 5).map((contact, index) => (
                        <div key={`contact-${contact._id || contact.id || index}`} className="activity-item">
                          <div className="activity-avatar">
                            <div className="avatar-placeholder bg-info text-white">
                              <i className="fas fa-envelope"></i>
                            </div>
                          </div>
                          <div className="activity-content">
                            <h5 className="activity-title">
                              {contact.name || 'Anonymous'}
                            </h5>
                            <p className="activity-subtitle">
                              {contact.subject || 'No subject'}
                            </p>
                            <small className="activity-time">
                              From {contact.email || 'unknown'} • {' '}
                              {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'recently'}
                            </small>
                          </div>
                          <div className="activity-status">
                            <span className={`badge bg-${
                              contact.status === 'new' ? 'warning' : 
                              contact.status === 'read' ? 'info' : 
                              contact.status === 'replied' ? 'success' :
                              contact.status === 'resolved' ? 'success' :
                              'secondary'
                            }`}>
                              {contact.status || 'new'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="activity-empty">
                      <i className="fas fa-envelope fa-2x mb-2"></i>
                      <p>No recent contacts</p>
                    </div>
                  )}
                </div>
                <div className="activity-footer">
                  <Link to="/admin/contacts" className="btn btn-outline-primary btn-sm w-100">
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
          <div className="row">
            <div className="col-12 mb-3">
              <h2>
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h2>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <Link to="/admin/pets/new" className="action-card">
                <div className="action-icon text-success">
                  <i className="fas fa-plus"></i>
                </div>
                <h4>Add New Pet</h4>
                <p>Add a new pet available for adoption</p>
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <Link to="/admin/users" className="action-card">
                <div className="action-icon text-primary">
                  <i className="fas fa-users-cog"></i>
                </div>
                <h4>Manage Users</h4>
                <p>View and manage user accounts</p>
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <Link to="/admin/contacts" className="action-card">
                <div className="action-icon text-info">
                  <i className="fas fa-envelope-open"></i>
                </div>
                <h4>Contact Messages</h4>
                <p>Review and respond to inquiries</p>
              </Link>
            </div>

            <div className="col-lg-3 col-md-6">
              <Link to="/admin/analytics" className="action-card">
                <div className="action-icon text-warning">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4>View Analytics</h4>
                <p>Analyze performance and trends</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;