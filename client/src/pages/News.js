// client/src/pages/News.js - UPDATED to use server-side news API
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import Button from '../components/button/Button.jsx';
import { newsAPI } from '../services/api';

const News = () => {
  // State management
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sortBy: 'publishedAt',
    sortOrder: 'desc'
  });

  // Fetch articles from server
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📰 News: Fetching articles from server...', { filters });
      
      // Build query parameters
      const queryParams = { ...filters };
      
      // Remove 'all' values and empty strings
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      const response = await newsAPI.getAllNews(queryParams);
      
      if (response.data?.success) {
        setArticles(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} articles`);
        
        // Show cache status if available
        if (response.data.cached) {
          console.log('📰 Using cached articles');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch articles');
      }
      
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError('Unable to load news articles. Please try again.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch categories from server
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching news categories from server...');
      const response = await newsAPI.getCategories();
      
      if (response.data?.success) {
        setCategories(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} categories`);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      // Don't show error to user for categories, just log it
    }
  }, []);

  // Refresh news cache
  const refreshNews = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing news cache...');
      
      const response = await fetch('/api/news/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Refetch articles after refresh
        await fetchArticles();
      } else {
        throw new Error('Failed to refresh news');
      }
    } catch (err) {
      console.error('❌ Error refreshing news:', err);
      setError('Failed to refresh news. Please try again.');
    }
  };

  // Load initial data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch articles when filters change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  // Get article image with pet-themed fallback
  const getArticleImage = (article) => {
    return article.imageUrl || 
           article.image || 
           'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&q=80';
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-4 mb-3">
          <i className="fas fa-newspaper text-primary me-3"></i>
          Pet & Veterinary News
        </h1>
        <p className="lead text-muted">
          Stay informed with the latest pet care tips, veterinary insights, and adoption stories
        </p>
        
        {/* Refresh Button */}
        <Button 
          variant="outline-primary" 
          onClick={refreshNews}
          disabled={loading}
          className="mt-2"
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh News
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            {/* Search */}
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Search Pet News</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search pet news..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Category */}
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Sort By */}
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="publishedAt">Date</option>
                  <option value="title">Title</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Sort Order */}
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Order</Form.Label>
                <Form.Select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Clear Filters */}
            <Col md={1} className="mb-3 d-flex align-items-end">
              <Button variant="secondary" onClick={clearFilters} className="w-100">
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading pet news articles...</p>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && (
        <>
          {articles.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No pet news found</h4>
              <p className="text-muted">Try adjusting your search criteria or refresh to get latest articles.</p>
              <Button variant="primary" onClick={refreshNews}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh News
              </Button>
            </div>
          ) : (
            <>
              {/* Articles count */}
              <div className="mb-3">
                <small className="text-muted">
                  Showing {articles.length} pet news article{articles.length !== 1 ? 's' : ''}
                </small>
              </div>
              
              <Row>
                {articles.map((article, index) => (
                  <Col key={article._id || index} lg={4} md={6} className="mb-4">
                    <Card className="h-100 shadow-sm news-card">
                      {/* Article Image */}
                      <Card.Img
                        variant="top"
                        src={getArticleImage(article)}
                        alt={article.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&q=80';
                        }}
                      />
                      
                      <Card.Body className="d-flex flex-column">
                        {/* Article Title */}
                        <Card.Title className="h6 mb-2">
                          {article.title}
                        </Card.Title>
                        
                        {/* Article Summary */}
                        <Card.Text className="text-muted small flex-grow-1">
                          {article.summary || article.description || 'No description available'}
                        </Card.Text>
                        
                        {/* Article Meta */}
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(article.publishedAt)}
                          </small>
                          {article.source && (
                            <small className="text-muted ms-3">
                              <i className="fas fa-globe me-1"></i>
                              {article.source}
                            </small>
                          )}
                        </div>

                        {/* Tags and Badges */}
                        <div className="mb-3">
                          {article.category && (
                            <Badge bg="primary" className="me-2">
                              {article.category}
                            </Badge>
                          )}
                          <Badge bg="info">
                            <i className="fas fa-external-link-alt me-1"></i>
                            External
                          </Badge>
                          {article.featured && (
                            <Badge bg="warning" className="ms-1">
                              <i className="fas fa-star me-1"></i>
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-auto">
                          <a
                            href={article.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none d-block"
                          >
                            <Button
                              variant="secondary"
                              size="small"
                              className="w-100"
                            >
                              <i className="fas fa-external-link-alt me-2"></i>
                              Read Full Article
                            </Button>
                          </a>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}

      {/* Custom CSS for better visual appeal */}
      <style jsx>{`
        .news-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
        }
        
        .news-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </Container>
  );
};

export default News;