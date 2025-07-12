// client/src/components/NewsSection.js - Pet News Section for Homepage
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const NewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        console.log('📰 NewsSection: Fetching featured news...');
        
        // Try to get general pet news first
        const response = await newsAPI.getAllNews({ category: 'pets', limit: 3 });
        
        if (response.data.success && response.data.data.length > 0) {
          console.log('✅ NewsSection: Found pet news:', response.data.data.length);
          setArticles(response.data.data);
        } else {
          console.log('⚠️ NewsSection: No pet news found, trying all categories...');
          
          // Fallback: get any news articles
          const allNewsRes = await newsAPI.getAllNews({ limit: 3 });
          
          if (allNewsRes.data.success && allNewsRes.data.data.length > 0) {
            console.log('✅ NewsSection: Using mixed news as fallback:', allNewsRes.data.data.length);
            setArticles(allNewsRes.data.data);
          } else {
            console.log('❌ NewsSection: No news found at all');
            setError('No news articles available at this time.');
          }
        }
        
      } catch (err) {
        console.error('❌ NewsSection: Error loading news:', err);
        setError('Unable to load news at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      pets: 'primary',
      dogs: 'success',
      cats: 'info',
      veterinary: 'warning',
      adoption: 'secondary'
    };
    return colors[category] || 'outline-primary';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      pets: 'fas fa-paw',
      dogs: 'fas fa-dog',
      cats: 'fas fa-cat',
      veterinary: 'fas fa-stethoscope',
      adoption: 'fas fa-heart'
    };
    return icons[category] || 'fas fa-newspaper';
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'Read the latest news and tips about pet care, health, and wellbeing.';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-4">
            <Col>
              <h2 className="h3 mb-3">
                <i className="fas fa-newspaper text-primary me-2"></i>
                Latest Pet News
              </h2>
              <p className="text-muted">Stay updated with pet care tips and stories</p>
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col xs="auto" className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading latest news...</p>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  if (error && articles.length === 0) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-4">
            <Col>
              <h2 className="h3 mb-3">
                <i className="fas fa-newspaper text-primary me-2"></i>
                Latest Pet News
              </h2>
              <p className="text-muted">Stay updated with pet care tips and stories</p>
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col md={6}>
              <Alert variant="info" className="text-center">
                <i className="fas fa-info-circle me-2"></i>
                {error}
                <div className="mt-3">
                  <Button as={Link} to="/news" variant="primary" size="sm">
                    <i className="fas fa-newspaper me-2"></i>
                    Visit News Page
                  </Button>
                </div>
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
            <Col key={article.id || index} lg={4} md={6}>
              <Card className="h-100 border-0 shadow-sm hover-shadow transition-all">
                <Card.Body className="d-flex flex-column">
                  {/* Category Badge */}
                  <div className="mb-3">
                    <Badge bg={getCategoryBadgeColor(article.category)} className="d-flex align-items-center w-fit">
                      <i className={`${getCategoryIcon(article.category)} me-2`}></i>
                      {article.category || 'News'}
                    </Badge>
                  </div>

                  {/* Article Title */}
                  <h5 className="card-title mb-3 fw-bold">
                    {article.title || 'Pet News Article'}
                  </h5>

                  {/* Article Summary */}
                  <p className="card-text text-muted flex-grow-1 mb-3">
                    {truncateText(article.summary)}
                  </p>

                  {/* Article Meta */}
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      {formatDate(article.publishedAt)}
                    </small>
                    
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center"
                    >
                      <i className="fas fa-external-link-alt me-1"></i>
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
              as={Link} 
              to="/news" 
              variant="primary" 
              size="lg"
              className="d-flex align-items-center justify-content-center mx-auto"
              style={{ maxWidth: '200px' }}
            >
              <i className="fas fa-newspaper me-2"></i>
              View All News
            </Button>
            <p className="text-muted mt-2 small">
              Discover more pet care tips, health advice, and inspiring stories
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default NewsSection;