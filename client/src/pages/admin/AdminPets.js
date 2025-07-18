// client/src/pages/admin/AdminPets.js - FIXED INFINITE LOOP VERSION
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
  Spinner
} from "react-bootstrap";
import DataTable from "../../components/DataTable";
import axios from 'axios';

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

  // ✅ FIXED: Use useMemo to prevent adminAPI from changing on every render
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
  }, []); // ✅ Empty dependency array - only create once

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
    [filters, adminAPI] // ✅ Now adminAPI is stable, won't cause infinite loops
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
  }, [adminAPI]); // ✅ Now adminAPI is stable

  // ✅ Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([fetchPets(), fetchDashboardData()]);
  };

  // ✅ FIXED: Only run once on mount, not every time dependencies change
  useEffect(() => {
    console.log('🔄 AdminPets useEffect triggered - loading initial data');
    fetchPets();
    fetchDashboardData();
  }, []); // ✅ Empty dependency array - only run on mount

  // ✅ Separate useEffect for when filters change
  useEffect(() => {
    console.log('🔍 Filters changed, refetching pets:', filters);
    fetchPets();
  }, [filters]); // ✅ Only when filters change, not fetchPets function

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
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">All Pets</h5>
            <Button variant="primary" size="sm" onClick={handleRefresh}>
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <DataTable
            data={pets}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => fetchPets(page)}
          />
        </Card.Body>
      </Card>

      {/* Edit Modal - Add your edit modal JSX here */}
      {/* Delete Modal - Add your delete modal JSX here */}
    </div>
  );
};

export default AdminPets;