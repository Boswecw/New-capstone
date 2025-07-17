// client/src/pages/admin/AdminPets.js - USING SHARED ADMIN API
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
// ✅ UPDATED: Use shared admin API service
import adminAPI, { adminHelpers } from "../../services/adminAPI";

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
        
        const params = adminHelpers.buildParams({
          page,
          limit: 10,
          ...filters,
        });

        // ✅ FIXED: Use shared admin API
        const response = await adminAPI.getAllPets(params);
        const data = adminHelpers.handleResponse(response);
        
        setPets(data.data || []);
        setPagination(adminHelpers.getPaginationInfo(response));
        console.log('✅ Admin pets loaded:', data.data?.length || 0, 'pets');
        
      } catch (error) {
        const errorMessage = adminHelpers.handleError(error, "Error fetching pets");
        showAlert(errorMessage, "danger");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      // ✅ FIXED: Use shared admin API
      const response = await adminAPI.getDashboard();
      const data = adminHelpers.handleResponse(response);
      
      console.log('✅ Dashboard data loaded');
      return data.data;
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error fetching dashboard data");
      showAlert(errorMessage, "warning");
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
      
      // ✅ FIXED: Use shared admin API
      const response = await adminAPI.deletePet(deletingPet._id);
      adminHelpers.handleResponse(response);
      
      showAlert("Pet deleted successfully", "success");
      fetchPets(); // Refresh the list
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error deleting pet");
      showAlert(errorMessage, "danger");
    } finally {
      setShowDeleteModal(false);
      setDeletingPet(null);
    }
  };

  const handleSaveEdit = async (updatedPetData) => {
    if (!editingPet) return;

    try {
      console.log('✏️ Updating pet:', editingPet._id);
      
      // ✅ FIXED: Use shared admin API
      const response = await adminAPI.updatePet(editingPet._id, updatedPetData);
      adminHelpers.handleResponse(response);
      
      showAlert("Pet updated successfully", "success");
      fetchPets(); // Refresh the list
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error updating pet");
      showAlert(errorMessage, "danger");
    } finally {
      setShowEditModal(false);
      setEditingPet(null);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleCreatePet = async (petData) => {
    try {
      console.log('➕ Creating new pet...');
      
      // ✅ FIXED: Use shared admin API
      const response = await adminAPI.createPet(petData);
      adminHelpers.handleResponse(response);
      
      showAlert("Pet created successfully", "success");
      fetchPets(); // Refresh the list
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error creating pet");
      showAlert(errorMessage, "danger");
    }
  };

  const handleAdoptPet = async (petId, userId) => {
    try {
      console.log('❤️ Marking pet as adopted:', petId);
      
      // ✅ FIXED: Use shared admin API
      const response = await adminAPI.adoptPet(petId, userId);
      adminHelpers.handleResponse(response);
      
      showAlert("Pet marked as adopted successfully", "success");
      fetchPets(); // Refresh the list
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error marking pet as adopted");
      showAlert(errorMessage, "danger");
    }
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
          {pet.status === 'available' && (
            <Button 
              variant="outline-success" 
              size="sm"
              className="ms-2"
              onClick={() => handleAdoptPet(pet._id, 'admin')}
            >
              Mark Adopted
            </Button>
          )}
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
        <Col xs="auto">
          <Button 
            variant="primary"
            onClick={() => {
              // You can implement a create pet modal here
              console.log('Create new pet clicked');
            }}
          >
            <i className="fas fa-plus me-2"></i>Add New Pet
          </Button>
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
              <p className="text-muted">No pets found matching your criteria.</p>
              <Button 
                variant="primary"
                onClick={() => handleCreatePet({})}
              >
                Add First Pet
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