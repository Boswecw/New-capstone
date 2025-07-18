// client/src/pages/News.js - FIXED VERSION with robust error handling
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { newsAPI } from '../services/newsAPI';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  // Fallback articles if API completely fails
  const fallbackArticles = [
    {
      id: 'fallback-1',
      title: 'Welcome to FurBabies Pet Store News',
      summary: 'Stay updated with the latest pet care tips, adoption stories, and community news from FurBabies Pet Store.',
      category: 'company-news',
      author: 'FurBabies Team',
      publishedAt: new Date().toISOString(),
      readTime: '2 min read',
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80'
    },
    {
      id: 'fallback-2',
      title: 'Pet Adoption Success Stories',
      summary: 'Heartwarming tales from families who found their perfect companions through our adoption program.',
      category: 'success-story',
      author: 'Community Stories',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      readTime: '5 min read',
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80'
    },
    {
      id: 'fallback-3',
      title: 'Essential Pet Care Tips',
      summary: 'Expert advice on keeping your furry friends healthy, happy, and well-cared for throughout their lives.',
      category: 'care',
      author: 'Dr. Sarah Johnson',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      readTime: '7 min read',
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=400&fit=crop&q=80'
    }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('🔍 News: Starting fetch process...');
        setLoading(true);
        setError('');
        
        const startTime = Date.now();
        let response = null;
        let apiMethod = '';

        // Try multiple API endpoints in order of preference
        try {
          console.log('🔍 News: Trying getFeaturedNews...');
          apiMethod = 'getFeaturedNews';
          response = await newsAPI.getFeaturedNews(10);
          console.log('✅ News: getFeaturedNews success:', response?.data);
        } catch (err1) {
          console.log('❌ News: getFeaturedNews failed:', err1.message);
          
          try {
            console.log('🔍 News: Trying getAllNews...');
            apiMethod = 'getAllNews';
            response = await newsAPI.getAllNews({ limit: 10 });
            console.log('✅ News: getAllNews success:', response?.data);
          } catch (err2) {
            console.log('❌ News: getAllNews failed:', err2.message);
            
            try {
              console.log('🔍 News: Trying getCustomNews...');
              apiMethod = 'getCustomNews';
              response = await newsAPI.getCustomNews({ limit: 10 });
              console.log('✅ News: getCustomNews success:', response?.data);
            } catch (err3) {
              console.log('❌ News: All API methods failed:', err3.message);
              throw new Error(`All API methods failed. Last error: ${err3.message}`);
            }
          }
        }

        const fetchTime = Date.now() - startTime;

        // Process successful response
        if (response?.data?.success && Array.isArray(response.data.data)) {
          const fetchedArticles = response.data.data;
          
          if (fetchedArticles.length > 0) {
            setArticles(fetchedArticles);
            setDebugInfo({
              method: apiMethod,
              fetchTime: fetchTime,
              articleCount: fetchedArticles.length,
              status: 'success',
              source: response.data.breakdown ? 'mixed' : 'single'
            });
            console.log('✅ News: Articles set successfully:', fetchedArticles.length);
          } else {
            throw new Error('No articles returned from API');
          }
        } else {
          throw new Error('Invalid response format from API');
        }

      } catch (err) {
        console.error('❌ News: Complete failure, using fallback:', err);
        setError(`API Error: ${err.message}`);
        setArticles(fallbackArticles);
        setDebugInfo({
          method: 'fallback',
          fetchTime: 0,
          articleCount: fallbackArticles.length,
          status: 'fallback',
          error: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const getCategoryInfo = (category) => {
    const categoryMap = {
      'adoption': { color: 'primary', icon: 'fas fa-heart', label: 'Adoption' },
      'care': { color: 'success', icon: 'fas fa-hand-holding-heart', label: 'Pet Care' },
      'success-story': { color: 'warning', icon: 'fas fa-star', label: 'Success Story' },
      'health': { color: 'info', icon: 'fas fa-stethoscope', label: 'Health' },
      'safety': { color: 'danger', icon: 'fas fa-shield-alt', label: 'Safety' },
      'company-news': { color: 'secondary', icon: 'fas fa-building', label: 'Company News' },
      'external-news': { color: 'info', icon: 'fas fa-globe', label: 'Pet News' }
    };
    
    return categoryMap[category] || { 
      color: 'outline-primary', 
      icon: 'fas fa-newspaper', 
      label: category || 'News' 
    };
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || typeof text !== 'string') {
      return 'No description available.';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80';
  };

  const retryFetch = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="mb-3" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h4>Loading Pet News...</h4>
        <p className="text-muted">Fetching the latest stories for you</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-4">
            <i className="fas fa-newspaper text-primary me-3"></i>
            Pet News & Stories
          </h1>
          <p className="text-center text-muted">
            Stay updated with the latest pet care tips, adoption stories, and community news
          </p>
        </Col>
      </Row>

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="info" className="mb-4">
          <h6>Debug Information:</h6>
          <small>
            <strong>Status:</strong> {debugInfo.status} | 
            <strong> Method:</strong> {debugInfo.method} | 
            <strong> Articles:</strong> {debugInfo.articleCount} | 
            <strong> Fetch Time:</strong> {debugInfo.fetchTime}ms
            {debugInfo.error && <><br/><strong>Error:</strong> {debugInfo.error}</>}
          </small>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="warning" className="mb-4" dismissible onClose={() => setError('')}>
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Connection Issue
          </Alert.Heading>
          <p>{error}</p>
          <p className="mb-0">
            Don't worry! We're showing you some featured content while we work on the connection.
            <Button variant="outline-warning" size="sm" className="ms-2" onClick={retryFetch}>
              <i className="fas fa-redo me-1"></i>
              Try Again
            </Button>
          </p>
        </Alert>
      )}

      {/* Articles Grid */}
      <Row>
        {articles.length > 0 ? (
          articles.map((article, index) => {
            const categoryInfo = getCategoryInfo(article.category);
            
            return (
              <Col lg={4} md={6} className="mb-4" key={article.id || `article-${index}`}>
                <Card className="h-100 shadow-sm border-0 article-card">
                  {/* Article Image */}
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={article.imageUrl || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80'}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={handleImageError}
                      alt={article.title || 'News article'}
                    />
                    {/* Category Badge */}
                    <Badge 
                      bg={categoryInfo.color} 
                      className="position-absolute top-0 start-0 m-2"
                    >
                      <i className={`${categoryInfo.icon} me-1`}></i>
                      {categoryInfo.label}
                    </Badge>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h5 mb-2 text-dark">
                      {article.title || 'Untitled Article'}
                    </Card.Title>
                    
                    <Card.Text className="text-muted mb-3 flex-grow-1">
                      {truncateText(article.summary || article.description || article.content)}
                    </Card.Text>

                    {/* Article Meta */}
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center text-muted small mb-2">
                        <span>
                          <i className="fas fa-user me-1"></i>
                          {article.author || 'FurBabies Team'}
                        </span>
                        <span>
                          <i className="fas fa-clock me-1"></i>
                          {article.readTime || '3 min read'}
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                        </small>
                        
                        {article.originalUrl ? (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            href={article.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            Read More
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => console.log('View article:', article.id)}
                          >
                            <i className="fas fa-eye me-1"></i>
                            Read More
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col xs={12}>
            <Alert variant="info" className="text-center">
              <h4>No News Articles Available</h4>
              <p>Check back soon for the latest pet news and stories!</p>
            </Alert>
          </Col>
        )}
      </Row>

      {/* Load More Section */}
      {articles.length > 0 && (
        <Row className="mt-4">
          <Col className="text-center">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => console.log('Load more articles')}
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