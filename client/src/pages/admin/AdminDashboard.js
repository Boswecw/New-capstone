// src/pages/admin/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import { 
  buildProductImageUrl, 
  getOptimizedImageUrl
} from '../../utils/imageUtils';
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
    recentAdoptions: [],
    recentProducts: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentPets, recentAdoptions, recentProducts, alerts } = dashboardData;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage pets, products, and monitor activity</p>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alerts & Notifications</h2>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert ${alert.type}`}>
                <div className="alert-icon">
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'error' && '❌'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  {alert.timestamp && (
                    <small>{new Date(alert.timestamp).toLocaleString()}</small>
                  )}
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
          <div className="stat-card pets">
            <div className="stat-icon">🐾</div>
            <div className="stat-content">
              <h3>Total Pets</h3>
              <div className="stat-number">{stats.totalPets}</div>
              <div className="stat-breakdown">
                <span className="available">{stats.availablePets} Available</span>
                <span className="pending">{stats.pendingPets} Pending</span>
                <span className="adopted">{stats.adoptedPets} Adopted</span>
              </div>
            </div>
          </div>

          <div className="stat-card products">
            <div className="stat-icon">🛍️</div>
            <div className="stat-content">
              <h3>Products</h3>
              <div className="stat-number">{stats.totalProducts}</div>
              <Link to="/admin/products" className="stat-link">
                Manage Products →
              </Link>
            </div>
          </div>

          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Users</h3>
              <div className="stat-number">{stats.totalUsers}</div>
              <Link to="/admin/users" className="stat-link">
                Manage Users →
              </Link>
            </div>
          </div>

          <div className="stat-card adoptions">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <h3>Recent Adoptions</h3>
              <div className="stat-number">{stats.recentAdoptions}</div>
              <small>Last 30 days</small>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/pets/new" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Add New Pet</h3>
            <p>Add a new pet to the database</p>
          </Link>

          <Link to="/admin/products/new" className="action-card">
            <div className="action-icon">🛒</div>
            <h3>Add Product</h3>
            <p>Add a new product to the store</p>
          </Link>

          <Link to="/admin/adoptions" className="action-card">
            <div className="action-icon">📋</div>
            <h3>View Applications</h3>
            <p>Review adoption applications</p>
          </Link>

          <Link to="/admin/reports" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Generate Reports</h3>
            <p>View analytics and reports</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h2>Recently Added Pets</h2>
          {recentPets.length === 0 ? (
            <p className="no-data">No recent pets added</p>
          ) : (
            <div className="pets-list">
              {recentPets.map(pet => (
                <RecentPetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
          <Link to="/admin/pets" className="view-all-link">
            View All Pets →
          </Link>
        </div>

        <div className="activity-section">
          <h2>Recent Adoptions</h2>
          {recentAdoptions.length === 0 ? (
            <p className="no-data">No recent adoptions</p>
          ) : (
            <div className="adoptions-list">
              {recentAdoptions.map(adoption => (
                <RecentAdoptionCard key={adoption.id} adoption={adoption} />
              ))}
            </div>
          )}
          <Link to="/admin/adoptions" className="view-all-link">
            View All Adoptions →
          </Link>
        </div>

        <div className="activity-section">
          <h2>Recent Products</h2>
          {recentProducts.length === 0 ? (
            <p className="no-data">No recent products added</p>
          ) : (
            <div className="products-list">
              {recentProducts.map(product => (
                <RecentProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <Link to="/admin/products" className="view-all-link">
            View All Products →
          </Link>
        </div>
      </div>
    </div>
  );
};

// Recent Pet Card Component
const RecentPetCard = ({ pet }) => {
  const imageUrl = getOptimizedImageUrl(pet.image, { width: 80, height: 80 });
  
  return (
    <div className="recent-pet-card">
      <div className="pet-image">
        <SafeImage
          src={imageUrl}
          alt={pet.name}
          isPet={true}
        />
      </div>
      <div className="pet-info">
        <h4>{pet.name}</h4>
        <p>{pet.breed} • {pet.species}</p>
        <span className={`status ${pet.status}`}>{pet.status}</span>
      </div>
      <div className="pet-actions">
        <Link to={`/admin/pets/${pet.id}`} className="btn btn-sm">
          Edit
        </Link>
      </div>
    </div>
  );
};

// Recent Adoption Card Component
const RecentAdoptionCard = ({ adoption }) => {
  const petImageUrl = getOptimizedImageUrl(adoption.pet?.image, { width: 60, height: 60 });
  
  return (
    <div className="recent-adoption-card">
      <div className="adoption-pet-image">
        <SafeImage
          src={petImageUrl}
          alt={adoption.pet?.name || 'Pet'}
          isPet={true}
        />
      </div>
      <div className="adoption-info">
        <h4>{adoption.pet?.name}</h4>
        <p>Adopted by {adoption.adopter?.name}</p>
        <small>{new Date(adoption.adoptionDate).toLocaleDateString()}</small>
      </div>
      <div className="adoption-status">
        <span className={`status ${adoption.status}`}>
          {adoption.status}
        </span>
      </div>
    </div>
  );
};

// Recent Product Card Component
const RecentProductCard = ({ product }) => {
  return (
    <div className="recent-product-card">
      <div className="product-image">
        <SafeImage
          src={buildProductImageUrl(product.image)}
          alt={product.name}
        />
      </div>
      <div className="product-info">
        <h4>{product.name}</h4>
        <p>${product.price}</p>
        <small>Stock: {product.stock || 0}</small>
      </div>
      <div className="product-actions">
        <Link to={`/admin/products/${product.id}`} className="btn btn-sm">
          Edit
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;