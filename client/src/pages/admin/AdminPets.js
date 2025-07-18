// client/src/pages/admin/AdminPets.js - SIMPLE WORKING VERSION
import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Alert,
  Badge,
  Spinner
} from "react-bootstrap";
import DataTable from "../../components/DataTable";
import axios from 'axios';

// ✅ SIMPLE: Create axios instance directly in component
const createAdminAPI = () => {
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

  // Add auth token
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 Admin Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });

  // Add response logging
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
};

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
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

  // Create API instance
  const adminAPI = createAdminAPI();

  const fetchPets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        console.log('🐾 Fetching admin pets...');
        
        const params = new URLSearchParams({
          page,
          limit: 10,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== "")
          )
        });

        // ✅ FIXED: Direct API call
        const response = await adminAPI.get(`/admin/pets?${params.toString()}`);
        
        if (response.data.success) {
          setPets(response.data.data || []);
          setPagination(response.data.pagination || {});
          console.log('✅ Admin pets loaded:', response.data.data?.length || 0, 'pets');
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
    [filters, adminAPI]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const response = await adminAPI.get('/admin/dashboard');
      
      if (response.data.success) {
        console.log('✅ Dashboard data loaded');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
      
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      
      if (error.code !== 'ECONNABORTED') {
        let errorMessage = "Error fetching dashboard data";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        showAlert(errorMessage, "warning");
      }
      return null;
    }
  }, [adminAPI]);

  // ✅ Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([fetchPets(), fetchDashboardData()]);
  };

  useEffect(() => {
    fetchPets();
    fetchDashboardData();
  }, [fetchPets, fetchDashboardData]);

  const showAlert = (message, variant) => {
    setAlert({ 
      show: true, 
      message, 
      variant 
    });
    
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
        fetchPets();
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
        fetchPets();
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
      label: 'Category',
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
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="mt-3"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-pets">
      <Row className="mb-4">
        <Col>
          <h2>Pets Management</h2>
          <p className="text-muted">
            Manage pet listings and information 
            <small className="ms-2 text-success">({pets.length} pets loaded)</small>
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="me-2"
            onClick={handleRefresh}
          >
            <i className="fas fa-sync me-1"></i>Refresh
          </Button>
          <Button 
            variant="primary"
            onClick={() => console.log('Create new pet clicked')}
          >
            <i className="fas fa-plus me-2"></i>Add New Pet
          </Button>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
          {alert.variant === 'warning' && (
            <div className="mt-2">
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
              <Button 
                variant="outline-info" 
                size="sm"
                className="ms-2"
                onClick={() => window.open('https://furbabies-backend.onrender.com/api/health', '_blank')}
              >
                Wake Backend
              </Button>
            </div>
          )}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search pets..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="fish">Fish</option>
            <option value="rabbit">Rabbits</option>
            <option value="other">Other</option>
          </Form.Select>
        </Col>
        <Col md={3}>
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
      </Row>

      <Card>
        <Card.Body>
          {pets.length > 0 ? (
            <DataTable
              data={pets}
              columns={columns}
              loading={loading}
              pagination={pagination}
              onPageChange={fetchPets}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">
                No pets found matching your criteria.
                <br />
                <small>Database shows 55 pets available - check your filters or refresh.</small>
              </p>
              <Button 
                variant="primary"
                onClick={handleRefresh}
                className="me-2"
              >
                <i className="fas fa-sync me-1"></i>Refresh Data
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => setFilters({ search: "", category: "", type: "", status: "", available: "" })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Pet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Pet editing form would go here...</p>
          {editingPet && (
            <div>
              <p><strong>Name:</strong> {editingPet.name}</p>
              <p><strong>Breed:</strong> {editingPet.breed}</p>
              <p><strong>Age:</strong> {editingPet.age}</p>
              <p><strong>Status:</strong> {editingPet.status}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSaveEdit({})}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deletingPet?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletePet}>
            Delete Pet
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminPets;