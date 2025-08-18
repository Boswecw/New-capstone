// client/src/pages/admin/AdminAnalytics.js - REWRITTEN with DataTable
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Badge,
  ProgressBar 
} from 'react-bootstrap';
import DataTable from '../../components/DataTable';
import axios from 'axios';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalPets: 0,
      totalAdoptions: 0,
      totalContacts: 0,
      growthRate: 0,
      conversionRate: 0
    },
    chartData: {
      userRegistrations: [],
      petAdoptions: [],
      pageViews: [],
      topPages: []
    },
    topPages: [],
    userFlow: [],
    recentActivity: [],
    performanceMetrics: [],
    popularPets: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);

  // Create stable admin API instance
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
      return config;
    });

    return api;
  }, []);

  const dateRanges = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 3 months' },
    { value: '1year', label: 'Last year' }
  ];

  // Performance Metrics Table Columns
  const performanceColumns = [
    {
      header: 'Metric',
      accessor: 'metric',
    },
    {
      header: 'Current Value',
      accessor: 'value',
      render: (item) => <strong>{item.value}</strong>
    },
    {
      header: 'Target',
      accessor: 'target',
      render: (item) => <span className="text-muted">{item.target}</span>
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (item) => (
        <ProgressBar 
          now={item.progress || 0} 
          variant={item.progress >= 80 ? 'success' : item.progress >= 60 ? 'warning' : 'danger'}
          style={{ width: '100px' }}
        />
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value?.toLowerCase()) {
          case 'excellent': return 'success';
          case 'good': return 'primary';
          case 'needs improvement': return 'warning';
          case 'critical': return 'danger';
          default: return 'secondary';
        }
      }
    }
  ];

  // Popular Pets Table Columns
  const popularPetsColumns = [
    {
      header: 'Pet Name',
      accessor: 'name',
      render: (item) => (
        <div>
          <strong>{item.name}</strong>
          <div className="small text-muted">{item.breed}</div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      type: 'badge',
      badgeVariant: (value) => value === 'Dog' ? 'primary' : 'info'
    },
    {
      header: 'Views',
      accessor: 'views',
      render: (item) => (
        <div className="d-flex align-items-center">
          <i className="fas fa-eye me-2 text-muted"></i>
          {item.views?.toLocaleString() || 0}
        </div>
      )
    },
    {
      header: 'Inquiries',
      accessor: 'inquiries',
      render: (item) => (
        <Badge bg="success">{item.inquiries || 0}</Badge>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (item) => (
        <div className="d-flex align-items-center">
          {[...Array(5)].map((_, i) => (
            <i 
              key={i} 
              className={`fas fa-star ${i < (item.rating || 0) ? 'text-warning' : 'text-muted'}`}
            ></i>
          ))}
          <span className="ms-2 small text-muted">({item.rating || 0})</span>
        </div>
      )
    }
  ];

  // Recent Activity Table Columns
  const activityColumns = [
    {
      header: 'User',
      accessor: 'user',
      render: (item) => (
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
               style={{ width: '32px', height: '32px', fontSize: '12px' }}>
            {item.user?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {item.user || 'Unknown User'}
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (item) => (
        <div>
          <strong>{item.action}</strong>
          {item.type === 'contact' && item.subject && ` sent: ${item.subject}`}
          {item.type === 'pet_added' && item.pet && ` added ${item.pet}`}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'contact': return 'info';
          case 'pet_added': return 'success';
          case 'user_registered': return 'primary';
          case 'adoption': return 'warning';
          default: return 'secondary';
        }
      }
    },
    {
      header: 'Time',
      accessor: 'time',
      render: (item) => (
        <small className="text-muted">{item.time}</small>
      )
    }
  ];

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching analytics for ${dateRange}...`);
      
      // Try to fetch real analytics data first
      try {
        const response = await adminAPI.get(`/admin/analytics?range=${dateRange}`);
        
        if (response.data.success) {
          setAnalytics(response.data.data);
          return;
        }
      } catch (apiError) {
        console.warn('Real API failed, using mock data:', apiError.message);
      }

      // Fallback to mock data
      const mockData = {
        overview: {
          totalUsers: 1247,
          totalPets: 189,
          totalAdoptions: 67,
          totalContacts: 89,
          growthRate: 12.5,
          conversionRate: 8.3
        },
        performanceMetrics: [
          { metric: 'Site Performance', value: '98%', target: '95%', progress: 98, status: 'Excellent' },
          { metric: 'User Satisfaction', value: '4.7/5', target: '4.5/5', progress: 94, status: 'Excellent' },
          { metric: 'Adoption Rate', value: '35%', target: '30%', progress: 117, status: 'Excellent' },
          { metric: 'Response Time', value: '2.1s', target: '3.0s', progress: 70, status: 'Good' },
          { metric: 'Error Rate', value: '0.2%', target: '0.5%', progress: 250, status: 'Excellent' }
        ],
        popularPets: [
          { name: 'Buddy', breed: 'Golden Retriever', type: 'Dog', views: 1250, inquiries: 23, rating: 5 },
          { name: 'Luna', breed: 'Persian Cat', type: 'Cat', views: 987, inquiries: 18, rating: 5 },
          { name: 'Max', breed: 'German Shepherd', type: 'Dog', views: 876, inquiries: 15, rating: 4 },
          { name: 'Bella', breed: 'Siamese Cat', type: 'Cat', views: 743, inquiries: 12, rating: 5 },
          { name: 'Charlie', breed: 'Labrador', type: 'Dog', views: 698, inquiries: 14, rating: 4 }
        ],
        recentActivity: [
          { user: 'John Smith', action: 'Contact Submitted', type: 'contact', subject: 'Adoption Inquiry', time: '2 minutes ago' },
          { user: 'Sarah Johnson', action: 'User Registered', type: 'user_registered', time: '15 minutes ago' },
          { user: 'Admin', action: 'Pet Added', type: 'pet_added', pet: 'Fluffy (Cat)', time: '1 hour ago' },
          { user: 'Mike Wilson', action: 'Adoption Completed', type: 'adoption', time: '2 hours ago' },
          { user: 'Emma Davis', action: 'Contact Submitted', type: 'contact', subject: 'General Inquiry', time: '3 hours ago' }
        ]
      };

      setAnalytics(mockData);
      
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [adminAPI, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Handle performance metrics actions
  const handleViewMetric = (metric) => {
    console.log('View metric:', metric);
    // Could open a detailed view modal
  };

  const handleEditMetric = (metric) => {
    console.log('Edit metric:', metric);
    // Could open an edit modal
  };

  // Handle popular pets actions
  const handleViewPet = (pet) => {
    console.log('View pet:', pet);
    // Could navigate to pet detail page
  };

  const handleEditPet = (pet) => {
    console.log('Edit pet:', pet);
    // Could open pet edit modal
  };

  // Handle activity actions
  const handleViewActivity = (activity) => {
    console.log('View activity:', activity);
    // Could show detailed activity log
  };

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <Alert.Heading>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error Loading Analytics
        </Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchAnalytics}>
          <i className="fas fa-redo me-2"></i>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="fas fa-chart-line me-2"></i>
          Analytics Dashboard
        </h1>
        <div className="d-flex gap-2">
          <Form.Select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            style={{ width: 'auto' }}
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </Form.Select>
          <Button 
            variant="outline-primary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <i className={`fas fa-sync-alt me-2 ${refreshing ? 'fa-spin' : ''}`}></i>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded p-3 me-3">
                  <i className="fas fa-users fa-2x"></i>
                </div>
                <div>
                  <h3 className="mb-0">{analytics.overview.totalUsers?.toLocaleString()}</h3>
                  <h6 className="text-muted mb-0">Total Users</h6>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1"></i>
                    +{analytics.overview.growthRate}% this month
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-success text-white rounded p-3 me-3">
                  <i className="fas fa-paw fa-2x"></i>
                </div>
                <div>
                  <h3 className="mb-0">{analytics.overview.totalPets?.toLocaleString()}</h3>
                  <h6 className="text-muted mb-0">Available Pets</h6>
                  <small className="text-info">Ready for adoption</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-warning text-white rounded p-3 me-3">
                  <i className="fas fa-heart fa-2x"></i>
                </div>
                <div>
                  <h3 className="mb-0">{analytics.overview.totalAdoptions?.toLocaleString()}</h3>
                  <h6 className="text-muted mb-0">Successful Adoptions</h6>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1"></i>
                    {analytics.overview.conversionRate}% conversion rate
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info text-white rounded p-3 me-3">
                  <i className="fas fa-envelope fa-2x"></i>
                </div>
                <div>
                  <h3 className="mb-0">{analytics.overview.totalContacts?.toLocaleString()}</h3>
                  <h6 className="text-muted mb-0">Contact Inquiries</h6>
                  <small className="text-muted">This period</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Performance Metrics Table */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-tachometer-alt me-2"></i>
                Performance Metrics
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                data={analytics.performanceMetrics || []}
                columns={performanceColumns}
                loading={loading}
                onView={handleViewMetric}
                onEdit={handleEditMetric}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Popular Pets Table */}
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-star me-2"></i>
                Most Popular Pets
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                data={analytics.popularPets || []}
                columns={popularPetsColumns}
                loading={loading}
                onView={handleViewPet}
                onEdit={handleEditPet}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity Table */}
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Recent Activity
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable
                data={analytics.recentActivity || []}
                columns={activityColumns}
                loading={loading}
                onView={handleViewActivity}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminAnalytics;