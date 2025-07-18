// client/src/pages/admin/AdminProducts.js - Product Management for Admins
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Alert,
  Badge,
  Spinner,
  ButtonGroup,
  Pagination
} from "react-bootstrap";
import DataTable from "../../components/DataTable";
import axios from 'axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'all'
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    inStock: "",
    priceRange: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  // ✅ Stable API instance (same pattern as AdminPets)
  const adminAPI = useMemo(() => {
    const api = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://furbabies-backend.onrender.com/api'
        : 'http://localhost:5000/api',
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📡 Admin Products Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    api.interceptors.response.use(
      (response) => {
        console.log(`✅ Admin Products Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Admin Products Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        console.log(`🛒 Fetching admin products - Page: ${page}, ViewMode: ${viewMode}`);
        
        const params = new URLSearchParams({
          page,
          limit: viewMode === 'all' ? 10000 : itemsPerPage,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "")
          )
        });

        // ✅ Use existing /products endpoint (it has admin protection)
        // or we could use /admin/products if that route exists
        let endpoint = '/products';
        
        // Try admin-specific endpoint first, fallback to regular products endpoint
        try {
          const response = await adminAPI.get(`/admin/products?${params.toString()}`);
          if (response.data.success) {
            setProducts(response.data.data || []);
            setPagination(response.data.pagination || {});
            console.log(`✅ Admin products loaded: ${response.data.data?.length || 0} products`);
          }
        } catch (adminError) {
          if (adminError.response?.status === 404) {
            // Admin endpoint doesn't exist, use regular products endpoint
            console.log('🔄 Admin products endpoint not found, using regular products endpoint...');
            const response = await adminAPI.get(`/products?${params.toString()}`);
            
            if (response.data.success) {
              setProducts(response.data.data || []);
              setPagination(response.data.pagination || {});
              console.log(`✅ Products loaded via regular endpoint: ${response.data.data?.length || 0} products`);
            } else {
              throw new Error(response.data.message || 'Failed to fetch products');
            }
          } else {
            throw adminError;
          }
        }
        
      } catch (error) {
        console.error("❌ Error fetching products:", error);
        
        let errorMessage = "Error fetching products";
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Request timed out. Please try again in a moment.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        showAlert(errorMessage, error.code === 'ECONNABORTED' ? "warning" : "danger");
      } finally {
        setLoading(false);
      }
    },
    [filters, adminAPI, viewMode, itemsPerPage]
  );

  // ✅ Load products on mount
  useEffect(() => {
    console.log('🔄 AdminProducts: Loading initial data');
    fetchProducts(currentPage);
  }, []);

  // ✅ Refetch when filters, view mode, or items per page change
  useEffect(() => {
    console.log('🔍 AdminProducts: Filters/ViewMode changed, refetching');
    setCurrentPage(1);
    fetchProducts(1);
  }, [filters, viewMode, itemsPerPage]);

  // ✅ Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  // ✅ Handle view mode toggle
  const handleViewModeChange = (mode) => {
    console.log(`🔄 Switching view mode to: ${mode}`);
    setViewMode(mode);
    setCurrentPage(1);
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => {
      setAlert({ show: false, message: "", variant: "" });
    }, 5000);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      console.log('🗑️ Deleting product:', deletingProduct._id);
      
      // Try admin endpoint first, fallback to regular endpoint
      let response;
      try {
        response = await adminAPI.delete(`/admin/products/${deletingProduct._id}`);
      } catch (adminError) {
        if (adminError.response?.status === 404) {
          response = await adminAPI.delete(`/products/${deletingProduct._id}`);
        } else {
          throw adminError;
        }
      }
      
      if (response.data.success) {
        showAlert("Product deleted successfully", "success");
        fetchProducts(currentPage);
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
      
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      showAlert(error.response?.data?.message || error.message || "Error deleting product", "danger");
    } finally {
      setShowDeleteModal(false);
      setDeletingProduct(null);
    }
  };

  const handleSaveEdit = async (updatedProductData) => {
    if (!editingProduct) return;

    try {
      console.log('✏️ Updating product:', editingProduct._id);
      
      // Try admin endpoint first, fallback to regular endpoint
      let response;
      try {
        response = await adminAPI.put(`/admin/products/${editingProduct._id}`, updatedProductData);
      } catch (adminError) {
        if (adminError.response?.status === 404) {
          response = await adminAPI.put(`/products/${editingProduct._id}`, updatedProductData);
        } else {
          throw adminError;
        }
      }
      
      if (response.data.success) {
        showAlert("Product updated successfully", "success");
        fetchProducts(currentPage);
      } else {
        throw new Error(response.data.message || 'Failed to update product');
      }
      
    } catch (error) {
      console.error("❌ Error updating product:", error);
      showAlert(error.response?.data?.message || error.message || "Error updating product", "danger");
    } finally {
      setShowEditModal(false);
      setEditingProduct(null);
    }
  };

  const handleAddProductSave = async (newProductData) => {
    try {
      console.log('➕ Creating new product:', newProductData);
      
      // Try admin endpoint first, fallback to regular endpoint
      let response;
      try {
        response = await adminAPI.post('/admin/products', newProductData);
      } catch (adminError) {
        if (adminError.response?.status === 404) {
          response = await adminAPI.post('/products', newProductData);
        } else {
          throw adminError;
        }
      }
      
      if (response.data.success) {
        showAlert("Product created successfully", "success");
        fetchProducts(currentPage);
      } else {
        throw new Error(response.data.message || 'Failed to create product');
      }
      
    } catch (error) {
      console.error("❌ Error creating product:", error);
      showAlert(error.response?.data?.message || error.message || "Error creating product", "danger");
    } finally {
      setShowAddModal(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh');
    fetchProducts(currentPage);
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (product) => (
        <div>
          <strong>{product.name}</strong>
          <br />
          <small className="text-muted">{product.brand || 'No Brand'}</small>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => (
        <Badge bg="primary">{product.category || 'Uncategorized'}</Badge>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (product) => (
        <strong className="text-success">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </strong>
      )
    },
    {
      key: 'inStock',
      label: 'Stock',
      render: (product) => (
        <Badge 
          bg={product.inStock !== false ? 'success' : 'danger'}
        >
          {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="me-2"
            onClick={() => handleEditProduct(product)}
          >
            Edit
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleDeleteProduct(product)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2 mt-3">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Products Management</h2>
              <p className="text-muted mb-0">
                Manage product inventory and information
                <Badge bg="success" className="ms-2">
                  {viewMode === 'all' 
                    ? `${products.length} products total` 
                    : `${products.length} of ${pagination.total || 0} products`
                  }
                </Badge>
              </p>
            </div>
            
            {/* ✅ VIEW MODE CONTROLS */}
            <div className="d-flex gap-3 align-items-center">
              <div>
                <Form.Label className="me-2 mb-0">View:</Form.Label>
                <ButtonGroup size="sm">
                  <Button 
                    variant={viewMode === 'paginated' ? 'primary' : 'outline-primary'}
                    onClick={() => handleViewModeChange('paginated')}
                  >
                    Paginated
                  </Button>
                  <Button 
                    variant={viewMode === 'all' ? 'primary' : 'outline-primary'}
                    onClick={() => handleViewModeChange('all')}
                  >
                    Show All
                  </Button>
                </ButtonGroup>
              </div>
              
              {viewMode === 'paginated' && (
                <div>
                  <Form.Label className="me-2 mb-0">Per Page:</Form.Label>
                  <Form.Select 
                    size="sm" 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    style={{width: 'auto'}}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Form.Select>
                </div>
              )}
              
              <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              All Products 
              {viewMode === 'all' && (
                <Badge bg="info" className="ms-2">Showing All</Badge>
              )}
            </h5>
            <div className="d-flex gap-2">
              <Button variant="success" size="sm" onClick={handleAddProduct}>
                <i className="fas fa-plus me-2"></i>
                Add Product
              </Button>
              <Button variant="outline-primary" size="sm">
                <i className="fas fa-download me-2"></i>
                Export
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* ✅ FILTERS ROW */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Control
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="toys">Toys</option>
                <option value="food">Food</option>
                <option value="accessories">Accessories</option>
                <option value="health">Health</option>
                <option value="grooming">Grooming</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.inStock}
                onChange={(e) => handleFilterChange({ inStock: e.target.value })}
              >
                <option value="">All Stock</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.brand}
                onChange={(e) => handleFilterChange({ brand: e.target.value })}
              >
                <option value="">All Brands</option>
                <option value="purina">Purina</option>
                <option value="kong">KONG</option>
                <option value="hill's">Hill's</option>
                <option value="royal canin">Royal Canin</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setFilters({ search: "", category: "", brand: "", inStock: "", priceRange: "" })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>

          {/* ✅ DATA TABLE */}
          <DataTable
            data={products}
            columns={columns}
            loading={loading}
            pagination={viewMode === 'paginated' ? pagination : null}
            onPageChange={viewMode === 'paginated' ? handlePageChange : null}
          />

          {/* ✅ PAGINATION CONTROLS (only show in paginated mode) */}
          {viewMode === 'paginated' && pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                />
                <Pagination.Prev 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                
                {/* Show page numbers */}
                {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                  const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
                <Pagination.Last 
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(pagination.pages)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* TODO: Add Edit, Delete, and Add Product Modals */}
      {/* These would be similar to AdminPets modals but with product fields */}
    </div>
  );
};

export default AdminProducts;