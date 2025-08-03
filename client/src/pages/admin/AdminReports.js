// client/src/pages/admin/AdminReports.js - UPDATED with Real Data
import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  Form,
  Badge,
  Modal,
  Table
} from 'react-bootstrap';
import api from '../../services/api';

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const [reportData, setReportData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  const reportTypes = [
    {
      id: 'pets',
      name: 'Pet Inventory Report',
      description: 'Complete list of pets with adoption status',
      icon: 'fa-paw',
      color: 'primary'
    },
    {
      id: 'users',
      name: 'User Activity Report',
      description: 'User registrations and activity metrics',
      icon: 'fa-users',
      color: 'success'
    },
    {
      id: 'adoptions',
      name: 'Adoption Report',
      description: 'Successful adoptions and statistics',
      icon: 'fa-heart',
      color: 'danger'
    },
    {
      id: 'contacts',
      name: 'Contact Inquiries Report',
      description: 'Contact form submissions and responses',
      icon: 'fa-envelope',
      color: 'info'
    },
    {
      id: 'dashboard',
      name: 'Dashboard Summary Report',
      description: 'Overall system statistics and metrics',
      icon: 'fa-chart-line',
      color: 'warning'
    }
  ];

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: '' }), 5000);
  };

  const fetchReportData = async (reportId) => {
    try {
      setLoading(true);
      console.log('📊 Fetching report data for:', reportId);

      let response;
      
      switch (reportId) {
        case 'pets':
          response = await api.get('/admin/pets?limit=1000');
          break;
        case 'users':
          response = await api.get('/admin/users?limit=1000');
          break;
        case 'contacts':
          response = await api.get('/contact?limit=1000');
          break;
        case 'dashboard':
          response = await api.get('/admin/dashboard');
          break;
        case 'adoptions':
          // Get pets that are adopted
          response = await api.get('/admin/pets?status=adopted&limit=1000');
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (response.data.success) {
        setReportData({
          type: reportId,
          data: response.data.data,
          timestamp: new Date().toISOString(),
          count: Array.isArray(response.data.data) ? response.data.data.length : 1
        });
        
        console.log('✅ Report data fetched:', response.data.data.length || 1, 'items');
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      showAlert(error.response?.data?.message || error.message || 'Failed to fetch report data', 'danger');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data, reportType) => {
    if (!data) return '';

    let csvContent = '';
    
    switch (reportType) {
      case 'pets':
        csvContent = 'Name,Type,Breed,Age,Status,Location,Created Date\n';
        data.forEach(pet => {
          csvContent += `"${pet.name || 'Unknown'}","${pet.type || ''}","${pet.breed || ''}","${pet.age || ''}","${pet.status || ''}","${pet.location || ''}","${new Date(pet.createdAt).toLocaleDateString()}"\n`;
        });
        break;
        
      case 'users':
        csvContent = 'Name,Email,Role,Status,Join Date,Last Login\n';
        data.forEach(user => {
          csvContent += `"${user.name || 'Unknown'}","${user.email || ''}","${user.role || 'user'}","${user.isActive ? 'Active' : 'Inactive'}","${new Date(user.createdAt).toLocaleDateString()}","${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}"\n`;
        });
        break;
        
      case 'contacts':
        csvContent = 'Name,Email,Subject,Status,Date,Message\n';
        data.forEach(contact => {
          const message = (contact.message || '').replace(/"/g, '""').substring(0, 100);
          csvContent += `"${contact.name || 'Unknown'}","${contact.email || ''}","${contact.subject || ''}","${contact.status || 'new'}","${new Date(contact.createdAt).toLocaleDateString()}","${message}"\n`;
        });
        break;
        
      case 'adoptions':
        csvContent = 'Pet Name,Type,Breed,Adoption Date,Adopter\n';
        data.forEach(pet => {
          csvContent += `"${pet.name || 'Unknown'}","${pet.type || ''}","${pet.breed || ''}","${pet.adoptedAt ? new Date(pet.adoptedAt).toLocaleDateString() : 'Unknown'}","${pet.adoptedBy?.name || 'Unknown'}"\n`;
        });
        break;
        
      case 'dashboard':
        csvContent = 'Metric,Value\n';
        const stats = data.stats || {};
        Object.entries(stats).forEach(([category, values]) => {
          Object.entries(values).forEach(([key, value]) => {
            csvContent += `"${category} - ${key}","${value}"\n`;
          });
        });
        break;
        
      default:
        csvContent = 'Data\n';
        csvContent += JSON.stringify(data, null, 2);
    }
    
    return csvContent;
  };

  const handleGenerateReport = async (reportId) => {
    const data = await fetchReportData(reportId);
    if (data) {
      setSelectedReport(reportId);
      setShowPreviewModal(true);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const csvContent = generateCSV(reportData.data, reportData.type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('Report downloaded successfully', 'success');
    setShowPreviewModal(false);
  };

  const renderPreviewTable = () => {
    if (!reportData || !reportData.data) return null;

    const data = Array.isArray(reportData.data) ? reportData.data.slice(0, 10) : [reportData.data];
    
    switch (reportData.type) {
      case 'pets':
        return (
          <Table responsive striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Breed</th>
                <th>Status</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pet, index) => (
                <tr key={index}>
                  <td>{pet.name || 'Unknown'}</td>
                  <td>{pet.type || 'Unknown'}</td>
                  <td>{pet.breed || 'Unknown'}</td>
                  <td>
                    <Badge bg={pet.status === 'available' ? 'success' : pet.status === 'adopted' ? 'primary' : 'secondary'}>
                      {pet.status || 'unknown'}
                    </Badge>
                  </td>
                  <td>{pet.age || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
        
      case 'users':
        return (
          <Table responsive striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => (
                <tr key={index}>
                  <td>{user.name || 'Unknown'}</td>
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
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
        
      case 'contacts':
        return (
          <Table responsive striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((contact, index) => (
                <tr key={index}>
                  <td>{contact.name || 'Unknown'}</td>
                  <td>{contact.email}</td>
                  <td>{contact.subject || 'No subject'}</td>
                  <td>
                    <Badge bg={contact.status === 'new' ? 'primary' : contact.status === 'read' ? 'info' : 'success'}>
                      {contact.status || 'new'}
                    </Badge>
                  </td>
                  <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
        
      default:
        return (
          <pre className="bg-light p-3 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><i className="fas fa-file-alt me-2"></i>Reports</h1>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </Alert>
      )}

      <p className="text-muted mb-4">Generate and download system reports with real data</p>

      {/* Report Types Grid */}
      <Row className="g-4">
        {reportTypes.map((report) => (
          <Col md={6} lg={4} key={report.id}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <i className={`fas ${report.icon} fa-3x text-${report.color} mb-3`}></i>
                <h5 className="card-title">{report.name}</h5>
                <p className="card-text text-muted">{report.description}</p>
                <Button
                  variant={report.color}
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={loading && selectedReport === report.id}
                >
                  {loading && selectedReport === report.id ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      Generate Report
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Report Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-file-alt me-2"></i>
            Report Preview - {reportTypes.find(r => r.id === reportData?.type)?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportData && (
            <>
              <div className="mb-3">
                <Row>
                  <Col sm={6}>
                    <strong>Report Type:</strong> {reportTypes.find(r => r.id === reportData.type)?.name}
                  </Col>
                  <Col sm={6}>
                    <strong>Generated:</strong> {new Date(reportData.timestamp).toLocaleString()}
                  </Col>
                  <Col sm={6}>
                    <strong>Total Records:</strong> {reportData.count.toLocaleString()}
                  </Col>
                  <Col sm={6}>
                    <strong>Preview:</strong> Showing first 10 records
                  </Col>
                </Row>
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {renderPreviewTable()}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleDownloadReport}>
            <i className="fas fa-download me-2"></i>
            Download CSV
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Recent Reports Section */}
      <Row className="mt-5">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>Report Generation Tips
              </h5>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li><strong>Pet Inventory:</strong> Complete list of all pets with current status</li>
                <li><strong>User Activity:</strong> All registered users with login activity</li>
                <li><strong>Adoptions:</strong> Successfully adopted pets with adopter information</li>
                <li><strong>Contact Inquiries:</strong> All contact form submissions</li>
                <li><strong>Dashboard Summary:</strong> Overall system statistics and metrics</li>
              </ul>
              <Alert variant="info" className="mt-3 mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Reports are generated in real-time from your current database. 
                Large datasets may take longer to process.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminReports;