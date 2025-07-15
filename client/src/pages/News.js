// FILE 2: client/src/pages/News.js - ENHANCED VERSION
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';
import useToast from '../hooks/useToast';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { showSuccess, showError, showInfo } = useToast();

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching news categories...');
      const response = await newsAPI.getNewsCategories();
      
      if (response.data.success) {
        setCategories([
          { name: 'all', displayName: 'All Articles', count: 0 },
          ...response.data.data || []
        ]);
        console.log('✅ Categories loaded:', response.data.data.length);
      } else {
        console.warn('⚠️ Categories request unsuccessful');
        setDefaultCategories();
      }
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err);
      setDefaultCategories();
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Set default categories if API fails
  const setDefaultCategories = () => {
    setCategories([
      { name: 'all', displayName: 'All Articles', count: 0 },
      { name: 'adoption', displayName: 'Adoption', count: 0 },
      { name: 'safety', displayName: 'Pet Safety', count: 0 },
      { name: 'training', displayName: 'Training', count: 0 },
      { name: 'health', displayName: 'Health', count: 0 }
    ]);
  };

  // Fetch news
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`📰 Fetching news - Category: ${selectedCategory}, Sort: ${sortBy}, Search: ${searchTerm}`);
      
      const params = {
        limit: 20,
        sort: sortBy
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await newsAPI.getAllNews(params);
      
      if (response.data.success) {
        setArticles(response.data.data || []);
        console.log('✅ Articles loaded:', response.data.data.length);
        
        if (response.data.data.length === 0) {
          if (searchTerm) {
            showInfo(`No articles found matching "${searchTerm}"`);
          } else {
            showInfo('No articles found for this category');
          }
        }
      } else {
        setError('No articles found.');
        setArticles([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch news:', err);
      const errorMessage = 'Failed to load news articles. Please try again later.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchTerm, showError, showInfo]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch news when filters change
  useEffect(() => {
    if (!loadingCategories) {
      fetchNews();
    }
  }, [fetchNews, loadingCategories]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchTerm(''); // Clear search when changing category
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews();
  };

  // Handle like article
  const handleLikeArticle = async (articleId) => {
    try {
      const response = await newsAPI.likeArticle(articleId);
      if (response.data.success) {
        // Update the article's like count in state
        setArticles(prev => 
          prev.map(article => 
            article.id === articleId 
              ? { ...article, likes: response.data.data.likes }
              : article
          )
        );
        showSuccess('Article liked!');
      }
    } catch (err) {
      console.error('❌ Failed to like article:', err);
      showError('Failed to like article');
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      adoption: 'primary',
      safety: 'warning',
      'success-story': 'success',
      behavior: 'info',
      training: 'secondary',
      health: 'danger'
    };
    return colors[category] || 'outline-primary';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'Read more about this article...';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(cat => cat.name === selectedCategory);
    return category ? category.displayName : 'All Articles';
  };

  // Loading state
  if (loadingCategories) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <h5>Loading news...</h5>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      {/* Header */}
      <Row className="text-center mb-5">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="fas fa-newspaper me-3"></i>
            Pet News & Articles
          </h1>
          <p className="lead text-muted">
            Stay informed with the latest pet care advice, adoption stories, and expert tips
          </p>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col lg={8}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <i className="fas fa-search"></i>
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col lg={4}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="liked">Most Liked</option>
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {/* Sidebar - Categories */}
        <Col lg={3} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-folder me-2"></i>
                Categories
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      selectedCategory === category.name ? 'active' : ''
                    }`}
                    onClick={() => handleCategoryChange(category.name)}
                  >
                    <span>{category.displayName}</span>
                    <Badge bg="secondary" pill>
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* Current Category Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>
              {getSelectedCategoryName()}
              {searchTerm && (
                <small className="text-muted ms-2">
                  for "{searchTerm}"
                </small>
              )}
            </h3>
            <Button 
              variant="outline-primary" 
              onClick={fetchNews}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>No Articles Found</h5>
              <p>{error}</p>
              <Button 
                variant="primary" 
                onClick={() => handleCategoryChange('all')}
              >
                View All Articles
              </Button>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" className="mb-3" />
              <p className="text-muted">Loading articles...</p>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && !error && articles.length > 0 && (
            <Row className="g-4">
              {articles.map((article) => (
                <Col key={article.id} lg={6} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm hover-shadow">
                    {article.imageUrl && (
                      <Card.Img 
                        variant="top" 
                        src={article.imageUrl}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200/f8f9fa/6c757d?text=FurBabies+News';
                        }}
                      />
                    )}
                    
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <Badge bg={getCategoryBadgeColor(article.category)} className="me-2">
                          {article.category.replace('-', ' ')}
                        </Badge>
                        {article.featured && (
                          <Badge bg="warning" text="dark">
                            <i className="fas fa-star me-1"></i>
                            Featured
                          </Badge>
                        )}
                      </div>

                      <Card.Title className="h5">
                        <Link 
                          to={`/news/${article.id}`}
                          className="text-decoration-none text-dark hover-primary"
                        >
                          {article.title}
                        </Link>
                      </Card.Title>

                      <Card.Text className="text-muted flex-grow-1">
                        {truncateText(article.summary)}
                      </Card.Text>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
                          <span>
                            <i className="fas fa-user me-1"></i>
                            {article.author}
                          </span>
                          <span>
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(article.publishedAt)}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted small">
                            <span className="me-3">
                              <i className="fas fa-eye me-1"></i>
                              {article.views} views
                            </span>
                            <span className="me-3">
                              <i className="fas fa-clock me-1"></i>
                              {article.readTime}
                            </span>
                          </div>

                          <div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="me-2"
                              onClick={() => handleLikeArticle(article.id)}
                            >
                              <i className="fas fa-heart me-1"></i>
                              {article.likes}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              as={Link}
                              to={`/news/${article.id}`}
                            >
                              Read More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Empty State */}
          {!loading && !error && articles.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
              <h5>No Articles Available</h5>
              <p className="text-muted">
                Check back later for new content!
              </p>
              <Button 
                variant="primary" 
                onClick={() => handleCategoryChange('all')}
                className="mt-3"
              >
                View All Pet Articles
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default News;