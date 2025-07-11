// client/src/pages/News.js - Fixed useCallback Dependencies
import React, { useState, useEffect, useCallback } from 'react'; // ✅ Added useCallback
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('pets');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ✅ Wrap fetchCategories in useCallback
  const fetchCategories = useCallback(async () => {
    try {
      console.log('📂 Fetching news categories...');
      const response = await api.get('/news/categories');
      
      if (response.data.success) {
        setCategories(response.data.data || []);
        console.log('✅ Categories loaded:', response.data.data.length);
      } else {
        console.warn('⚠️ Categories request unsuccessful');
        setCategories([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err);
      // Set default categories if API fails
      setCategories([
        { id: 'pets', name: 'General Pet News', icon: '🐾' },
        { id: 'dogs', name: 'Dog News', icon: '🐕' },
        { id: 'cats', name: 'Cat News', icon: '🐱' },
        { id: 'veterinary', name: 'Veterinary News', icon: '🏥' }
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []); // No dependencies needed for this function

  // ✅ Wrap fetchNews in useCallback with proper dependencies
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`📰 Fetching news for category: ${selectedCategory}`);
      const response = await api.get(`/news?category=${selectedCategory}&limit=12`);
      
      if (response.data.success) {
        setArticles(response.data.data || []);
        console.log('✅ Articles loaded:', response.data.data.length);
      } else {
        setError('No articles found for this category.');
        setArticles([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch news:', err);
      setError('Failed to load news articles. Please try again later.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]); // ✅ Include selectedCategory as dependency

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]); // ✅ Now includes fetchNews as dependency

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date unavailable';
    }
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Container className="py-5">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h1 className="display-4 mb-3">
              <i className="fas fa-newspaper text-primary me-3"></i>
              Pet News & Articles
            </h1>
            <p className="lead text-muted">
              Stay updated with the latest pet care tips, health news, and heartwarming stories
            </p>
          </div>
        </Col>
      </Row>

      {/* Breadcrumb */}
      <Row className="mb-4">
        <Col>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">News</li>
            </ol>
          </nav>
        </Col>
      </Row>

      {/* Category Filter */}
      <Row className="mb-4">
        <Col>
          <div className="bg-light p-3 rounded">
            <h5 className="mb-3">
              <i className="fas fa-filter me-2"></i>
              Filter by Category
            </h5>
            
            {loadingCategories ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Loading categories...</span>
              </div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="d-flex align-items-center"
                  >
                    <span className="me-1">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Loading State */}
      {loading && (
        <Row className="justify-content-center py-5">
          <Col xs="auto" className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading latest pet news...</p>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && !loading && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="ms-auto"
                onClick={fetchNews}
              >
                Try Again
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {/* News Articles */}
      {!loading && !error && (
        <>
          {/* Results Info */}
          <Row className="mb-3">
            <Col>
              <p className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Found {articles.length} articles in 
                <Badge bg="primary" className="ms-1">
                  {categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}
                </Badge>
              </p>
            </Col>
          </Row>

          {/* Articles Grid */}
          <Row>
            {articles.length > 0 ? (
              articles.map((article, index) => (
                <Col lg={4} md={6} key={article.id || index} className="mb-4">
                  <Card className="h-100 shadow-sm border-0 news-card">
                    {/* Article Image */}
                    {article.imageUrl && (
                      <div className="position-relative overflow-hidden">
                        <Card.Img
                          variant="top"
                          src={article.imageUrl}
                          alt={article.title}
                          style={{ 
                            height: '200px', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          className="news-card-img"
                          onError={(e) => {
                            e.target.src = '/images/news-placeholder.jpg';
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                          <Badge bg="dark" className="px-2 py-1">
                            {categories.find(cat => cat.id === selectedCategory)?.icon || '📰'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <Card.Body className="d-flex flex-column">
                      {/* Article Title */}
                      <Card.Title className="h6 fw-bold mb-2 text-dark">
                        {article.title}
                      </Card.Title>

                      {/* Article Description */}
                      <Card.Text className="text-muted small flex-grow-1 mb-3">
                        {truncateText(article.description, 120)}
                      </Card.Text>

                      {/* Article Meta */}
                      <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-building me-1"></i>
                            {article.source}
                          </small>
                          {article.author && (
                            <small className="text-muted d-flex align-items-center">
                              <i className="fas fa-user me-1"></i>
                              {article.author}
                            </small>
                          )}
                        </div>
                        
                        <small className="text-muted d-block mb-3">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                        </small>

                        {/* Read More Button */}
                        <Button
                          variant="primary"
                          size="sm"
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-100"
                        >
                          <i className="fas fa-external-link-alt me-2"></i>
                          Read Full Article
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <div className="text-center py-5">
                  <i className="fas fa-newspaper fa-3x text-muted mb-3"></i>
                  <h4 className="text-muted">No Articles Found</h4>
                  <p className="text-muted">
                    We couldn't find any articles for this category at the moment.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => setSelectedCategory('pets')}
                  >
                    <i className="fas fa-home me-2"></i>
                    View General Pet News
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Back to Top */}
      {articles.length > 6 && (
        <Row className="mt-5">
          <Col className="text-center">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <i className="fas fa-arrow-up me-2"></i>
              Back to Top
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default News;