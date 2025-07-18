import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import axios from 'axios';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({
    method: 'loading',
    fetchTime: 0,
    articleCount: 0,
    status: 'loading',
    error: null
  });

  // Fallback articles in case API fails
  const fallbackArticles = [
    {
      id: 'fallback-1',
      title: 'Essential Tips for New Pet Owners',
      summary: 'Everything you need to know when bringing your first pet home. From preparation to the first week together.',
      author: 'FurBabies Team',
      publishedAt: '2025-01-15',
      category: 'care',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80',
      featured: true,
      readTime: '5 min read',
      url: '/news/new-pet-tips'
    },
    {
      id: 'fallback-2',
      title: 'Heartwarming Adoption Success Stories',
      summary: 'Read about pets who found their forever homes and the families who opened their hearts.',
      author: 'Sarah Johnson',
      publishedAt: '2025-01-12',
      category: 'success-story',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=400&fit=crop&q=80',
      featured: true,
      readTime: '3 min read',
      url: '/news/success-stories'
    },
    {
      id: 'fallback-3',
      title: 'Pet Health: Warning Signs to Watch For',
      summary: 'Learn to recognize early warning signs of health issues in your pets and when to contact a veterinarian.',
      author: 'Dr. Michael Chen',
      publishedAt: '2025-01-10',
      category: 'health',
      image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&h=400&fit=crop&q=80',
      featured: false,
      readTime: '7 min read',
      url: '/news/pet-health-warning-signs'
    },
    {
      id: 'fallback-4',
      title: 'Creating a Pet-Safe Home Environment',
      summary: 'Simple steps to make your home safe and comfortable for your new furry family member.',
      author: 'Emma Rodriguez',
      publishedAt: '2025-01-08',
      category: 'safety',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop&q=80',
      featured: false,
      readTime: '6 min read',
      url: '/news/pet-safe-home'
    },
    {
      id: 'fallback-5',
      title: 'FurBabies Community Spotlight',
      summary: 'Meet our amazing volunteers and learn about upcoming community events and fundraisers.',
      author: 'Community Team',
      publishedAt: '2025-01-05',
      category: 'company-news',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&q=80',
      featured: false,
      readTime: '4 min read',
      url: '/news/community-spotlight'
    },
    {
      id: 'fallback-6',
      title: 'The Benefits of Pet Adoption vs. Buying',
      summary: 'Understand why adoption is a wonderful choice for both pets and families, plus tips for the adoption process.',
      author: 'Lisa Park',
      publishedAt: '2025-01-03',
      category: 'adoption',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80',
      featured: true,
      readTime: '5 min read',
      url: '/news/adoption-benefits'
    }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      console.log('📰 News: Starting news fetch...');
      setLoading(true);
      setError('');
      
      const startTime = Date.now();
      
      try {
        const API_BASE = process.env.NODE_ENV === 'production' 
          ? 'https://furbabies-backend.onrender.com/api/news'
          : 'http://localhost:5000/api/news';
        
        console.log(`📡 API Request: GET ${API_BASE}/featured?limit=6`);
        
        const response = await axios.get(`${API_BASE}/featured?limit=6`, {
          timeout: 15000
        });

        const fetchTime = Date.now() - startTime;
        console.log(`✅ API Response: ${response.status} ${API_BASE}/featured?limit=6`);

        if (response.data && response.data.success) {
          const fetchedArticles = response.data.data || [];
          
          if (fetchedArticles.length > 0) {
            setArticles(fetchedArticles);
            setDebugInfo({
              method: response.data.breakdown?.external > 0 ? 'mixed' : 'single',
              fetchTime,
              articleCount: fetchedArticles.length,
              status: 'success',
              error: null,
              breakdown: response.data.breakdown
            });
            console.log(`✅ NewsSection: Mixed news loaded: ${fetchedArticles.length}`);
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
            {debugInfo.breakdown && (
              <>
                <br/><strong>Breakdown:</strong> {debugInfo.breakdown.custom || 0} custom + {debugInfo.breakdown.external || 0} external
              </>
            )}
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
            const articleId = article.id || article._id || `article-${index}`;
            
            return (
              <Col key={articleId} lg={4} md={6} className="mb-4">
                <Card className="h-100 border-0 shadow-sm hover-card" style={{transition: 'transform 0.2s ease, box-shadow 0.2s ease'}}>
                  {/* Article Image */}
                  <div className="position-relative overflow-hidden" style={{ height: '200px', backgroundColor: '#f8f9fa' }}>
                    <Card.Img
                      variant="top"
                      src={article.image || article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80'}
                      alt={article.title}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                      onError={handleImageError}
                    />
                    
                    {/* Category Badge */}
                    <div className="position-absolute top-0 start-0 m-3">
                      <Badge bg={categoryInfo.color} className="px-2 py-1">
                        <i className={`${categoryInfo.icon} me-1`}></i>
                        {categoryInfo.label}
                      </Badge>
                    </div>

                    {/* Featured Badge */}
                    {article.featured && (
                      <div className="position-absolute top-0 end-0 m-3">
                        <Badge bg="warning" text="dark" className="px-2 py-1">
                          <i className="fas fa-star me-1"></i>
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Card.Body className="d-flex flex-column p-4">
                    {/* Article Title */}
                    <Card.Title className="h5 mb-3 fw-bold lh-base">
                      {article.title || 'Pet News Article'}
                    </Card.Title>

                    {/* Article Summary */}
                    <Card.Text className="text-muted flex-grow-1 mb-3">
                      {truncateText(article.summary || article.description)}
                    </Card.Text>

                    {/* Article Meta Information */}
                    <div className="mt-auto border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        {article.author && (
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-user me-1"></i>
                            {article.author}
                          </small>
                        )}
                        <small className="text-muted d-flex align-items-center">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                        </small>
                      </div>
                      
                      {/* Read Time and Action */}
                      <div className="d-flex justify-content-between align-items-center">
                        {article.readTime && (
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-clock me-1"></i>
                            {article.readTime}
                          </small>
                        )}
                        
                        {/* Read More Button */}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            // Handle navigation or external link
                            if (article.url) {
                              if (article.url.startsWith('http')) {
                                window.open(article.url, '_blank', 'noopener,noreferrer');
                              } else {
                                // Internal navigation would go here
                                console.log('Navigate to:', article.url);
                              }
                            }
                          }}
                        >
                          <i className="fas fa-external-link-alt me-1"></i>
                          Read More
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          // Fallback when no articles
          <Col className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-newspaper text-muted" style={{ fontSize: '4rem' }}></i>
            </div>
            <h4 className="text-muted mb-3">No Articles Available</h4>
            <p className="text-muted">
              We're working on bringing you the latest pet news. Please check back soon!
            </p>
            <Button 
              variant="outline-primary" 
              onClick={retryFetch}
              className="mt-3"
            >
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
          </Col>
        )}
      </Row>
      
      {/* View All News Button */}
      {articles.length > 0 && (
        <Row className="mt-5">
          <Col className="text-center">
            <hr className="my-4" />
            <h5 className="text-muted mb-3">Stay Connected</h5>
            <p className="text-muted mb-4">
              Get the latest updates about pet care, adoption success stories, and community events
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button 
                variant="primary"
                onClick={() => {
                  // Navigate to newsletter signup or full news page
                  console.log('Navigate to newsletter signup');
                }}
              >
                <i className="fas fa-envelope me-2"></i>
                Subscribe to Newsletter
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => {
                  // Navigate back to home or explore more
                  window.location.href = '/';
                }}
              >
                <i className="fas fa-home me-2"></i>
                Back to Home
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {/* Additional CSS for hover effects */}
      <style jsx>{`
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </Container>
  );
};

export default News;