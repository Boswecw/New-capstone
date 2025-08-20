// client/src/pages/admin/AdminProducts.js - COMPLETE REFACTORED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import useProductFilters from '../../hooks/useProductFilters';
import { buildProductImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  console.log('🛒 AdminProducts: Component rendering, products state:', products);

  const {
    filters,
    sortBy,
    filteredProducts,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy
  } = useProductFilters(products, { status: '' }); // Show all statuses by default in admin

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🛒 AdminProducts: Fetching products from API...');
        
        const response = await api.get('/products', {
          params: {
            page: 1,
            limit: 50 // Get more products for admin view
          }
        });
        
        console.log('🛒 AdminProducts: API Response status:', response.status);
        console.log('🛒 AdminProducts: API Response data:', response.data);
        
        if (response.data.success && response.data.data) {
          // Handle both paginated and non-paginated responses
          const productsData = response.data.data;
          
          if (Array.isArray(productsData)) {
            console.log('🛒 AdminProducts: Extracted products array:', productsData);
            setProducts(productsData);
          } else {
            console.error('🛒 AdminProducts: Expected array, got:', typeof productsData);
            setProducts([]);
          }
        } else {
          console.error('🛒 AdminProducts: Invalid response format:', response.data);
          setProducts([]);
        }
      } catch (err) {
        console.error('🛒 AdminProducts: Error fetching products:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
    setSelectedProducts(isSelected ? filteredProducts.map(product => product.id || product._id) : []);
  };

  // Handle bulk actions - Using individual API calls since bulk endpoints don't exist
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return;

    setActionLoading(true);
    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            // Delete products individually since no bulk delete endpoint exists
            const deletePromises = selectedProducts.map(productId => 
              api.delete(`/products/${productId}`)
            );
            
            await Promise.all(deletePromises);
            
            // Remove deleted products from state
            setProducts(products.filter(product => !selectedProducts.includes(product.id || product._id)));
            setSelectedProducts([]);
            alert(`Successfully deleted ${selectedProducts.length} product(s)`);
          }
          break;
          
        case 'inStock':
          // Update products to be in stock
          const inStockPromises = selectedProducts.map(productId => 
            api.put(`/products/${productId}`, { inStock: true })
          );
          
          await Promise.all(inStockPromises);
          
          // Update state 
          setProducts(products.map(product => {
            if (selectedProducts.includes(product.id || product._id)) {
              return { ...product, inStock: true };
            }
            return product;
          }));
          
          setSelectedProducts([]);
          alert(`Successfully marked ${selectedProducts.length} product(s) as in stock`);
          break;
          
        case 'outOfStock':
          // Update products to be out of stock
          const outOfStockPromises = selectedProducts.map(productId => 
            api.put(`/products/${productId}`, { inStock: false })
          );
          
          await Promise.all(outOfStockPromises);
          
          // Update state
          setProducts(products.map(product => {
            if (selectedProducts.includes(product.id || product._id)) {
              return { ...product, inStock: false };
            }
            return product;
          }));
          
          setSelectedProducts([]);
          alert(`Successfully marked ${selectedProducts.length} product(s) as out of stock`);
          break;
          
        case 'featured':
          // Toggle featured status
          const featuredPromises = selectedProducts.map(productId => 
            api.put(`/products/${productId}`, { featured: true })
          );
          
          await Promise.all(featuredPromises);
          
          // Update state
          setProducts(products.map(product => {
            if (selectedProducts.includes(product.id || product._id)) {
              return { ...product, featured: true };
            }
            return product;
          }));
          
          setSelectedProducts([]);
          alert(`Successfully marked ${selectedProducts.length} product(s) as featured`);
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to perform bulk action';
      alert(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-products loading">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading products...</span>
            </div>
            <p className="mt-3 text-muted">Loading products data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-products error">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error Loading Products
                  </h4>
                </div>
                <div className="card-body text-center">
                  <p className="card-text mb-3">{error}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-sync me-2"></i>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🛒 AdminProducts: Final render state:', {
    productsCount: products.length,
    filteredCount: filteredProducts.length,
    selectedCount: selectedProducts.length,
    hasFilters: hasActiveFilters
  });

  return (
    <div className="admin-products">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h1 className="h3 mb-0">
              <i className="fas fa-box me-2 text-primary"></i>
              Manage Products
            </h1>
            <p className="text-muted">
              {filterStats.total} total products, {filterStats.filtered} displayed
            </p>
          </div>
          <div className="col-md-6 text-end">
            <Link to="/admin/products/new" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Add New Product
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small text-muted">Category</label>
                    <select
                      className="form-select"
                      value={filters.category}
                      onChange={(e) => updateFilter('category', e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {filterOptions.categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Brand</label>
                    <select
                      className="form-select"
                      value={filters.brand}
                      onChange={(e) => updateFilter('brand', e.target.value)}
                    >
                      <option value="">All Brands</option>
                      {filterOptions.brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Stock Status</label>
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                    >
                      <option value="">All Products</option>
                      <option value="inStock">In Stock</option>
                      <option value="outOfStock">Out of Stock</option>
                      <option value="featured">Featured</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, brand, or description..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Sort</label>
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="price">Price Low-High</option>
                      <option value="priceDesc">Price High-Low</option>
                      <option value="stock">Stock High-Low</option>
                      <option value="category">Category</option>
                    </select>
                  </div>
                </div>
                
                {/* Additional Filters Row */}
                <div className="row g-3 mt-2">
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Min Price</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Max Price</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="999.99"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">&nbsp;</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => updateFilter('inStock', e.target.checked)}
                        id="inStockFilter"
                      />
                      <label className="form-check-label" htmlFor="inStockFilter">
                        In Stock Only
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    {hasActiveFilters && (
                      <div className="d-flex align-items-end h-100">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={resetFilters}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>{selectedProducts.length}</strong> products selected
                  </span>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleBulkAction('inStock')}
                      disabled={actionLoading}
                    >
                      Mark In Stock
                    </button>
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleBulkAction('outOfStock')}
                      disabled={actionLoading}
                    >
                      Mark Out of Stock
                    </button>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handleBulkAction('featured')}
                      disabled={actionLoading}
                    >
                      Mark Featured
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleBulkAction('delete')}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex gap-3 text-muted small">
              <span className="badge bg-success">
                {filterStats.inStock} In Stock
              </span>
              <span className="badge bg-danger">
                {filterStats.outOfStock} Out of Stock
              </span>
              <span className="badge bg-info text-dark">
                {filterStats.featured} Featured
              </span>
              {filterStats.lowStock > 0 && (
                <span className="badge bg-warning text-dark">
                  {filterStats.lowStock} Low Stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-content text-center py-5">
              <i className="fas fa-box fa-3x text-muted mb-3"></i>
              <h3>No products found</h3>
              <p className="text-muted">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.'
                  : 'No products have been added yet.'
                }
              </p>
              {!hasActiveFilters && (
                <Link to="/admin/products/new" className="btn btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Add Your First Product
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Featured</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id || product._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id || product._id)}
                        onChange={(e) => handleProductSelection(product.id || product._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="product-image-thumb">
                        <SafeImage
                          src={product.imageUrl || buildProductImageUrl(product.image)}
                          alt={product.name}
                          entityType="product"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <Link to={`/admin/products/${product.id || product._id}`} className="product-name-link">
                        <strong>{product.name}</strong>
                      </Link>
                      {product.brand && (
                        <div className="small text-muted">by {product.brand}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {product.category}
                      </span>
                    </td>
                    <td>{product.brand || 'N/A'}</td>
                    <td>
                      <span className="fw-bold text-success">
                        ${product.price ? product.price.toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.inStock ? 'bg-success' : 'bg-danger'}`}>
                        {product.inStock ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.featured ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
                        {product.featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      {new Date(product.updatedAt || product.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/admin/products/${product.id || product._id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                          title="Edit Product"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <Link 
                          to={`/products/${product.id || product._id}`}
                          className="btn btn-sm btn-outline-secondary"
                          title="View Product"
                          target="_blank"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;