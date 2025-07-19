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

  const fallbackToSample = useCallback(() => {
    const fallback = getFallbackNews();
    setNews(fallback);
    setFilteredNews(fallback);
  }, []);

  useEffect(() => {
    const fetchPetNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await newsAPI.getAllNews({ limit: 50, category: 'pet' });

        const articles = res?.data?.data || [];

        const petArticles = articles.filter(article =>
          article.category === 'pet' ||
          article.title?.toLowerCase().includes('pet') ||
          article.excerpt?.toLowerCase().includes('pet') ||
          article.description?.toLowerCase().includes('pet')
        );

        if (petArticles.length > 0) {
          setNews(petArticles);
          setFilteredNews(petArticles);
        } else {
          fallbackToSample();
        }
      } catch (err) {
        setError('Unable to load pet news articles. Showing fallback content.');
        fallbackToSample();
      } finally {
        setLoading(false);
      }
    };

    fetchPetNews();
  }, [fallbackToSample]);

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
      title: 'How to Care for Senior Pets',
      excerpt: 'Improve comfort and health for aging pets.',
      publishedAt: new Date().toISOString(),
      category: 'pet',
      imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600&h=300&fit=crop',
      isFallback: true
    },
    {
      id: 'fallback-2',
      title: 'Tips for Adopting Your First Pet',
      excerpt: 'Everything to know before bringing home a furry friend.',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      category: 'pet',
      imageUrl: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&h=300&fit=crop',
      isFallback: true
    }
  ];

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h3 className="mt-3">Loading Pet News...</h3>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4 text-center">
        <Col>
          <h1 className="display-5 fw-bold">
            <i className="fas fa-dog text-primary me-2"></i> Pet News
          </h1>
          <p className="text-muted">Helpful articles, updates, and tips for happy pets</p>
          {error && <Alert variant="info">{error}</Alert>}
        </Col>
      </Row>

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

      {filteredNews.length > 0 ? (
        <Row>
          {filteredNews.map((article, idx) => (
            <Col key={article.id || `news-${idx}`} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm news-card position-relative">
                <div style={{ height: '220px', overflow: 'hidden' }} className="position-relative">
                  <Card.Img
                    src={article.imageUrl || 'https://via.placeholder.com/600x300?text=Pet+News'}
                    alt={article.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x300?text=Pet+News';
                    }}
                  />
                  {/* ✅ Pet News Badge */}
                  <Badge bg="info" className="position-absolute top-0 start-0 m-2">
                    <i className="fas fa-paw me-1"></i> Pet News
                  </Badge>

                  {/* Optional Fallback Label */}
                  {article.isFallback && (
                    <Badge bg="secondary" className="position-absolute top-0 end-0 m-2">
                      Sample
                    </Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{article.title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">{article.excerpt}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>{formatDate(article.publishedAt)}
                    </small>
                    <Button as={Link} to={`/news/${article.id}`} size="sm" variant="primary">
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
          <p>Try a different search term or check back later.</p>
          <Button variant="outline-primary" onClick={() => setSearch('')}>
            <i className="fas fa-undo me-2"></i> Clear Search
          </Button>
        </Alert>
      )}

      <style jsx>{`
        .news-card {
          transition: transform 0.3s ease;
        }
        .news-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </Container>
  );
};

export default News;
