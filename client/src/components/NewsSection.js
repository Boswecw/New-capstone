// client/src/components/NewsSection.js - FIXED with proper image error handling

import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const NewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());

  // Mock data fallback if API fails
  const fallbackArticles = useMemo(() => [
    {
      id: 'fallback-1',
      title: 'Welcome to FurBabies Pet Store',
      summary: 'Discover our wide selection of pets looking for their forever homes. From playful puppies to gentle seniors, we have the perfect companion waiting for you.',
      category: 'adoption',
      author: 'FurBabies Team',
      publishedAt: new Date().toISOString(),
      readTime: '3 min read',
      featured: true
    },
    {
      id: 'fallback-2',
      title: 'Pet Care Tips for New Owners',
      summary: 'Essential advice for first-time pet owners. Learn about feeding schedules, exercise needs, and creating a loving environment for your new family member.',
      category: 'care',
      author: 'Dr. Sarah Johnson',
      publishedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      readTime: '5 min read',
      featured: true
    },
    {
      id: 'fallback-3',
      title: 'Success Stories from Our Community',
      summary: 'Heartwarming tales of pets finding their perfect families. Read about the joy and love that rescue pets bring to their new homes.',
      category: 'success',
      author: 'Community Stories',
      publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      readTime: '4 min read',
      featured: true
    }
  ], []);

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        console.log('📰 NewsSection: Fetching mixed featured news...');
        setLoading(true);
        setError(null);

        // Try to fetch from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          const response = await newsAPI.getFeaturedNews(3, { 
            signal: controller.signal 
          });
          clearTimeout(timeoutId);

          if (response?.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log('✅ NewsSection: Mixed news loaded:', response.data.data.length);
            setArticles(response.data.data);
          } else {
            throw new Error('No featured news available');
          }
        } catch (apiError) {
          clearTimeout(timeoutId);
          
          if (apiError.name === 'AbortError') {
            console.warn('⏰ NewsSection: API timeout, using fallback content');
          } else {
            console.warn('⚠️ NewsSection: API failed, using fallback content:', apiError.message);
          }
          
          // Use fallback content instead of showing error
          setArticles(fallbackArticles);
        }

      } catch (err) {
        console.error('❌ NewsSection: Error loading news:', err);
        setArticles(fallbackArticles); // Always provide content
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNews();
  }, [fallbackArticles]);

  // Enhanced image error handler with no retries to prevent infinite loops
  const handleImageError = (articleId, imageUrl) => {
    const errorKey = `${articleId}-${imageUrl}`;
    
    if (!imageErrors.has(errorKey)) {
      console.warn(`❌ Failed to load article image: ${imageUrl}`);
      setImageErrors(prev => new Set([...prev, errorKey]));
    }
  };

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
      adoption: { color: 'primary', icon: 'fas fa-heart', label: 'Adoption' },
      care: { color: 'success', icon: 'fas fa-hand-holding-heart', label: 'Pet Care' },
      success: { color: 'warning', icon: 'fas fa-star', label: 'Success Story' },
      health: { color: 'info', icon: 'fas fa-stethoscope', label: 'Health' },
      tips: { color: 'secondary', icon: 'fas fa-lightbulb', label: 'Tips' },
      safety: { color: 'danger', icon: 'fas fa-shield-alt', label: 'Safety' }
    };
    
    return categoryMap[category] || { 
      color: 'outline-primary', 
      icon: 'fas fa-newspaper', 
      label: category || 'News' 
    };
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text || typeof text !== 'string') {
      return 'Stay updated with the latest pet care tips and heartwarming stories from our community.';
    }
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col>
              <div className="mb-4">
                <Spinner animation="border" variant="primary" />
              </div>
              <h5 className="text-muted">Loading latest news...</h5>
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
            <hr className="w-25 mx-auto border-primary" style={{height: '2px'}} />
          </Col>
        </Row>

        {/* Error Notice (if any, but still show content) */}
        {error && (
          <Row className="mb-4">
            <Col>
              <Alert variant="info" className="text-center border-0 bg-white shadow-sm">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Showing offline content while we update our news feed
                </small>
              </Alert>
            </Col>
          </Row>
        )}

        {/* News Articles */}
        <Row className="g-4 mb-4">
          {articles.map((article, index) => {
            const categoryInfo = getCategoryInfo(article.category);
            const articleId = article.id || article._id || `article-${index}`;
            const imageUrl = article.image || article.imageUrl;
            const hasImageError = imageUrl && imageErrors.has(`${articleId}-${imageUrl}`);

            return (
              <Col key={articleId} lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm hover-card" style={{transition: 'transform 0.2s ease, box-shadow 0.2s ease'}}>
                  
                  {/* Article Image or Placeholder */}
                  <div className="position-relative overflow-hidden" style={{ height: '200px', backgroundColor: '#f8f9fa' }}>
                    {imageUrl && !hasImageError ? (
                      <Card.Img 
                        variant="top" 
                        src={imageUrl}
                        alt={article.title}
                        style={{ 
                          height: '100%', 
                          width: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onError={() => handleImageError(articleId, imageUrl)}
                        onLoad={() => {
                          // Successfully loaded, no action needed
                        }}
                      />
                    ) : (
                      // Placeholder when no image or image failed
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                        <div className="text-center text-muted p-3">
                          <i className={`${categoryInfo.icon} fa-3x text-primary opacity-25 mb-2`}></i>
                          <div className="small fw-semibold">{categoryInfo.label}</div>
                          <div className="small">Featured Article</div>
                        </div>
                      </div>
                    )}

                    {/* Category Badge Overlay */}
                    <div className="position-absolute top-0 start-0 m-3">
                      <Badge bg={categoryInfo.color} className="d-flex align-items-center px-3 py-2">
                        <i className={`${categoryInfo.icon} me-2`}></i>
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
                    <h5 className="card-title mb-3 fw-bold lh-base">
                      {article.title || 'Pet News Article'}
                    </h5>

                    {/* Article Summary */}
                    <p className="card-text text-muted flex-grow-1 mb-3">
                      {truncateText(article.summary || article.description)}
                    </p>

                    {/* Article Meta Information */}
                    <div className="mt-auto border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        {article.author && (
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-user me-1"></i>
                            {article.author}
                          </small>
                        )}
                        {article.readTime && (
                          <small className="text-muted d-flex align-items-center">
                            <i className="fas fa-clock me-1"></i>
                            {article.readTime}
                          </small>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt || article.createdAt)}
                        </small>
                        
                        {(article.views || article.likes) && (
                          <small className="text-muted">
                            {article.views && (
                              <span className="me-3">
                                <i className="fas fa-eye me-1"></i>
                                {article.views}
                              </span>
                            )}
                            {article.likes && (
                              <span>
                                <i className="fas fa-heart me-1"></i>
                                {article.likes}
                              </span>
                            )}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Read More Button */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 mt-3"
                      as={article.link ? Link : 'button'}
                      to={article.link || undefined}
                      onClick={!article.link ? () => {
                        console.log('📖 Opening article:', article.title);
                        // Handle article click - could open modal, navigate, etc.
                      } : undefined}
                    >
                      <i className="fas fa-book-open me-2"></i>
                      Read Full Article
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* View All News Button */}
        <Row>
          <Col className="text-center">
            <Button 
              variant="primary" 
              size="lg"
              as={Link} 
              to="/news"
              className="px-5 py-3"
            >
              <i className="fas fa-newspaper me-2"></i>
              View All News & Articles
            </Button>
          </Col>
        </Row>
      </Container>

      {/* Custom Styles */}
      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .hover-card:hover img {
          transform: scale(1.05);
        }
      `}</style>
    </section>
  );
};

export default NewsSection;