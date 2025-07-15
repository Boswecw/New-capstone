// client/src/components/NewsSection.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const NewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch featured news articles
  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('📰 Fetching featured news for homepage...');
        setLoading(true);
        setError('');

        const response = await newsAPI.getFeaturedNews(3);
        
        if (response.data.success && response.data.data) {
          setArticles(response.data.data);
          console.log(`✅ Loaded ${response.data.data.length} featured articles`);
        } else {
          console.warn('⚠️ No featured news found');
          setArticles([]);
        }
      } catch (err) {
        console.error('❌ Error fetching featured news:', err);
        setError('Unable to load news articles at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Recent';
    }
  };

  // Get category badge color
  const getCategoryBadgeColor = (category) => {
    const colors = {
      'pets': 'primary',
      'dogs': 'success', 
      'cats': 'info',
      'veterinary': 'warning',
      'adoption': 'danger',
      'care': 'secondary',
      'training': 'dark',
      'health': 'success',
      'nutrition': 'info'
    };
    return colors[category?.toLowerCase()] || 'secondary';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'pets': 'fas fa-paw',
      'dogs': 'fas fa-dog', 
      'cats': 'fas fa-cat',
      'veterinary': 'fas fa-stethoscope',
      'adoption': 'fas fa-heart',
      'care': 'fas fa-hand-holding-heart',
      'training': 'fas fa-graduation-cap',
      'health': 'fas fa-heartbeat',
      'nutrition': 'fas fa-apple-alt'
    };
    return icons[category?.toLowerCase()] || 'fas fa-newspaper';
  };

  // Truncate text to specified length
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col>
              <Spinner animation="border" className="mb-3" />
              <h5>Loading latest news...</h5>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row>
            <Col>
              <Alert variant="warning" className="text-center">
                <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>News Temporarily Unavailable</h5>
                <p>{error}</p>
                <Button variant="primary" as={Link} to="/news">
                  <i className="fas fa-newspaper me-2"></i>
                  Visit News Page
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-5 bg-light">
      <Container>
        {/* Section Header */}
        <Row className="text-center mb-5">
          <Col>
            <h2 className="h3 mb-3">
              <i className="fas fa-newspaper text-primary me-2"></i>
              Latest Pet News & Tips
            </h2>
            <p className="text-muted lead">
              Stay informed with the latest pet care advice, health tips, and heartwarming stories
            </p>
            <hr className="w-25 mx-auto" style={{height: '2px', backgroundColor: '#007bff'}} />
          </Col>
        </Row>

        {/* News Articles */}
        <Row className="g-4 mb-4">
          {articles.map((article, index) => (
            <Col key={article.id || article._id || index} lg={4} md={6}>
              <Card className="h-100 border-0 shadow-sm hover-shadow transition-all">
                {article.imageUrl && (
                  <Card.Img 
                    variant="top" 
                    src={article.imageUrl} 
                    alt={article.title}
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  {/* Category Badge */}
                  <div className="mb-3">
                    <Badge bg={getCategoryBadgeColor(article.category)} className="d-inline-flex align-items-center">
                      <i className={`${getCategoryIcon(article.category)} me-1`}></i>
                      {article.category || 'News'}
                    </Badge>
                  </div>

                  {/* Article Title */}
                  <h5 className="card-title mb-3 fw-bold">
                    {article.title || 'Pet News Article'}
                  </h5>

                  {/* Article Summary */}
                  <p className="card-text text-muted flex-grow-1">
                    {truncateText(article.summary)}
                  </p>

                  {/* Meta Information */}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      {article.author && (
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {article.author}
                        </small>
                      )}
                      {article.readTime && (
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {article.readTime}
                        </small>
                      )}
                    </div>
                    
                    <small className="text-muted d-block mb-3">
                      <i className="fas fa-calendar me-1"></i>
                      {formatDate(article.publishedAt)}
                      {article.views && (
                        <span className="ms-3">
                          <i className="fas fa-eye me-1"></i>
                          {article.views} views
                        </span>
                      )}
                    </small>

                    {/* Read More Button */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      as={Link}
                      to={`/news/${article.slug || article.id || article._id}`}
                    >
                      <i className="fas fa-book-open me-2"></i>
                      Read More
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* View All News Button */}
        <Row>
          <Col className="text-center">
            <Button 
              variant="primary" 
              size="lg"
              as={Link} 
              to="/news"
              className="px-5"
            >
              <i className="fas fa-newspaper me-2"></i>
              View All News & Articles
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default NewsSection;