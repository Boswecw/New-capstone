// client/src/pages/NewsDetail.js - COMPLETE NEWS DETAIL PAGE
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';
import { newsAPI } from '../services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch article by ID
  const fetchArticle = useCallback(async () => {
    if (!id) {
      setError('Invalid article ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📰 Fetching article:', id);
      
      const response = await newsAPI.getNewsById(id);
      
      if (response.data?.success && response.data.data) {
        setArticle(response.data.data);
        console.log('✅ Article loaded:', response.data.data.title);
        
        // Fetch related articles
        if (response.data.data.category) {
          fetchRelatedArticles(response.data.data.category, id);
        }
      } else {
        setError('Article not found');
      }
    } catch (err) {
      console.error('❌ Failed to fetch article:', err);
      
      // Fallback to mock data for development
      const mockArticle = {
        id: id,
        title: 'Welcome to FurBabies Pet Store',
        content: `
          <p>Welcome to FurBabies Pet Store, your trusted partner in pet care and adoption!</p>
          
          <p>We are dedicated to connecting loving families with their perfect furry companions while providing the highest quality pet supplies and services.</p>
          
          <h3>Our Mission</h3>
          <p>At FurBabies, we believe every pet deserves a loving home and every family deserves the joy of pet companionship. Our mission is to:</p>
          <ul>
            <li>Facilitate successful pet adoptions</li>
            <li>Provide premium pet supplies and accessories</li>
            <li>Offer expert advice and support to pet owners</li>
            <li>Promote responsible pet ownership</li>
          </ul>
          
          <h3>What We Offer</h3>
          <p>Discover our comprehensive range of services:</p>
          <ul>
            <li><strong>Pet Adoption:</strong> Browse our selection of dogs, cats, and other animals waiting for their forever homes</li>
            <li><strong>Pet Supplies:</strong> High-quality food, toys, accessories, and care products</li>
            <li><strong>Expert Guidance:</strong> Professional advice on pet care, training, and health</li>
            <li><strong>Community Support:</strong> Resources and support for pet owners</li>
          </ul>
          
          <p>Visit us today and let us help you find your perfect furry family member!</p>
        `,
        summary: 'Discover amazing pets and products for your furry friends at FurBabies Pet Store.',
        category: 'pets',
        author: 'FurBabies Team',
        featured: true,
        published: true,
        publishedAt: new Date().toISOString(),
        views: 150,
        readTime: '3 min read',
        tags: ['pets', 'adoption', 'pet-care']
      };
      
      setArticle(mockArticle);
      console.log('📰 Using fallback mock article');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch related articles
  const fetchRelatedArticles = async (category, excludeId) => {
    try {
      const response = await newsAPI.getNewsByCategory(category, { 
        limit: 3,
        exclude: excludeId 
      });
      
      if (response.data?.success && response.data.data) {
        setRelatedArticles(response.data.data.filter(art => art.id !== excludeId));
      }
    } catch (err) {
      console.error('❌ Failed to fetch related articles:', err);
      // Mock related articles
      setRelatedArticles([
        {
          id: '2',
          title: 'Pet Care Tips for New Owners',
          summary: 'Essential advice for first-time pet owners.',
          category: 'pets',
          publishedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          title: 'Choosing the Right Pet Food',
          summary: 'Guide to selecting nutritious food for your pets.',
          category: 'pets',
          publishedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

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

  const renderContent = (content) => {
    if (!content) return <p>Content not available.</p>;
    
    // If content is HTML, render it safely
    if (content.includes('<')) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    // If content is plain text, format it with paragraphs
    return content.split('\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <Spinner animation="border" className="mb-3" />
            <h5>Loading article...</h5>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error && !article) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h4>Article Not Found</h4>
              <p>{error}</p>
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  as={Link}
                  to="/news"
                  className="me-2"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to News
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        {/* Main Article Content */}
        <Col lg={8}>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">
                  <i className="fas fa-home me-1"></i>Home
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/news" className="text-decoration-none">News</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {article?.category || 'Article'}
              </li>
            </ol>
          </nav>

          {/* Article Header */}
          <div className="mb-4">
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Badge bg={getCategoryBadgeColor(article?.category)}>
                {article?.category?.charAt(0).toUpperCase() + article?.category?.slice(1) || 'News'}
              </Badge>
              
              {article?.featured && (
                <Badge bg="warning" text="dark">
                  <i className="fas fa-star me-1"></i>
                  Featured
                </Badge>
              )}
              
              {article?.tags?.map((tag, index) => (
                <Badge key={index} bg="light" text="dark">
                  #{tag}
                </Badge>
              ))}
            </div>

            <h1 className="display-5 fw-bold text-primary mb-3">
              {article?.title || 'Article Title'}
            </h1>

            <div className="row text-muted mb-4">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-user me-2"></i>
                  <span>By {article?.author || 'FurBabies Team'}</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-calendar me-2"></i>
                  <span>{formatDate(article?.publishedAt)}</span>
                </div>
              </div>
              <div className="col-md-6">
                {article?.readTime && (
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-clock me-2"></i>
                    <span>{article.readTime}</span>
                  </div>
                )}
                {article?.views && (
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-eye me-2"></i>
                    <span>{article.views.toLocaleString()} views</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Article Image */}
          {article?.imageUrl && (
            <div className="mb-4">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="img-fluid rounded shadow"
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Article Summary */}
          {article?.summary && (
            <div className="alert alert-light border-start border-primary border-4 mb-4">
              <h5 className="fw-bold mb-2">
                <i className="fas fa-info-circle text-primary me-2"></i>
                Summary
              </h5>
              <p className="mb-0 lead">{article.summary}</p>
            </div>
          )}

          {/* Article Content */}
          <div className="article-content mb-5">
            {renderContent(article?.content || article?.summary)}
          </div>

          {/* Article Actions */}
          <div className="d-flex gap-3 mb-5">
            <Button
              variant="outline-primary"
              as={Link}
              to="/news"
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to News
            </Button>
            
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-history me-2"></i>
              Go Back
            </Button>
            
            <Button
              variant="outline-success"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article?.title,
                    text: article?.summary,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
            >
              <i className="fas fa-share me-2"></i>
              Share
            </Button>
          </div>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-newspaper me-2"></i>
                  Related Articles
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {relatedArticles.map((relatedArticle, index) => (
                  <div 
                    key={relatedArticle.id || index}
                    className={`p-3 ${index < relatedArticles.length - 1 ? 'border-bottom' : ''}`}
                  >
                    <h6 className="mb-2">
                      <Link 
                        to={`/news/${relatedArticle.id}`}
                        className="text-decoration-none"
                      >
                        {relatedArticle.title}
                      </Link>
                    </h6>
                    <p className="text-muted small mb-2">
                      {relatedArticle.summary?.substring(0, 80)}...
                    </p>
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      {formatDate(relatedArticle.publishedAt)}
                    </small>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-link me-2"></i>
                Quick Links
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  as={Link}
                  to="/pets"
                >
                  <i className="fas fa-paw me-2"></i>
                  Browse Pets
                </Button>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  as={Link}
                  to="/products"
                >
                  <i className="fas fa-shopping-bag me-2"></i>
                  Pet Supplies
                </Button>
                <Button 
                  variant="outline-info" 
                  size="sm"
                  as={Link}
                  to="/about"
                >
                  <i className="fas fa-info-circle me-2"></i>
                  About Us
                </Button>
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  as={Link}
                  to="/contact"
                >
                  <i className="fas fa-envelope me-2"></i>
                  Contact Us
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NewsDetail;