
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';

const NewsSection = ({ 
  limit = 3, 
  showHeader = true, 
  title = "Pet News & Updates",
  subtitle = "Stay informed with the latest pet care tips and news"
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('📰 NewsSection: Fetching featured news for home page...');
        setLoading(true);
        setError(null);

        // Mock news data - replace with actual API call
        const mockNews = [
          {
            id: 1,
            title: "10 Essential Tips for New Pet Owners",
            excerpt: "Everything you need to know when bringing home your first pet...",
            date: "2025-01-15",
            category: "Tips",
            readTime: "5 min read",
            imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=200&fit=crop",
            url: "#"
          },
          {
            id: 2,
            title: "Best Winter Care for Outdoor Pets",
            excerpt: "Keep your pets safe and warm during the cold winter months...",
            date: "2025-01-10",
            category: "Health",
            readTime: "3 min read",
            imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=200&fit=crop",
            url: "#"
          },
          {
            id: 3,
            title: "Understanding Pet Nutrition Labels",
            excerpt: "Learn how to read and understand what's really in your pet's food...",
            date: "2025-01-05",
            category: "Nutrition",
            readTime: "7 min read",
            imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=200&fit=crop",
            url: "#"
          }
        ];

        setTimeout(() => {
          setArticles(mockNews.slice(0, limit));
          console.log(`✅ NewsSection: Loaded ${mockNews.slice(0, limit).length} articles (success format)`);
          setLoading(false);
        }, 500);

      } catch (error) {
        console.error('❌ NewsSection error:', error);
        setError('Failed to load news articles');
        setLoading(false);
      }
    };

    fetchNews();
  }, [limit]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Loading news...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="warning" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {showHeader && (
        <div className="text-center mb-4">
          <h2>{title}</h2>
          <p className="text-muted">{subtitle}</p>
        </div>
      )}

      <Row>
        {articles.map((article) => (
          <Col key={article.id} md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              {article.imageUrl && (
                <Card.Img 
                  variant="top" 
                  src={article.imageUrl} 
                  alt={article.title}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Badge bg="primary" className="mb-2">
                    {article.category}
                  </Badge>
                  <small className="text-muted d-flex align-items-center">
                    {/* ✅ FIX: Remove icons that cause boolean attribute warnings */}
                    📅 {formatDate(article.date)}
                  </small>
                </div>
                
                <Card.Title as="h5" className="mb-2">
                  {article.title}
                </Card.Title>
                
                <Card.Text className="flex-grow-1 mb-3">
                  {article.excerpt}
                </Card.Text>
                
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <small className="text-muted">
                    {article.readTime}
                  </small>
                  <a 
                    href={article.url} 
                    className="btn btn-outline-primary btn-sm d-flex align-items-center"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Read More
                    {/* ✅ FIX: Use simple text instead of icon that causes warnings */}
                    <span className="ms-1">→</span>
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default NewsSection;