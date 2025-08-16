// client/src/pages/News.js - UPDATED to fix all console errors
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button/Button.jsx';
import { newsAPI } from '../services/api';

const News = () => {
  const navigate = useNavigate();
  
  // State management
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Fetch categories from server with fallback
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching news categories from server...');
      const response = await newsAPI.getCategories();
      
      if (response.data?.success) {
        setCategories(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} categories`);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      
      // Fallback to default categories if API fails
      const fallbackCategories = [
        { name: 'all', displayName: 'All Categories', count: 0 },
        { name: 'general', displayName: 'General', count: 0 },
        { name: 'adoption', displayName: 'Pet Adoption', count: 0 },
        { name: 'care', displayName: 'Pet Care', count: 0 },
        { name: 'health', displayName: 'Health & Wellness', count: 0 },
        { name: 'safety', displayName: 'Pet Safety', count: 0 },
        { name: 'success-story', displayName: 'Success Stories', count: 0 },
        { name: 'company-news', displayName: 'Company News', count: 0 }
      ];
      
      setCategories(fallbackCategories);
      console.log('📂 Using fallback categories');
    }
  }, []);

  // Refresh news cache
  const refreshNews = async () => {
    try {
      setRefreshing(true);
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
        console.log('✅ News cache refreshed successfully');
      } else {
        throw new Error('Failed to refresh news');
      }
    } catch (err) {
      console.error('❌ Error refreshing news:', err);
      setError('Failed to refresh news. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  // Handle search
  const handleSearchChange = (e) => {
    handleFilterChange('search', e.target.value);
  };

  // Handle category filter
  const handleCategoryChange = (e) => {
    handleFilterChange('category', e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
  };

  // Reset filters
  const handleFilterReset = () => {
    setFilters({
      search: '',
      category: 'all',
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
  };

  // Navigate to article detail
  const handleArticleClick = (articleId) => {
    if (!articleId) {
      console.warn('⚠️ Article clicked without valid ID');
      return;
    }
    try {
      navigate(`/news/${articleId}`);
    } catch (err) {
      console.error('❌ Navigation error:', err);
      setError('Unable to navigate to article. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.displayName || categoryName;
  };

  // Get category badge variant
  const getCategoryVariant = (category) => {
    const variants = {
      'success-story': 'success',
      'company-news': 'primary',
      'care': 'info',
      'safety': 'warning',
      'adoption': 'success',
      'health': 'info',
      'general': 'secondary'
    };
    return variants[category] || 'secondary';
  };

  // Determine if article is external
  const isExternalArticle = (article) => {
    return article.type === 'external' || article.source !== 'custom';
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Main render
  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">
                <i className="fas fa-newspaper text-primary me-2"></i>
                Latest News
              </h1>
              <p className="text-muted mb-0">
                Stay updated with the latest pet care tips, adoption stories, and company news
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={refreshNews} 
              disabled={loading || refreshing}
            >
              <i className={`fas fa-sync-alt me-2 ${refreshing ? 'fa-spin' : ''}`}></i>
              {refreshing ? 'Refreshing...' : 'Refresh News'}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                {/* Search */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">
                      Search Articles
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by title or content..."
                      value={filters.search}
                      onChange={handleSearchChange}
                    />
                  </Form.Group>
                </Col>

                {/* Category Filter */}
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">
                      Category
                    </Form.Label>
                    <Form.Select
                      value={filters.category}
                      onChange={handleCategoryChange}
                    >
                      <option key="all" value="all">All Categories</option>
                      {categories.filter(cat => cat.name !== 'all').map((category, index) => (
                        <option key={`${category.name}-${index}`} value={category.name}>
                          {category.displayName} {category.count > 0 && `(${category.count})`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Sort */}
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">
                      Sort By
                    </Form.Label>
                    <Form.Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={handleSortChange}
                    >
                      <option value="publishedAt-desc">Newest First</option>
                      <option value="publishedAt-asc">Oldest First</option>
                      <option value="title-asc">Title A-Z</option>
                      <option value="title-desc">Title Z-A</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Filter Actions */}
                <Col md={2}>
                  <Form.Label className="small fw-semibold text-muted d-block">
                    Actions
                  </Form.Label>
                  <Button 
                    variant="secondary" 
                    size="small" 
                    onClick={handleFilterReset}
                    className="w-100"
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="mb-0">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <Button 
                variant="danger" 
                size="small" 
                className="ms-3"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {loading && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <h5 className="mt-3">Loading articles...</h5>
            </div>
          </Col>
        </Row>
      )}

      {/* Articles Grid */}
      {!loading && (
        <Row>
          {articles.length === 0 ? (
            <Col>
              <div className="text-center py-5">
                <i className="fas fa-newspaper text-muted fa-3x mb-3"></i>
                <h4 className="text-muted">No articles found</h4>
                <p className="text-muted">
                  {filters.search || filters.category !== 'all' 
                    ? 'Try adjusting your filters to see more results.'
                    : 'Check back later for new articles.'}
                </p>
                {(filters.search || filters.category !== 'all') && (
                  <Button variant="primary" onClick={handleFilterReset}>
                    <i className="fas fa-times me-2"></i>
                    Clear Filters
                  </Button>
                )}
              </div>
            </Col>
          ) : (
            articles.map((article) => {
              const articleId = article._id || article.id;
              if (!articleId) {
                console.warn('⚠️ Article found without valid ID:', article);
                return null;
              }
              
              return (
                <Col key={articleId} md={6} lg={4} className="mb-4">
                  <Card 
                    className="h-100 shadow-sm border-0 hover-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleArticleClick(articleId)}
                  >
                    {/* Article Image */}
                    {article.imageUrl && (
                      <Card.Img
                        variant="top"
                        src={article.imageUrl}
                        alt={article.title || 'Article image'}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          console.log('🖼️ Image failed to load:', article.imageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    
                    <Card.Body className="d-flex flex-column">
                      {/* Category Badge */}
                      <div className="mb-2">
                        <Badge bg={getCategoryVariant(article.category)} className="me-2">
                          {getCategoryDisplayName(article.category)}
                        </Badge>
                        {article.featured && (
                          <Badge bg="warning" text="dark">
                            <i className="fas fa-star me-1"></i>
                            Featured
                          </Badge>
                        )}
                        {isExternalArticle(article) && (
                          <Badge bg="info" className="ms-1">
                            <i className="fas fa-external-link-alt me-1"></i>
                            External
                          </Badge>
                        )}
                      </div>

                      {/* Article Title */}
                      <Card.Title className="h5 mb-2">
                        {article.title || 'Untitled Article'}
                      </Card.Title>

                      {/* Article Summary/Description */}
                      <Card.Text className="text-muted flex-grow-1">
                        {article.summary || article.description || 'No summary available.'}
                      </Card.Text>

                      {/* Article Meta */}
                      <div className="mt-auto">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                          {article.author && (
                            <>
                              <span className="mx-2">•</span>
                              <i className="fas fa-user me-1"></i>
                              {article.author}
                            </>
                          )}
                          {article.source && (
                            <>
                              <span className="mx-2">•</span>
                              <i className="fas fa-building me-1"></i>
                              {article.source}
                            </>
                          )}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            }).filter(Boolean)
          )}
        </Row>
      )}

      {/* Results Summary */}
      {!loading && articles.length > 0 && (
        <Row className="mt-4">
          <Col>
            <div className="text-center text-muted">
              <small>
                Showing {articles.length} article{articles.length !== 1 ? 's' : ''}
                {filters.category !== 'all' && ` in ${getCategoryDisplayName(filters.category)}`}
                {filters.search && ` matching "${filters.search}"`}
              </small>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default News;