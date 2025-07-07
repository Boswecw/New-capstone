import React, { useState, useEffect } from 'react';
import { Card, CardBody, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import DataTable from '../../components/DataTable'; // Make sure DataTable.js is in the same directory

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for testing (replace with actual API call)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Replace this mock data with your actual API call
        // const response = await fetch('/api/admin/users');
        // const userData = await response.json();
        
        // Mock data for testing
        const mockUsers = [
          {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com',
            profile: { firstName: 'John', lastName: 'Doe' },
            role: 'admin',
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            username: 'jane_smith',
            email: 'jane@example.com',
            profile: { firstName: 'Jane', lastName: 'Smith' },
            role: 'user',
            status: 'active',
            createdAt: '2024-02-20T14:45:00Z'
          },
          {
            id: 3,
            username: null, // Testing null username
            email: 'test@example.com',
            profile: null, // Testing null profile
            role: 'user',
            status: 'inactive',
            createdAt: '2024-03-10T09:15:00Z'
          }
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUsers(mockUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Define columns with proper null checking
  const columns = [
    {
      header: 'Avatar',
      accessor: 'username',
      render: (user) => (
        <div 
          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
          style={{ width: '40px', height: '40px', fontSize: '14px' }}
        >
          {(user.username || user.email || '').charAt(0).toUpperCase() || '?'}
        </div>
      )
    },
    {
      header: 'Username',
      accessor: 'username',
      render: (user) => user.username || '-'
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (user) => user.email || '-'
    },
    {
      header: 'Name',
      accessor: 'profile',
      render: (user) => {
        const firstName = user.profile?.firstName || '';
        const lastName = user.profile?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || '-';
      }
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (user) => (
        <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
          {user.role || 'user'}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (user) => (
        <Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
          {user.status || 'inactive'}
        </Badge>
      )
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (user) => {
        if (!user.createdAt) return '-';
        try {
          return new Date(user.createdAt).toLocaleDateString();
        } catch (e) {
          return '-';
        }
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (user) => (
        <div className="d-flex gap-2">
          <Button 
            size="sm" 
            variant="outline-primary"
            onClick={() => handleEditUser(user)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline-danger"
            onClick={() => handleDeleteUser(user.id)}
            disabled={user.role === 'admin'} // Prevent deleting admin users
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Handle edit user
  const handleEditUser = (user) => {
    console.log('Edit user:', user);
    alert(`Edit user: ${user.username || user.email}`);
    // Implement edit functionality here
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // Replace with actual API call
      // await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      
      // For now, just remove from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  // Handle add new user
  const handleAddUser = () => {
    console.log('Add new user');
    alert('Add new user functionality not implemented yet');
    // Implement add user functionality
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            Add New User
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardBody>
          {users.length === 0 && !loading ? (
            <div className="text-center py-4">
              <p className="text-muted">No users found.</p>
            </div>
          ) : (
            <DataTable 
              data={users} 
              columns={columns}
              searchable={true}
              sortable={true}
              pagination={true}
              pageSize={10}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminUsers;