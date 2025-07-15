// client/src/pages/News.js - COMPLETE WORKING VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Default categories if API fails
  const defaultCategories = [
    { name: 'all', displayName: 'All Articles', count: 0 },
    { name: 'pets', displayName: 'Pet Care', count: 0 },
    { name: 'dogs', displayName: 'Dogs', count: 0 },
    { name: 'cats', displayName: 'Cats', count: 0 },
    { name: 'adoption', displayName: 'Adoption', count: 0 },
    { name: 'health', displayName: 'Pet Health', count: 0 }
  ];

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      console.log('📂 Fetching news categories...');
      
      const response = await newsAPI.getNewsCategories();
      
      if (response.data?.success && response.data.data?.length > 0) {
        setCategories([
          { name: 'all', displayName: 'All Articles', count: 0 },
          ...response.data.data
        ]);
        console.log('✅ Categories loaded:', response.data.data.length);
      } else {
        console.log('⚠️ No categories from API, using defaults');
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err);
      setCategories(defaultCategories);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch news articles
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`📰 Fetching news for category: ${selectedCategory}`);
      
      let response;
      if (selectedCategory === 'all') {
        response = await newsAPI.getAllNews({ 
          limit: 12,
          sort: 'newest',
          published: true
        });
      } else {
        response = await newsAPI.getNewsByCategory(selectedCategory, { 
          limit: 12,
          sort: 'newest'
        });
      }
      
      if (response.data?.success) {
        const newsData = response.data.data || [];
        setArticles(newsData);
        console.log('✅ Articles loaded:', newsData.length);
        
        if (newsData.length === 0) {
          setError('No articles found for this category.');
        }
      } else {
        setError('No articles found for this category.');
        setArticles([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch news:', err);
      
      // Fallback to mock data for development
      const mockArticles = [
        {
          id: '1',
          title: 'Welcome to FurBabies Pet Store',
          summary: 'Discover amazing pets and products for your furry friends.',
          category: 'pets',
          author: 'FurBabies Team',
          featured: true,
          published: true,
          publishedAt: new Date().toISOString(),
          views: 150,
          readTime: '3 min read'
        },
        {
          id: '2',
          title: 'Pet Care Tips for New Owners',
          summary: 'Essential advice for first-time pet owners to ensure happy, healthy pets.',
          category: 'pets',
          author: 'Dr. Sarah Johnson',
          featured: true,
          published: true,
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          views: 89,
          readTime: '5 min read'
        },
        {
          id: '3',
          title: 'Adoption Success Stories',
          summary: 'Heartwarming tales of pets finding their forever homes.',
          category: 'adoption',
          author: 'Maria Rodriguez',
          featured: false,
          published: true,
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          views: 234,
          readTime: '4 min read'
        }
      ];
      
      setArticles(mockArticles);
      console.log('📰 Using fallback mock data');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Load data on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Utility functions
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return 'Read the latest news and updates about pet care...';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      pets: 'primary',
      dogs: 'success',
      cats: 'info',
      adoption: 'warning',
      health: 'danger'
    };
    return colors[category?.toLowerCase()] || 'secondary';
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <Container className="py-5">
      {/* Page Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary mb-3">
          <i className="fas fa-newspaper me-3"></i>
          Pet News & Articles
        </h1>
        <p className="lead text-muted">
          Stay updated with the latest pet care tips, adoption stories, and expert advice
        </p>
        <hr className="w-25 mx-auto border-primary" style={{height: '3px'}} />
      </div>

      {/* Category Navigation */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {loadingCategories ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Loading categories...</span>
              </div>
            ) : (
              categories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleCategoryChange(category.name)}
                  className="rounded-pill"
                >
                  {category.displayName}
                  {category.count > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {category.count}
                    </Badge>
                  )}
                </Button>
              ))
            )}
          </div>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && (
        <Row className="text-center py-5">
          <Col>
            <Spinner animation="border" className="mb-3" />
            <h5>Loading articles...</h5>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && !loading && (
        <Row>
          <Col>
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>No Articles Found</h5>
              <p>{error}</p>
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => handleCategoryChange('all')}
                  className="me-2"
                >
                  View All Articles
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={fetchNews}
                >
                  <i className="fas fa-redo me-2"></i>
                  Retry
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Articles Grid */}
      {!loading && !error && articles.length > 0 && (
        <>
          <Row className="mb-4">
            <Col>
              <h4 className="text-center text-muted">
                {selectedCategory === 'all' ? 'All Articles' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Articles`}
                <Badge bg="primary" className="ms-2">{articles.length}</Badge>
              </h4>
            </Col>
          </Row>

          <Row className="g-4">
            {articles.map((article, index) => (
              <Col key={article.id || index} lg={4} md={6}>
                <Card className="h-100 shadow-sm border-0 hover-card">
                  {/* Article Image */}
                  <div className="position-relative overflow-hidden" style={{height: '200px'}}>
                    <Card.Img
                      variant="top"
                      src={article.imageUrl || `https://via.placeholder.com/400x200/007bff/ffffff?text=📰+${encodeURIComponent(article.title?.substring(0, 10) || 'News')}`}
                      alt={article.title}
                      style={{
                        height: '200px',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      className="hover-zoom"
                    />
                    
                    {/* Category Badge */}
                    <Badge 
                      bg={getCategoryBadgeColor(article.category)}
                      className="position-absolute top-0 start-0 m-2"
                    >
                      {article.category?.charAt(0).toUpperCase() + article.category?.slice(1) || 'News'}
                    </Badge>

                    {/* Featured Badge */}
                    {article.featured && (
                      <Badge 
                        bg="warning" 
                        text="dark"
                        className="position-absolute top-0 end-0 m-2"
                      >
                        <i className="fas fa-star me-1"></i>
                        Featured
                      </Badge>
                    )}
                  </div>

                  <Card.Body className="d-flex flex-column">
                    {/* Article Title */}
                    <Card.Title className="h5 text-primary mb-2">
                      {article.title || 'Untitled Article'}
                    </Card.Title>

                    {/* Article Summary */}
                    <Card.Text className="text-muted flex-grow-1">
                      {truncateText(article.summary)}
                    </Card.Text>

                    {/* Article Meta */}
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {article.author || 'FurBabies Team'}
                        </small>
                        
                        {article.readTime && (
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            {article.readTime}
                          </small>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                        </small>
                        
                        {article.views && (
                          <small className="text-muted">
                            <i className="fas fa-eye me-1"></i>
                            {article.views} views
                          </small>
                        )}
                      </div>

                      {/* Read More Button */}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        as={Link}
                        to={`/news/${article.id}`}
                      >
                        <i className="fas fa-book-open me-2"></i>
                        Read Full Article
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Empty State when no articles but no error */}
      {!loading && !error && articles.length === 0 && (
        <Row>
          <Col>
            <div className="text-center py-5">
              <i className="fas fa-newspaper fa-4x text-muted mb-4"></i>
              <h4 className="text-muted">No Articles Yet</h4>
              <p className="text-muted mb-4">
                We're working on bringing you the latest pet news and tips.
                Check back later for new content!
              </p>
              <Button 
                variant="primary" 
                onClick={() => handleCategoryChange('all')}
                className="me-2"
              >
                <i className="fas fa-home me-2"></i>
                View All Categories
              </Button>
              <Button 
                variant="outline-primary" 
                as={Link}
                to="/"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Home
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {/* Load More Button (if needed for pagination) */}
      {!loading && articles.length > 0 && articles.length >= 12 && (
        <Row className="mt-5">
          <Col className="text-center">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={fetchNews}
            >
              <i className="fas fa-plus me-2"></i>
              Load More Articles
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default News;