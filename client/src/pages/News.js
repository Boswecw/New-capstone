import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsAPI } from '../services/api';

const News = () => {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // ✅ Memoized fallback setter to satisfy useEffect dependencies
  const fallbackToSample = useCallback(() => {
    const fallback = getFallbackNews();
    setNews(fallback);
    setFilteredNews(fallback);
  }, []);

  // ✅ Fetch pet-related news on mount
  useEffect(() => {
    const fetchPetNews = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📰 Fetching pet-related news...');
        const response = await newsAPI.getAllNews({ limit: 50, category: 'pet' });

        if (response?.data?.success && response.data.data?.length > 0) {
          setNews(response.data.data);
          setFilteredNews(response.data.data);
        } else {
          console.warn('⚠️ No pet news found, using fallback...');
          fallbackToSample();
        }
      } catch (err) {
        console.error('❌ Error loading pet news:', err);
        setError('Unable to load pet news. Showing sample articles.');
        fallbackToSample();
      } finally {
        setLoading(false);
      }
    };

    fetchPetNews();
  }, [fallbackToSample]); // ✅ Now compliant

  // ✅ Filter by search
  useEffect(() => {
    const filtered = news.filter(article =>
      article.title?.toLowerCase().includes(search.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      article.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredNews(filtered);
  }, [search, news]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const getFallbackNews = () => [
    {
      id: 'fallback-1',
      title: '5 Signs Your Pet Is Happy and Healthy',
      excerpt: 'Learn how to tell if your furry friend is thriving.',
      publishedAt: new Date().toISOString(),
      category: 'pet',
      imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    },
    {
      id: 'fallback-2',
      title: 'What to Know Before Adopting a Dog',
      excerpt: 'Prepare your home and lifestyle for a new best friend.',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      category: 'pet',
      imageUrl: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&h=300&fit=crop',
      type: 'custom',
      isFallback: true
    }
  ];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h3 className="mt-3">Loading Pet News...</h3>
        <p className="text-muted">Please wait while we fetch the latest updates</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h1 className="display-5 fw-bold">
              <i className="fas fa-paw text-primary me-2"></i> Pet News
            </h1>
            <p className="text-muted">
              Latest articles and tips for happy, healthy pets
            </p>
            {error && (
              <Alert variant="info" className="mt-2">
                <i className="fas fa-info-circle me-2"></i>{error}
              </Alert>
            )}
          </div>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={6} className="mx-auto">
          <Form.Control
            type="text"
            placeholder="Search pet articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>

      {/* News Grid */}
      {filteredNews.length > 0 ? (
        <Row>
          {filteredNews.map((article, idx) => (
            <Col key={article.id || `news-${idx}`} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm border-0 news-card">
                <div className="position-relative overflow-hidden" style={{ height: '220px' }}>
                  <Card.Img
                    src={article.imageUrl || article.urlToImage || 'https://via.placeholder.com/600x300?text=News'}
                    alt={article.title}
                    className="h-100 w-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x300?text=News';
                    }}
                  />
                  {article.isFallback && (
                    <Badge bg="secondary" className="position-absolute top-0 end-0 m-2">
                      Sample
                    </Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h6">{article.title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">{article.excerpt}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      {formatDate(article.publishedAt)}
                    </small>
                    <Button
                      as={Link}
                      to={`/news/${article.id}`}
                      size="sm"
                      variant="primary"
                    >
                      Read More
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info" className="text-center">
          <h5>No pet news found</h5>
          <p>Try clearing your search or check back later.</p>
          <Button variant="outline-primary" onClick={() => setSearch('')}>
            <i className="fas fa-undo me-2"></i> Clear Search
          </Button>
        </Alert>
      )}

      {/* Hover style */}
      <style jsx>{`
        .news-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .news-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }
      `}</style>
    </Container>
  );
};

export default News;
