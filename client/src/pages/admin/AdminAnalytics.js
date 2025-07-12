// client/src/pages/admin/AdminAnalytics.js - UPDATED WITH LIVE DATA
import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Alert, Button, Badge } from "react-bootstrap";
import { adminAPI } from "../../services/api";

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30days");

  // Fetch analytics data from API - memoized to fix useEffect dependency
  const fetchAnalytics = useCallback(async (range = timeRange) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Fetching analytics for range: ${range}`);
      
      const response = await adminAPI.getAnalytics({ range });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
        console.log('✅ Analytics data loaded:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load analytics');
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]); // Include timeRange in dependency array

  // Load analytics on component mount and when fetchAnalytics changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]); // Now includes fetchAnalytics in dependency array

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading analytics data...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Error loading analytics:</strong> {error}
          </div>
          <Button variant="outline-danger" size="sm" onClick={() => fetchAnalytics()}>
            <i className="fas fa-refresh me-1"></i>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  // No data state
  if (!analytics) {
    return (
      <Container fluid className="py-4">
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          No analytics data available.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Analytics Dashboard
          </h1>
          <p className="text-muted mb-0">
            Real-time insights and performance metrics
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="d-flex gap-2">
          {[
            { key: "7days", label: "7 Days" },
            { key: "30days", label: "30 Days" },
            { key: "90days", label: "90 Days" },
            { key: "1year", label: "1 Year" }
          ].map((range) => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => handleTimeRangeChange(range.key)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-muted mb-2">Total Pets</h6>
                  <h3 className="mb-1">{formatNumber(analytics.totalPets)}</h3>
                  <small className="text-success">
                    <i className="fas fa-paw me-1"></i>
                    {analytics.availablePets} available
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-paw text-primary fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-muted mb-2">Total Users</h6>
                  <h3 className="mb-1">{formatNumber(analytics.totalUsers)}</h3>
                  <small className="text-info">
                    <i className="fas fa-user-plus me-1"></i>
                    +{analytics.newUsersInPeriod} new
                  </small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-info fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-muted mb-2">Adoption Inquiries</h6>
                  <h3 className="mb-1">{formatNumber(analytics.adoptionInquiries)}</h3>
                  <small className="text-warning">
                    <i className="fas fa-envelope me-1"></i>
                    Contact forms
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-envelope text-warning fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-muted mb-2">Successful Adoptions</h6>
                  <h3 className="mb-1">{formatNumber(analytics.successfulAdoptions)}</h3>
                  <small className="text-success">
                    <i className="fas fa-heart me-1"></i>
                    {analytics.adoptionSuccessRate}% success rate
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-heart text-success fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts and Analytics Section */}
      <Row className="g-4">
        {/* Popular Pages */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2 text-primary"></i>
                Popular Pages
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {analytics.topPages && analytics.topPages.slice(0, 5).map((page, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <Badge bg="primary" className="me-2">{index + 1}</Badge>
                      <span className="fw-medium">{page.page}</span>
                    </div>
                    <span className="fw-bold text-primary">
                      {formatNumber(page.visits)} views
                    </span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Pet Categories */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="fas fa-layer-group me-2 text-success"></i>
                Pet Categories
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {analytics.categoryBreakdown && analytics.categoryBreakdown.map((category, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-2">
                    <div className="d-flex align-items-center">
                      <i className={`fas fa-${getCategoryIcon(category.category)} me-2 text-muted`}></i>
                      <span className="fw-medium text-capitalize">{category.category}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="progress me-3" style={{ width: '100px', height: '8px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ 
                            width: `${Math.min((category.count / analytics.totalPets) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="fw-bold text-dark">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Adoptions */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="fas fa-heart me-2 text-danger"></i>
                Recent Adoptions
              </h5>
            </Card.Header>
            <Card.Body>
              {analytics.recentAdoptions && analytics.recentAdoptions.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentAdoptions.slice(0, 5).map((adoption) => (
                    <div key={adoption.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-medium">{adoption.name}</div>
                        <small className="text-muted text-capitalize">
                          {adoption.type} • {adoption.adoptedBy}
                        </small>
                      </div>
                      <small className="text-muted">
                        {new Date(adoption.adoptedAt).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-heart fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No recent adoptions in this period</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Contact Status */}
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="fas fa-envelope me-2 text-info"></i>
                Contact Status
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col>
                  <div className="border-end">
                    <h4 className="text-warning mb-0">
                      {analytics.contactsByStatus?.new || 0}
                    </h4>
                    <small className="text-muted">New</small>
                  </div>
                </Col>
                <Col>
                  <div className="border-end">
                    <h4 className="text-info mb-0">
                      {analytics.contactsByStatus?.read || 0}
                    </h4>
                    <small className="text-muted">Read</small>
                  </div>
                </Col>
                <Col>
                  <div>
                    <h4 className="text-success mb-0">
                      {analytics.contactsByStatus?.responded || 0}
                    </h4>
                    <small className="text-muted">Responded</small>
                  </div>
                </Col>
              </Row>
              
              {analytics.recentContacts && analytics.recentContacts.length > 0 && (
                <div className="mt-4">
                  <h6 className="text-muted mb-3">Recent Inquiries</h6>
                  {analytics.recentContacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="d-flex justify-content-between align-items-center py-1">
                      <div>
                        <div className="fw-medium">{contact.name}</div>
                        <small className="text-muted">{contact.subject}</small>
                      </div>
                      <Badge bg={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Summary Footer */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body>
              <div className="row text-center">
                <div className="col-md-3">
                  <h6 className="text-muted">Success Rate</h6>
                  <h4 className="text-success">{analytics.adoptionSuccessRate}%</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">User Growth</h6>
                  <h4 className="text-info">+{analytics.userGrowthPercentage}%</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Total Views</h6>
                  <h4 className="text-primary">{formatNumber(analytics.totalVisits)}</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-muted">Pending Pets</h6>
                  <h4 className="text-warning">{analytics.pendingPets}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Helper function to get category icons
const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'dog': return 'dog';
    case 'cat': return 'cat';
    case 'aquatic': return 'fish';
    case 'other': return 'paw';
    default: return 'paw';
  }
};

// Helper function to get status colors
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'new': return 'warning';
    case 'read': return 'info';
    case 'responded': return 'success';
    case 'closed': return 'secondary';
    default: return 'secondary';
  }
};

export default AdminAnalytics;