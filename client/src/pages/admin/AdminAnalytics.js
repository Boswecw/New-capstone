// client/src/pages/admin/AdminAnalytics.js - Enhanced with Table implementation
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner, 
  Badge, 
  Table,
  ProgressBar 
} from 'react-bootstrap';
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
      console.log(`📡 Admin Analytics Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response logging
    api.interceptors.response.use(
      (response) => {
        console.log(`✅ Admin Analytics Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Admin Analytics Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  const dateRanges = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 3 months' },
    { value: '1year', label: 'Last year' }
  ];

  // Wrap fetchAnalytics in useCallback to fix dependency issue
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching analytics for ${dateRange}...`);
      
      // Try to fetch real analytics data
      const response = await adminAPI.get(`/admin/analytics?range=${dateRange}`);
      
      if (response.data.success) {
        setAnalytics(response.data.data);
        console.log('✅ Analytics loaded from backend');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      
      // Fallback to mock data for demo purposes
      const mockAnalytics = {
        overview: {
          totalUsers: 1247,
          totalPets: 89,
          totalAdoptions: 34,
          totalContacts: 156,
          growthRate: 15.3,
          conversionRate: 8.7
        },
        chartData: {
          userRegistrations: [12, 19, 23, 17, 31, 28, 25],
          petAdoptions: [2, 5, 3, 8, 4, 6, 7],
          pageViews: [245, 312, 289, 378, 456, 389, 423],
          topPages: [
            { page: '/pets', views: 1234, percentage: 35 },
            { page: '/browse', views: 987, percentage: 28 },
            { page: '/products', views: 654, percentage: 18 },
            { page: '/about', views: 432, percentage: 12 },
            { page: '/contact', views: 234, percentage: 7 }
          ]
        },
        topPages: [
          { path: '/pets', views: 1234, bounceRate: 23.5, avgTime: '2:45' },
          { path: '/browse', views: 987, bounceRate: 18.2, avgTime: '3:12' },
          { path: '/products', views: 654, bounceRate: 31.8, avgTime: '1:58' },
          { path: '/about', views: 432, bounceRate: 15.6, avgTime: '4:23' },
          { path: '/contact', views: 234, bounceRate: 45.2, avgTime: '1:34' }
        ],
        performanceMetrics: [
          { metric: 'Page Load Speed', value: '1.2s', status: 'good', target: '< 2s' },
          { metric: 'Mobile Performance', value: '87/100', status: 'good', target: '> 80' },
          { metric: 'SEO Score', value: '92/100', status: 'excellent', target: '> 85' },
          { metric: 'Accessibility', value: '94/100', status: 'excellent', target: '> 90' },
          { metric: 'Server Response', value: '245ms', status: 'good', target: '< 500ms' }
        ],
        popularPets: [
          { name: 'Buddy', type: 'Dog', views: 89, inquiries: 12, breed: 'Golden Retriever' },
          { name: 'Whiskers', type: 'Cat', views: 76, inquiries: 8, breed: 'Maine Coon' },
          { name: 'Luna', type: 'Dog', views: 65, inquiries: 15, breed: 'Husky' },
          { name: 'Mittens', type: 'Cat', views: 54, inquiries: 6, breed: 'Persian' },
          { name: 'Rocky', type: 'Dog', views: 48, inquiries: 9, breed: 'German Shepherd' }
        ],
        recentActivity: [
          { type: 'adoption', user: 'John Smith', pet: 'Buddy', time: '2 hours ago' },
          { type: 'registration', user: 'Sarah Johnson', time: '4 hours ago' },
          { type: 'contact', user: 'Mike Wilson', subject: 'Pet Inquiry', time: '6 hours ago' },
          { type: 'pet_added', pet: 'Charlie', time: '1 day ago' },
          { type: 'adoption', user: 'Emma Davis', pet: 'Luna', time: '2 days ago' }
        ]
      };
      
      setAnalytics(mockAnalytics);
      setError('Using demo data (backend not available)');
      console.log('✅ Analytics loaded from mock data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminAPI, dateRange]); // Fixed dependencies

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'warning': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'adoption': return 'fa-heart';
      case 'registration': return 'fa-user-plus';
      case 'contact': return 'fa-envelope';
      case 'pet_added': return 'fa-paw';
      default: return 'fa-circle';
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]); // Fixed dependency

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </Spinner>
        <p className="mt-2">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="fas fa-chart-line me-2"></i>Analytics Dashboard
        </h1>
        <div className="d-flex gap-2">
          <Form.Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '200px' }}
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
            {refreshing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Refreshing...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <i className="fas fa-users fa-lg text-primary"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Total Users</h6>
                  <h3 className="mb-0">{analytics.overview.totalUsers.toLocaleString()}</h3>
                  <small className="text-success">
                    <i className="fas fa-arrow-up me-1"></i>
                    +{analytics.overview.growthRate}%
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <i className="fas fa-paw fa-lg text-info"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Available Pets</h6>
                  <h3 className="mb-0">{analytics.overview.totalPets}</h3>
                  <small className="text-info">Active listings</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <i className="fas fa-heart fa-lg text-success"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Adoptions</h6>
                  <h3 className="mb-0">{analytics.overview.totalAdoptions}</h3>
                  <small className="text-success">
                    {analytics.overview.conversionRate}% conversion
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 p-3 rounded">
                    <i className="fas fa-envelope fa-lg text-warning"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Contacts</h6>
                  <h3 className="mb-0">{analytics.overview.totalContacts}</h3>
                  <small className="text-muted">This period</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Top Pages Table */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>Top Performing Pages
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Views</th>
                    <th>Bounce Rate</th>
                    <th>Avg. Time</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPages.map((page, index) => (
                    <tr key={index}>
                      <td>
                        <code className="text-primary">{page.path}</code>
                      </td>
                      <td>
                        <strong>{page.views.toLocaleString()}</strong>
                      </td>
                      <td>
                        <Badge bg={page.bounceRate < 25 ? 'success' : page.bounceRate < 40 ? 'warning' : 'danger'}>
                          {page.bounceRate}%
                        </Badge>
                      </td>
                      <td>{page.avgTime}</td>
                      <td>
                        <ProgressBar 
                          now={100 - page.bounceRate} 
                          variant={page.bounceRate < 25 ? 'success' : page.bounceRate < 40 ? 'warning' : 'danger'}
                          style={{ height: '8px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>Recent Activity
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="activity-timeline">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="d-flex mb-3">
                    <div className="flex-shrink-0">
                      <div className="bg-light p-2 rounded-circle">
                        <i className={`fas ${getActivityIcon(activity.type)} text-muted`}></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <div className="small">
                        <strong>{activity.user}</strong>
                        {activity.type === 'adoption' && ` adopted ${activity.pet}`}
                        {activity.type === 'registration' && ' registered'}
                        {activity.type === 'contact' && ` sent: ${activity.subject}`}
                        {activity.type === 'pet_added' && ` added ${activity.pet}`}
                      </div>
                      <div className="text-muted small">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Performance Metrics Table */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-tachometer-alt me-2"></i>Performance Metrics
              </h5>
            </Card.Header>
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.performanceMetrics.map((metric, index) => (
                    <tr key={index}>
                      <td>{metric.metric}</td>
                      <td><strong>{metric.value}</strong></td>
                      <td className="text-muted">{metric.target}</td>
                      <td>
                        <Badge bg={getStatusVariant(metric.status)}>
                          {metric.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Popular Pets Table */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">
                <i className="fas fa-star me-2"></i>Most Popular Pets
              </h5>
            </Card.Header>
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Views</th>
                    <th>Inquiries</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.popularPets.map((pet, index) => (
                    <tr key={index}>
                      <td>
                        <div>
                          <strong>{pet.name}</strong>
                          <div className="small text-muted">{pet.breed}</div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={pet.type === 'Dog' ? 'primary' : 'info'}>
                          {pet.type}
                        </Badge>
                      </td>
                      <td>{pet.views}</td>
                      <td>
                        <Badge bg="success">{pet.inquiries}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AdminAnalytics;