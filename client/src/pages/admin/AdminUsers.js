// client/src/pages/admin/AdminUsers.js - UPDATED with Real API
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Badge, 
  Button, 
  Alert, 
  Spinner, 
  Row, 
  Col, 
  Form,
  Modal,
  Table
} from 'react-bootstrap';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
    page: 1,
    limit: 10
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  // Fetch users from real API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      console.log('🔍 Fetching users from API...');
      const response = await api.get(`/admin/users?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination || {});
        console.log('✅ Users loaded:', response.data.data.length);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      
      // Fallback to empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 5000);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const response = await api.put(`/admin/users/${editingUser._id || editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive
      });

      if (response.data.success) {
        showAlert('User updated successfully', 'success');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert(error.response?.data?.message || 'Failed to update user', 'danger');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.data.success) {
        showAlert('User deleted successfully', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert(error.response?.data?.message || 'Failed to delete user', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-users me-2"></i>User Management</h1>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Users</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchUsers}>
            <i className="fas fa-refresh me-2"></i>Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <div>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setFilters({ search: '', role: '', isActive: '', page: 1, limit: 10 })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Users ({pagination.totalItems || users.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5>No users found</h5>
              <p className="text-muted">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3"
                          style={{ width: '40px', height: '40px', fontSize: '14px' }}
                        >
                          {(user.name || user.email || '').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold">{user.name || 'No Name'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'moderator' ? 'warning' : 'primary'}>
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.isActive ? 'success' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleEditUser(user)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => handleDeleteUser(user._id || user.id)}
                          disabled={user.role === 'admin'}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card.Footer>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems} users
              </small>
              <div>
                <Button 
                  size="sm" 
                  variant="outline-primary" 
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="me-2"
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingUser && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={editingUser.role || 'user'}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminUsers;