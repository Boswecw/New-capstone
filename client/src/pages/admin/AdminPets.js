// client/src/pages/admin/AdminPets.js - SHOW ALL PETS VERSION
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

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'all'
  const [itemsPerPage, setItemsPerPage] = useState(20); // Increased default
  
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    type: "",
    status: "",
    available: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPet, setDeletingPet] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  // ✅ Stable API instance
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
      console.log(`📡 Admin Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    api.interceptors.response.use(
      (response) => {
        console.log(`✅ Admin Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Admin Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  const fetchPets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        console.log(`🐾 Fetching admin pets - Page: ${page}, ViewMode: ${viewMode}`);
        
        const params = new URLSearchParams({
          page,
          // ✅ KEY CHANGE: Dynamic limit based on view mode
          limit: viewMode === 'all' ? 10000 : itemsPerPage, // Use high number for "show all"
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "")
          )
        });

        const response = await adminAPI.get(`/admin/pets?${params.toString()}`);
        
        if (response.data.success) {
          setPets(response.data.data || []);
          setPagination(response.data.pagination || {});
          console.log(`✅ Admin pets loaded: ${response.data.data?.length || 0} pets (Total: ${response.data.pagination?.totalPets || 0})`);
        } else {
          throw new Error(response.data.message || 'Failed to fetch pets');
        }
        
      } catch (error) {
        console.error("❌ Error fetching pets:", error);
        
        let errorMessage = "Error fetching pets";
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

  // ✅ Load pets on mount
  useEffect(() => {
    console.log('🔄 AdminPets: Loading initial data');
    fetchPets(currentPage);
  }, []);

  // ✅ Refetch when filters, view mode, or items per page change
  useEffect(() => {
    console.log('🔍 AdminPets: Filters/ViewMode changed, refetching');
    setCurrentPage(1); // Reset to first page when filters change
    fetchPets(1);
  }, [filters, viewMode, itemsPerPage]);

  // ✅ Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPets(page);
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

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setShowEditModal(true);
  };

  const handleDeletePet = (pet) => {
    setDeletingPet(pet);
    setShowDeleteModal(true);
  };

  const confirmDeletePet = async () => {
    if (!deletingPet) return;

    try {
      console.log('🗑️ Deleting pet:', deletingPet._id);
      
      const response = await adminAPI.delete(`/admin/pets/${deletingPet._id}`);
      
      if (response.data.success) {
        showAlert("Pet deleted successfully", "success");
        fetchPets(currentPage);
      } else {
        throw new Error(response.data.message || 'Failed to delete pet');
      }
      
    } catch (error) {
      console.error("❌ Error deleting pet:", error);
      showAlert(error.response?.data?.message || error.message || "Error deleting pet", "danger");
    } finally {
      setShowDeleteModal(false);
      setDeletingPet(null);
    }
  };

  const handleSaveEdit = async (updatedPetData) => {
    if (!editingPet) return;

    try {
      console.log('✏️ Updating pet:', editingPet._id);
      
      const response = await adminAPI.put(`/admin/pets/${editingPet._id}`, updatedPetData);
      
      if (response.data.success) {
        showAlert("Pet updated successfully", "success");
        fetchPets(currentPage);
      } else {
        throw new Error(response.data.message || 'Failed to update pet');
      }
      
    } catch (error) {
      console.error("❌ Error updating pet:", error);
      showAlert(error.response?.data?.message || error.message || "Error updating pet", "danger");
    } finally {
      setShowEditModal(false);
      setEditingPet(null);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh');
    fetchPets(currentPage);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (pet) => (
        <div>
          <strong>{pet.name}</strong>
          <br />
          <small className="text-muted">{pet.breed}</small>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Type',
      render: (pet) => (
        <Badge bg="primary">{pet.category || pet.species || pet.type}</Badge>
      )
    },
    {
      key: 'age',
      label: 'Age',
      render: (pet) => `${pet.age || 'Unknown'}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (pet) => (
        <Badge 
          bg={pet.status === 'available' ? 'success' : 
              pet.status === 'adopted' ? 'info' : 'warning'}
        >
          {pet.status || 'available'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (pet) => (
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="me-2"
            onClick={() => handleEditPet(pet)}
          >
            Edit
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleDeletePet(pet)}
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
        <span className="ms-2 mt-3">Loading pets...</span>
      </div>
    );
  }

  return (
    <div className="admin-pets">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Pets Management</h2>
              <p className="text-muted mb-0">
                Manage pet listings and information
                <Badge bg="success" className="ms-2">
                  {viewMode === 'all' 
                    ? `${pets.length} pets total` 
                    : `${pets.length} of ${pagination.totalPets || 0} pets`
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
              All Pets 
              {viewMode === 'all' && (
                <Badge bg="info" className="ms-2">Showing All</Badge>
              )}
            </h5>
            <div className="d-flex gap-2">
              <Button variant="success" size="sm">
                <i className="fas fa-plus me-2"></i>
                Add Pet
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
                placeholder="Search pets..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.type}
                onChange={(e) => handleFilterChange({ type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
                <option value="bird">Birds</option>
                <option value="fish">Fish</option>
                <option value="small-pet">Small Pets</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="adopted">Adopted</option>
                <option value="pending">Pending</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => setFilters({ search: "", category: "", type: "", status: "", available: "" })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>

          {/* ✅ DATA TABLE */}
          <DataTable
            data={pets}
            columns={columns}
            loading={loading}
            pagination={viewMode === 'paginated' ? pagination : null}
            onPageChange={viewMode === 'paginated' ? handlePageChange : null}
          />

          {/* ✅ PAGINATION CONTROLS (only show in paginated mode) */}
          {viewMode === 'paginated' && pagination.totalPages > 1 && (
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
                {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                  const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                  if (pageNum > pagination.totalPages) return null;
                  
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
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
                <Pagination.Last 
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.totalPages)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit and Delete Modals would go here */}
    </div>
  );
};

export default AdminPets;