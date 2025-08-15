// src/pages/admin/AdminProducts.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import { 
  buildProductImageUrl, 
  hasValidImageExtension
} from '../../utils/imageUtils';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    inStock: false
  });
  const [sortBy, setSortBy] = useState('newest');

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/products', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.brand
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // In stock filter
      if (filters.inStock && (!product.stock || product.stock <= 0)) {
        return false;
      }

      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'newest':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'oldest':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        default:
          comparison = 0;
      }

      return comparison;
    });

    return filtered;
  }, [products, filters, sortBy]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    return [...new Set(products.map(product => product.category).filter(Boolean))].sort();
  }, [products]);

  // Get unique statuses for filter
  const statuses = React.useMemo(() => {
    return [...new Set(products.map(product => product.status).filter(Boolean))].sort();
  }, [products]);

  // Handle product selection for bulk actions
  const handleProductSelection = (productId, isSelected) => {
    setSelectedProducts(prev => 
      isSelected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  // Handle select all products
  const handleSelectAll = (isSelected) => {
    setSelectedProducts(isSelected ? filteredProducts.map(product => product.id) : []);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedProducts.length === 0) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          updates: { status: newStatus }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update products');
      }

      // Refresh products data
      const updatedResponse = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
      }
      
      setSelectedProducts([]);
      alert(`Successfully updated ${selectedProducts.length} product(s) to ${newStatus}`);
    } catch (err) {
      console.error('Error updating products:', err);
      alert(`Error updating products: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/products/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ productIds: selectedProducts })
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      // Remove deleted products from state
      setProducts(prev => prev.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
      
      alert(`Successfully deleted ${selectedProducts.length} product(s)`);
    } catch (err) {
      console.error('Error deleting products:', err);
      alert(`Error deleting products: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Update filter
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      inStock: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    typeof value === 'boolean' ? value : Boolean(value)
  );

  if (loading) {
    return (
      <div className="admin-products loading">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-products error">
        <div className="error-message">
          <h2>Error Loading Products</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="admin-products-header">
        <div className="header-content">
          <h1>Manage Products</h1>
          <p>Add, edit, and manage all products in the store</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/products/new" className="btn btn-primary">
            ➕ Add New Product
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="admin-filters">
        <div className="filters-row">
          {/* Search */}
          <div className="filter-group">
            <label htmlFor="product-search">Search</label>
            <input
              id="product-search"
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* In Stock Filter */}
          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => updateFilter('inStock', e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Sort Controls */}
          <div className="filter-group">
            <label htmlFor="sort-by">Sort by</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
              <option value="category">Category</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-info">
            <span>{selectedProducts.length} product(s) selected</span>
          </div>
          <div className="bulk-actions-buttons">
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('active')}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Mark Active'}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('inactive')}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Mark Inactive'}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('discontinued')}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Mark Discontinued'}
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {filteredProducts.length} of {products.length} products
          {hasActiveFilters && ' (filtered)'}
        </p>
        <div className="stats">
          <span className="stat active">
            {products.filter(p => p.status === 'active').length} Active
          </span>
          <span className="stat inactive">
            {products.filter(p => p.status === 'inactive').length} Inactive
          </span>
          <span className="stat out-of-stock">
            {products.filter(p => !p.stock || p.stock <= 0).length} Out of Stock
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        {filteredProducts.length === 0 ? (
          <div className="no-products-message">
            <h3>No products found</h3>
            <p>Try adjusting your filters or add a new product.</p>
            <Link to="/admin/products/new" className="btn btn-primary">
              Add New Product
            </Link>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all products"
                  />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <AdminProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.includes(product.id)}
                  onSelect={(isSelected) => handleProductSelection(product.id, isSelected)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Admin Product Row Component
const AdminProductRow = ({ product, isSelected, onSelect }) => {
  const productImageUrl = buildProductImageUrl(product.image);
  
  return (
    <tr className={`product-row ${isSelected ? 'selected' : ''}`}>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          aria-label={`Select ${product.name}`}
        />
      </td>
      <td>
        <div className="product-image-cell">
          <SafeImage
            src={productImageUrl}
            alt={product.name}
            className="product-thumbnail"
          />
          {!hasValidImageExtension(product.image) && (
            <span className="no-image-indicator" title="No valid image">
              📷
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="product-name-cell">
          <strong>{product.name}</strong>
          {product.brand && (
            <small>by {product.brand}</small>
          )}
        </div>
      </td>
      <td>{product.category || 'Uncategorized'}</td>
      <td>
        <span className="price">
          ${product.price ? product.price.toFixed(2) : '0.00'}
        </span>
      </td>
      <td>
        <div className="stock-cell">
          <span className={`stock ${
            product.stock <= 0 ? 'out-of-stock' : 
            product.stock <= 10 ? 'low-stock' : 
            'in-stock'
          }`}>
            {product.stock || 0}
          </span>
          {product.stock <= 10 && product.stock > 0 && (
            <small className="low-stock-warning">Low Stock</small>
          )}
        </div>
      </td>
      <td>
        <span className={`status-badge ${product.status || 'unknown'}`}>
          {product.status || 'Unknown'}
        </span>
      </td>
      <td>
        <small>
          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
        </small>
      </td>
      <td>
        <div className="action-buttons">
          <Link
            to={`/admin/products/${product.id}`}
            className="btn btn-sm btn-primary"
            title="Edit Product"
          >
            ✏️
          </Link>
          <Link
            to={`/products/${product.id}`}
            className="btn btn-sm btn-secondary"
            title="View Product"
            target="_blank"
            rel="noopener noreferrer"
          >
            👁️
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default AdminProducts;