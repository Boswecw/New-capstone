// client/src/pages/admin/AdminPets.js - FIXED VERSION
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
// ✅ FIXED: Import the adminAPI specifically, or use the axios instance
import api, { adminAPI } from "../../services/api";

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

  const fetchPets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        console.log('🐾 Fetching admin pets...');
        
        const params = {
          page,
          limit: 10,
          ...filters,
        };

        // ✅ FIXED: Use the axios instance directly (if you chose Option 1)
        // OR use adminAPI.getAllPetsAdmin(params) if you keep the nested structure
        const response = await api.get(`/admin/pets?${new URLSearchParams(params).toString()}`);
        
        if (response.data.success) {
          setPets(response.data.data);
          setPagination(response.data.pagination || {});
          console.log('✅ Admin pets loaded:', response.data.data.length, 'pets');
        } else {
          throw new Error(response.data.message || 'Failed to fetch pets');
        }
      } catch (error) {
        console.error("❌ Error fetching pets:", error);
        showAlert(
          error.response?.data?.message || error.message || "Error fetching pets", 
          "danger"
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      // ✅ FIXED: Use the axios instance directly
      const response = await api.get('/admin/dashboard');
      
      if (response.data.success) {
        console.log('✅ Dashboard data loaded');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      showAlert(
        error.response?.data?.message || error.message || "Error fetching dashboard data", 
        "warning"
      );
      return null;
    }
  }, []);

  useEffect(() => {
    // Load both pets and dashboard data
    fetchPets();
    fetchDashboardData();
  }, [fetchPets, fetchDashboardData]);

  const showAlert = (message, variant) => {
    setAlert({ 
      show: true, 
      message, 
      variant 
    });
    
    // Auto-hide alert after 5 seconds
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
      
      // ✅ FIXED: Use the axios instance directly
      const response = await api.delete(`/admin/pets/${deletingPet._id}`);
      
      if (response.data.success) {
        showAlert("Pet deleted successfully", "success");
        fetchPets(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to delete pet');
      }
    } catch (error) {
      console.error("❌ Error deleting pet:", error);
      showAlert(
        error.response?.data?.message || error.message || "Error deleting pet", 
        "danger"
      );
    } finally {
      setShowDeleteModal(false);
      setDeletingPet(null);
    }
  };

  const handleSaveEdit = async (updatedPetData) => {
    if (!editingPet) return;

    try {
      console.log('✏️ Updating pet:', editingPet._id);
      
      // ✅ FIXED: Use the axios instance directly
      const response = await api.put(`/admin/pets/${editingPet._id}`, updatedPetData);
      
      if (response.data.success) {
        showAlert("Pet updated successfully", "success");
        fetchPets(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to update pet');
      }
    } catch (error) {
      console.error("❌ Error updating pet:", error);
      showAlert(
        error.response?.data?.message || error.message || "Error updating pet", 
        "danger"
      );
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
        <Badge bg="primary">{pet.category || pet.species}</Badge>
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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading pets...</span>
      </div>
    );
  }

  return (
    <div className="admin-pets">
      <Row className="mb-4">
        <Col>
          <h2>Pets Management</h2>
          <p className="text-muted">Manage pet listings and information</p>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
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
          <DataTable
            data={pets}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={fetchPets}
          />
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Pet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Add your pet edit form here */}
          <p>Pet editing form would go here...</p>
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
          Are you sure you want to delete {deletingPet?.name}? This action cannot be undone.
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