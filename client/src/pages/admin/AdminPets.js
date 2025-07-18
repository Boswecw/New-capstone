// client/src/pages/admin/AdminPets.js - ENHANCED WITH WAKE-UP HANDLING
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
  Spinner,
  ProgressBar
} from "react-bootstrap";
import DataTable from "../../components/DataTable";
// ✅ UPDATED: Use enhanced admin API service
import adminAPI, { adminHelpers } from "../../services/adminAPI";

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading pets...');
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
  const [retryCount, setRetryCount] = useState(0);

  const fetchPets = useCallback(
    async (page = 1) => {
      setLoading(true);
      setLoadingMessage('Loading pets...');
      setRetryCount(0);
      
      try {
        console.log('🐾 Fetching admin pets...');
        
        const params = adminHelpers.buildParams({
          page,
          limit: 10,
          ...filters,
        });

        // ✅ ENHANCED: Monitor retry attempts
        const originalRetry = adminAPI.getAllPets;
        let currentRetry = 0;
        
        adminAPI.getAllPets = async (params) => {
          if (currentRetry > 0) {
            setLoadingMessage(`Waking up backend... (attempt ${currentRetry + 1})`);
            setRetryCount(currentRetry);
          }
          currentRetry++;
          return originalRetry(params);
        };

        const response = await adminAPI.getAllPets(params);
        const data = adminHelpers.handleResponse(response);
        
        setPets(data.data || []);
        setPagination(adminHelpers.getPaginationInfo(response));
        console.log('✅ Admin pets loaded:', data.data?.length || 0, 'pets');
        
        // Reset loading message
        setLoadingMessage('Loading pets...');
        setRetryCount(0);
        
      } catch (error) {
        const errorMessage = adminHelpers.handleError(error, "Error fetching pets");
        
        if (adminHelpers.isTimeoutError(error)) {
          showAlert(
            "The server is taking longer than usual to respond. This is normal for free hosting - please wait a moment and try again.",
            "warning"
          );
        } else {
          showAlert(errorMessage, "danger");
        }
      } finally {
        setLoading(false);
        setLoadingMessage('Loading pets...');
        setRetryCount(0);
      }
    },
    [filters]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const response = await adminAPI.getDashboard();
      const data = adminHelpers.handleResponse(response);
      
      console.log('✅ Dashboard data loaded');
      return data.data;
      
    } catch (error) {
      const errorMessage = adminHelpers.handleError(error, "Error fetching dashboard data");
      
      if (!adminHelpers.isTimeoutError(error)) {
        showAlert(errorMessage, "warning");
      }
      return null;
    }
  }, []);

  // ✅ NEW: Manual wake-up function
  const handleWakeUp = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Waking up backend server...');
      
      await adminAPI.wakeUp();
      
      setLoadingMessage('Backend awake! Loading pets...');
      await fetchPets();
      
    } catch (error) {
      console.error('Wake-up failed:', error);
      showAlert('Failed to wake up the server. Please try again.', 'danger');
      setLoading(false);
    }
  };

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
    
    // Auto-hide alert after 10 seconds for warnings, 5 for others
    const timeout = variant === 'warning' ? 10000 : 5000;
    setTimeout(() => {
      setAlert({ show: false, message: "", variant: "" });
    }, timeout);
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

  const handleAdoptPet = async (petId, userId = 'admin') => {
    try {
      console.log('❤️ Marking pet as adopted:', petId);
      
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
              onClick={() => handleAdoptPet(pet._id)}
            >
              Mark Adopted
            </Button>
          )}
        </div>
      )
    }
  ];

  // ✅ ENHANCED: Better loading state with wake-up progress
  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2 mt-3">{loadingMessage}</span>
        
        {retryCount > 0 && (
          <div className="mt-3 text-center" style={{ width: '300px' }}>
            <small className="text-muted">
              Backend is sleeping on free hosting. Waking it up...
            </small>
            <ProgressBar 
              animated 
              now={Math.min((retryCount / 2) * 100, 100)} 
              className="mt-2"
              style={{ height: '8px' }}
            />
          </div>
        )}
        
        {retryCount === 0 && (
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="mt-3"
            onClick={handleWakeUp}
          >
            Wake Up Server
          </Button>
        )}
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
          {alert.variant === 'warning' && adminHelpers.isTimeoutError({ message: alert.message }) && (
            <div className="mt-2">
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={handleWakeUp}
              >
                Wake Up Server
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
                onClick={() => console.log('Add first pet')}
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