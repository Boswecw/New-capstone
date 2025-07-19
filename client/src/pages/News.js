// client/src/pages/News.js - FIXED with Badge import
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form, Badge } from 'react-bootstrap'; // ✅ FIXED: Added Badge
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const News = () => {
  const [allNews, setAllNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📰 News Page: Fetching all news articles...');
        
        // Get all news articles
        const response = await newsAPI.getAllNews({ limit: 50 });
        
        if (response?.data?.success && response.data.data?.length > 0) {
          setAllNews(response.data.data);
          setFilteredNews(response.data.data);
          console.log(`✅ Loaded ${response.data.data.length} news articles`);
        } else {
          // Fallback to featured news if getAllNews fails
          console.log('⚠️ No articles from getAllNews, trying featured news...');
          const featuredResponse = await newsAPI.getFeaturedNews(10);
          
          if (featuredResponse?.data?.success && featuredResponse.data.data?.length > 0) {
            setAllNews(featuredResponse.data.data);
            setFilteredNews(featuredResponse.data.data);
            console.log(`✅ Loaded ${featuredResponse.data.data.length} featured articles as fallback`);
          } else {
            console.log('⚠️ No news available, using fallback content');
            const fallbackNews = getFallbackNews();
            setAllNews(fallbackNews);
            setFilteredNews(fallbackNews);
          }
        }
        
      } catch (err) {
        console.error('❌ Error fetching news:', err);
        setError('Unable to load news articles. Showing sample content.');
        
        // Use fallback content
        const fallbackNews = getFallbackNews();
        setAllNews(fallbackNews);
        setFilteredNews(fallbackNews);
        
      } finally {
        setLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  // Filter news based on search and category
  useEffect(() => {
    let filtered = [...allNews];

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category === filters.category);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchTerm) ||
        article.excerpt?.toLowerCase().includes(searchTerm) ||
        article.description?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredNews(filtered);
  }, [allNews, filters]);

  const getFallbackNews = () => [
    {
      id: 'fallback-1',
      title: 'Welcome to FurBabies Pet Store',
      excerpt: 'Discover amazing pets and everything they need for a happy life. Our platform connects loving families with their perfect furry companions.',
      publishedAt: new Date().toISOString(),
      category: 'company-news',
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-2',
      title: 'Pet Adoption Success Stories',
      excerpt: 'Read heartwarming stories of pets finding their forever homes through our platform. Every adoption is a new beginning for both pets and families.',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: 'success-story',
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-3',
      title: 'Essential Pet Care Tips',
      excerpt: 'Expert advice on keeping your pets healthy, happy, and well-cared for. From nutrition to exercise, learn everything you need to know.',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'care',
      imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-4',
      title: 'Pet Health & Safety Guidelines',
      excerpt: 'Important information about pet health, safety precautions, and when to consult with veterinarians for the best care.',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'safety',
      imageUrl: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-5',
      title: 'Choosing the Right Pet for Your Family',
      excerpt: 'A comprehensive guide to help you choose the perfect pet companion based on your lifestyle, living space, and family needs.',
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'adoption',
      imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-6',
      title: 'Building Your Pet Care Toolkit',
      excerpt: 'Essential supplies every pet owner should have. From food and toys to grooming supplies and emergency kits.',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'care',
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    }
  ];

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

  const getUniqueCategories = () => {
    const categories = [...new Set(allNews.map(article => article.category).filter(Boolean))];
    return categories.map(cat => ({
      value: cat,
      label: getCategoryInfo(cat).label
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <h3 className="mt-3">Loading News Articles...</h3>
          <p className="text-muted">Getting the latest updates for you</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header Section */}
      <Row className="mb-5">
        <Col>
          <div className="text-center">
            <h1 className="display-4 fw-bold mb-3">
              <i className="fas fa-newspaper text-primary me-3"></i>
              News & Updates
            </h1>
            <p className="lead text-muted">
              Stay updated with the latest pet care tips, success stories, and company news
            </p>
            {error && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                {error}
              </Alert>
            )}
          </div>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label><strong>Search Articles</strong></Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by title or content..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label><strong>Filter by Category</strong></Form.Label>
            <Form.Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5>
              Showing {filteredNews.length} of {allNews.length} articles
            </h5>
            <Button variant="outline-primary" as={Link} to="/">
              <i className="fas fa-home me-2"></i>
              Back to Home
            </Button>
          </div>
        </Col>
      </Row>

      {/* News Articles Grid */}
      {filteredNews.length > 0 ? (
        <Row>
          {filteredNews.map((article, index) => {
            const categoryInfo = getCategoryInfo(article.category);
            
            return (
              <Col key={article.id || `news-${index}`} lg={4} md={6} className="mb-4">
                <Card className="h-100 shadow-sm border-0 news-card">
                  {/* Article Image */}
                  <div className="position-relative overflow-hidden" style={{ height: '250px' }}>
                    <Card.Img
                      variant="top"
                      src={article.imageUrl || article.urlToImage || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=250&fit=crop'}
                      alt={article.title}
                      className="h-100 w-100"
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=250&fit=crop';
                      }}
                    />
                    
                    {/* Category Badge - ✅ Badge is now properly imported */}
                    <div className="position-absolute top-0 start-0 m-2">
                      <Badge bg={categoryInfo.color} className="rounded-pill px-3 py-2">
                        <i className={`${categoryInfo.icon} me-1`}></i>
                        {categoryInfo.label}
                      </Badge>
                    </div>

                    {/* Fallback Indicator - ✅ Badge is now properly imported */}
                    {article.isFallback && (
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge bg="secondary" className="rounded-pill px-2 py-1">
                          <i className="fas fa-info-circle me-1"></i>
                          Sample
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Card.Body className="d-flex flex-column">
                    {/* Article Title */}
                    <Card.Title className="h5 mb-3">
                      {article.title}
                    </Card.Title>

                    {/* Article Excerpt */}
                    <Card.Text className="text-muted mb-3 flex-grow-1">
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
                      <Button 
                        variant="primary" 
                        size="sm" 
                        as={Link}
                        to={`/news/${article.id}`}
                        className="w-100"
                      >
                        <i className="fas fa-arrow-right me-2"></i>
                        Read Full Article
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Alert variant="info" className="text-center py-5">
          <i className="fas fa-search fa-3x text-muted mb-3"></i>
          <h4>No Articles Found</h4>
          <p>Try adjusting your search terms or category filter.</p>
          <Button variant="outline-primary" onClick={() => setFilters({ category: 'all', search: '' })}>
            <i className="fas fa-undo me-2"></i>
            Clear Filters
          </Button>
        </Alert>
      )}

      {/* Custom CSS */}
      <style jsx>{`
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

export default News;