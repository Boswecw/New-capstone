// client/src/pages/NewsDetail.js - UPDATED with custom Button system
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { newsAPI } from '../services/api';


const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  // Fetch article data
  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) {
        setError('No article ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('📰 Fetching article by ID:', id);
        const response = await newsAPI.getNewsById(id);
        
        if (response?.data?.success && response.data.data) {
          setArticle(response.data.data);
          console.log('✅ Article loaded successfully:', response.data.data.title);
        } else if (response?.data && response.data._id) {
          // Handle direct article object response
          setArticle(response.data);
          console.log('✅ Article loaded successfully:', response.data.title);
        } else {
          throw new Error('Article not found');
        }
        
      } catch (err) {
        console.error('❌ Error fetching article:', err);
        
        if (err.response?.status === 404) {
          setError('Article not found');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Unable to load article. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  // Fetch related articles
  useEffect(() => {
    if (article?.category) {
      const fetchRelated = async () => {
        try {
          const response = await newsAPI.getAllNews({
            category: article.category,
            limit: 3
          });
          
          if (response?.data?.success) {
            // Filter out current article
            const related = response.data.data.filter(
              a => (a._id || a.id) !== (article._id || article.id)
            ).slice(0, 3);
            setRelatedArticles(related);
          }
        } catch (err) {
          console.error('❌ Error fetching related articles:', err);
        }
      };

      fetchRelated();
    }
  }, [article]);

  // Utility functions
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently published';
    }
  };

  const getArticleImage = (article) => {
    return article?.imageUrl || 
           article?.image || 
           'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=400&fit=crop&q=80';
  };

  const isExternalArticle = (article) => {
    return article?.type === 'external' || 
           article?.source === 'external' || 
           !!(article?.originalUrl || article?.url);
  };

  const handleLikeArticle = async () => {
    if (!article) return;
    
    try {
      await newsAPI.likeArticle(article._id || article.id);
      setArticle(prev => ({
        ...prev,
        likes: (prev.likes || 0) + 1
      }));
    } catch (err) {
      console.error('❌ Error liking article:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Loading article...</h4>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Unable to Load Article
          </Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 justify-content-center">
            {/* ✅ UPDATED: Custom Buttons */}
            <Button variant="danger" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" onClick={() => navigate('/news')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to News
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Article not found
  if (!article) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Article Not Found</Alert.Heading>
          <p>The article you're looking for doesn't exist or may have been removed.</p>
          {/* ✅ UPDATED: Custom Button */}
          <Button variant="primary" onClick={() => navigate('/news')}>
            <i className="fas fa-arrow-left me-2"></i>
            Browse All News
          </Button>
        </Alert>
      </Container>
    );
  }

  const isExternal = isExternalArticle(article);

  // Main article display
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            {/* ✅ UPDATED: Custom Button for breadcrumb */}
            <Button variant="secondary" size="small" onClick={() => navigate('/')} className="p-0 border-0 bg-transparent text-primary">
              Home
            </Button>
          </li>
          <li className="breadcrumb-item">
            <Button variant="secondary" size="small" onClick={() => navigate('/news')} className="p-0 border-0 bg-transparent text-primary">
              News
            </Button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Article
          </li>
        </ol>
      </nav>

      <Row>
        {/* Main Article */}
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            {/* Article Image */}
            <Card.Img
              variant="top"
              src={getArticleImage(article)}
              alt={article.title}
              style={{ height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=400&fit=crop&q=80';
              }}
            />

            <Card.Body>
              {/* Article Meta */}
              <div className="mb-3">
                {article.category && (
                  <Badge bg="primary" className="me-2">
                    <i className="fas fa-tag me-1"></i>
                    {article.category}
                  </Badge>
                )}
                {isExternal && (
                  <Badge bg="info" className="me-2">
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

              {/* Article Title */}
              <h1 className="mb-3">{article.title}</h1>

              {/* Article Info */}
              <div className="mb-4 text-muted">
                <Row>
                  <Col md={6}>
                    <small>
                      <i className="fas fa-calendar me-2"></i>
                      {formatDate(article.publishedAt || article.createdAt)}
                    </small>
                    {article.author && (
                      <small className="ms-3">
                        <i className="fas fa-user me-2"></i>
                        {article.author}
                      </small>
                    )}
                  </Col>
                  <Col md={6} className="text-md-end">
                    <small>
                      <i className="fas fa-eye me-1"></i>
                      {article.views || 0} views
                    </small>
                    <small className="ms-3">
                      <i className="fas fa-heart me-1"></i>
                      {article.likes || 0} likes
                    </small>
                  </Col>
                </Row>
              </div>

              {/* Article Summary */}
              {article.summary && (
                <div className="mb-4">
                  <p className="lead text-muted">{article.summary}</p>
                </div>
              )}

              {/* Article Content */}
              <div className="article-content mb-4">
                {article.content ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: article.content.replace(/\n/g, '<br>') 
                    }} 
                  />
                ) : (
                  <p className="text-muted">
                    {article.description || 'No content available for this article.'}
                  </p>
                )}
              </div>

              {/* External Link */}
              {isExternal && (article.originalUrl || article.url) && (
                <Alert variant="info">
                  <i className="fas fa-external-link-alt me-2"></i>
                  This is an external article. 
                  <a
                    href={article.originalUrl || article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alert-link ms-2"
                  >
                    Read the full article on the original site
                  </a>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 flex-wrap">
                {/* ✅ UPDATED: Custom Buttons */}
                <Button 
                  variant="secondary" 
                  onClick={handleLikeArticle}
                >
                  <i className="fas fa-heart me-2"></i>
                  Like ({article.likes || 0})
                </Button>
                
                <Button variant="secondary">
                  <i className="fas fa-share me-2"></i>
                  Share
                </Button>
                
                <Button 
                  variant="primary"
                  onClick={() => navigate('/news')}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to News
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-newspaper me-2"></i>
                  Related Articles
                </h5>
              </Card.Header>
              <Card.Body>
                {relatedArticles.map((relatedArticle, index) => (
                  <div key={relatedArticle._id || relatedArticle.id || index} className="mb-3">
                    <Card className="border-0">
                      <Row className="g-0">
                        <Col md={4}>
                          <Card.Img
                            src={getArticleImage(relatedArticle)}
                            alt={relatedArticle.title}
                            style={{ height: '80px', objectFit: 'cover' }}
                            className="rounded"
                          />
                        </Col>
                        <Col md={8}>
                          <Card.Body className="p-2">
                            <Card.Title className="h6 mb-1">
                              <Link 
                                to={`/news/${relatedArticle._id || relatedArticle.id}`}
                                className="text-decoration-none"
                              >
                                {relatedArticle.title}
                              </Link>
                            </Card.Title>
                            <Card.Text className="small text-muted mb-0">
                              {formatDate(relatedArticle.publishedAt || relatedArticle.createdAt)}
                            </Card.Text>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                    {index < relatedArticles.length - 1 && <hr />}
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NewsDetail;