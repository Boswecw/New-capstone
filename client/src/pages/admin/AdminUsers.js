import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Modal, Alert, Badge } from 'react-bootstrap';
import DataTable from '../../components/admin/DataTable';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    role: ''
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...filters
      });

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert('Error fetching users', 'danger');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ... rest of the component stays the same
  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 5000);
  };

  const handleEditRole = (user) => {
    setEditingUser({ ...user, newRole: user.role });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    try {
      await api.put(`/admin/users/${editingUser._id}/role`, {
        role: editingUser.newRole
      });
      showAlert('User role updated successfully', 'success');
      setShowRoleModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      showAlert('Error updating user role', 'danger');
      console.error('Error updating user role:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', role: '' });
  };

  const columns = [
    {
      header: 'Avatar',
      accessor: 'username',
      render: (user) => (
        <div 
          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
          style={{ width: '50px', height: '50px' }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
      )
    },
    {
      header: 'Username',
      accessor: 'username'
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Name',
      accessor: 'profile',
      render: (user) => {
        const firstName = user.profile?.firstName || '';
        const lastName = user.profile?.lastName || '';
        return `${firstName} ${lastName}`.trim() || '-';
      }
    },
    {
      header: 'Role',
      accessor: 'role',
      type: 'badge',
      badgeVariant: (value) => value === 'admin' ? 'danger' : 'primary',
      render: (user) => (
        <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
          {user.role}
        </Badge>
      )
    },
    {
      header: 'Favorites',
      accessor: 'favoritesPets',
      render: (user) => user.favoritesPets?.length || 0
    },
    {
      header: 'Phone',
      accessor: 'profile.phone',
      render: (user) => user.profile?.phone || '-'
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      type: 'date'
    }
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-users me-2"></i>User Management</h1>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by username or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card>
        <Card.Body>
          <DataTable
            data={users}
            columns={columns}
            onEdit={handleEditRole}
            pagination={pagination}
            onPageChange={fetchUsers}
            loading={loading}
          />
        </Card.Body>
      </Card>

      {/* Edit Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingUser && (
            <div>
              <div className="mb-3">
                <h6>User: {editingUser.username}</h6>
                <p className="text-muted mb-0">Email: {editingUser.email}</p>
              </div>
              
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={editingUser.newRole}
                  onChange={(e) => setEditingUser({...editingUser, newRole: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Admins have full access to the admin dashboard and can manage all content.
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveRole}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminUsers;