// client/src/components/NewsSection.js - FIXED to use consolidated API
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api'; // ✅ Use consolidated API service

const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📰 NewsSection: Fetching mixed featured news...');
        
        // ✅ Use consolidated newsAPI from services/api.js
        const response = await newsAPI.getFeaturedNews(3);
        
        if (response?.data?.success && response.data.data?.length > 0) {
          setNews(response.data.data);
          console.log(`✅ NewsSection: Loaded ${response.data.data.length} news articles`);
        } else if (response?.data && Array.isArray(response.data)) {
          // Handle direct array response
          setNews(response.data);
          console.log(`✅ NewsSection: Loaded ${response.data.length} news articles (direct array)`);
        } else {
          console.log('⚠️ NewsSection: No news articles found, using fallback');
          setNews(getFallbackNews());
        }
        
      } catch (err) {
        console.error('❌ NewsSection: Error fetching news:', err);
        
        // Use fallback content on error
        console.log('⚠️ NewsSection: API failed, using fallback content:', err.message);
        setNews(getFallbackNews());
        setError('Unable to load latest news. Showing sample content.');
        
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNews();
  }, []);

  // Fallback news content
  const getFallbackNews = () => [
    {
      id: 'fallback-1',
      title: 'Welcome to FurBabies Pet Store',
      excerpt: 'Find your perfect furry companion and everything they need for a happy life.',
      publishedAt: new Date().toISOString(),
      category: 'company-news',
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=200&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-2', 
      title: 'Pet Adoption Success Stories',
      excerpt: 'Read heartwarming stories of pets finding their forever homes through our platform.',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: 'success-story',
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-3',
      title: 'Pet Care Tips & Guides',
      excerpt: 'Expert advice on keeping your pets healthy, happy, and well-cared for.',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'care',
      imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=200&fit=crop',
      type: 'custom',
      isFallback: true
    }
  ];

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  // Get category info for styling
  const getCategoryInfo = (category) => {
    const categoryMap = {
      'success-story': { icon: 'fas fa-trophy', color: 'success', label: 'Success Story' },
      'safety': { icon: 'fas fa-shield-alt', color: 'warning', label: 'Safety' },
      'company-news': { icon: 'fas fa-building', color: 'primary', label: 'Company News' },
      'adoption': { icon: 'fas fa-heart', color: 'danger', label: 'Adoption' },
      'care': { icon: 'fas fa-hand-holding-heart', color: 'info', label: 'Pet Care' },
      'health': { icon: 'fas fa-stethoscope', color: 'info', label: 'Health' }
    };
    return categoryMap[category] || { icon: 'fas fa-newspaper', color: 'secondary', label: 'News' };
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <h5 className="mt-3">Loading Latest News...</h5>
          <p className="text-muted">Getting the latest updates for you</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h2 className="mb-3">
              <i className="fas fa-newspaper text-primary me-2"></i>
              Latest News & Updates
            </h2>
            <p className="text-muted">Stay updated with pet care tips, success stories, and company news</p>
            {error && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                {error}
              </Alert>
            )}
          </div>
        </Col>
      </Row>

      <Row>
        {news.slice(0, 3).map((article, index) => {
          const categoryInfo = getCategoryInfo(article.category);
          
          return (
            <Col key={article.id || `news-${index}`} md={4} className="mb-4">
              <Card className="h-100 shadow-sm border-0 news-card">
                {/* Article Image */}
                <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
                  <Card.Img
                    variant="top"
                    src={article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=200&fit=crop'}
                    alt={article.title}
                    className="h-100 w-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=200&fit=crop';
                    }}
                  />
                  
                  {/* Category Badge */}
                  <div className="position-absolute top-0 start-0 m-2">
                    <span className={`badge bg-${categoryInfo.color} rounded-pill px-3 py-2`}>
                      <i className={`${categoryInfo.icon} me-1`}></i>
                      {categoryInfo.label}
                    </span>
                  </div>

                  {/* Fallback Indicator */}
                  {article.isFallback && (
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className="badge bg-secondary rounded-pill px-2 py-1">
                        <i className="fas fa-info-circle me-1"></i>
                        Sample
                      </span>
                    </div>
                  )}
                </div>

                <Card.Body className="d-flex flex-column">
                  {/* Article Title */}
                  <Card.Title className="h5 mb-3 line-clamp-2">
                    {article.title}
                  </Card.Title>

                  {/* Article Excerpt */}
                  <Card.Text className="text-muted mb-3 line-clamp-3 flex-grow-1">
                    {article.excerpt || article.description || 'Click to read more about this article.'}
                  </Card.Text>

                  {/* Article Footer */}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">
                        <i className="fas fa-calendar me-1"></i>
                        {formatDate(article.publishedAt)}
                      </small>
                      {article.type && (
                        <small className="text-muted">
                          <i className={article.type === 'external' ? 'fas fa-external-link-alt' : 'fas fa-home'} me-1></i>
                          {article.type === 'external' ? 'External' : 'FurBabies'}
                        </small>
                      )}
                    </div>

                    {/* Read More Button */}
                    {article.url ? (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-100"
                      >
                        <i className="fas fa-external-link-alt me-2"></i>
                        Read Full Article
                      </Button>
                    ) : (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        as={Link}
                        to={`/news/${article.id}`}
                        className="w-100"
                      >
                        <i className="fas fa-arrow-right me-2"></i>
                        Read More
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* View All News Button */}
      <Row className="mt-4">
        <Col className="text-center">
          <Button variant="primary" size="lg" as={Link} to="/news">
            <i className="fas fa-newspaper me-2"></i>
            View All News & Updates
          </Button>
        </Col>
      </Row>

      {/* Custom CSS for line clamping */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .news-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .news-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      `}</style>
    </Container>
  );
};

export default NewsSection;