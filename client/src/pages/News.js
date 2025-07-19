// client/src/pages/News.js - News listing page
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📰 News: Fetching articles...', { filters });
      
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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching news categories...');
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

  // Get article image
  const getArticleImage = (article) => {
    return article.imageUrl || 
           article.image || 
           'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&q=80';
  };

  // Get article link
  const getArticleLink = (article) => {
    if (article.originalUrl || article.url) {
      return article.originalUrl || article.url;
    }
    return `/news/${article._id || article.id}`;
  };

  // Check if article is external
  const isExternalArticle = (article) => {
    return article.type === 'external' || 
           article.source === 'external' || 
           !!(article.originalUrl || article.url);
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-4 mb-3">
          <i className="fas fa-newspaper text-primary me-3"></i>
          Pet News & Updates
        </h1>
        <p className="lead text-muted">
          Stay informed with the latest pet care tips, adoption stories, and industry news
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            {/* Search */}
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Search Articles</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search news..."
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
                  <option value="views">Views</option>
                  <option value="likes">Popularity</option>
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
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
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
          <p className="text-muted">Loading news articles...</p>
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && (
        <>
          {articles.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No articles found</h4>
              <p className="text-muted">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <Row>
              {articles.map((article, index) => {
                const isExternal = isExternalArticle(article);
                const articleLink = getArticleLink(article);
                
                return (
                  <Col key={article._id || article.id || index} lg={4} md={6} className="mb-4">
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
                            {formatDate(article.publishedAt || article.createdAt)}
                          </small>
                          {article.author && (
                            <small className="text-muted ms-3">
                              <i className="fas fa-user me-1"></i>
                              {article.author}
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
                          {isExternal && (
                            <Badge bg="info">
                              <i className="fas fa-external-link-alt me-1"></i>
                              External
                            </Badge>
                          )}
                          {article.featured && (
                            <Badge bg="warning">
                              <i className="fas fa-star me-1"></i>
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-auto">
                          {isExternal ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              href={articleLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-100"
                            >
                              <i className="fas fa-external-link-alt me-2"></i>
                              Read Full Article
                            </Button>
                          ) : (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              as={Link}
                              to={articleLink}
                              className="w-100"
                            >
                              <i className="fas fa-arrow-right me-2"></i>
                              Read More
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
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