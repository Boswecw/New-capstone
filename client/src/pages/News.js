// client/src/pages/News.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Form,
  Badge,
} from 'react-bootstrap';
import axios from 'axios';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const SEARCH_QUERY = 'pets OR dogs OR cats OR animal adoption OR pet care';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    try {
      setError(null);
      const res = await axios.get(NEWS_API_URL, {
        params: {
          q: SEARCH_QUERY,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: NEWS_API_KEY,
        },
      });

      const formatted = res.data.articles.map((article, idx) => ({
        id: encodeURIComponent(article.url || `external-${idx}`),
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        sourceName: article.source?.name,
      }));

      setArticles(formatted);
      setFiltered(formatted);
    } catch (err) {
      console.error('❌ Error fetching NewsAPI articles:', err.message);
      setError('Unable to load pet news. Please try again later.');
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    const filteredArticles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.description?.toLowerCase().includes(lower)
    );
    setFiltered(filteredArticles);
  }, [search, articles]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4 text-center">
        <Col>
          <h1 className="display-5 fw-bold">
            <i className="fas fa-dog me-2 text-primary" />
            Pet News
          </h1>
          <p className="text-muted">Latest headlines on pets, adoption, and animal care</p>
          {error && <Alert variant="danger">{error}</Alert>}
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6} className="mx-auto">
          <Form.Control
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>

      {filtered.length > 0 ? (
        <Row>
          {filtered.map((article) => (
            <Col key={article.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm news-card position-relative">
                <div className="position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                  <Card.Img
                    src={article.imageUrl || 'https://via.placeholder.com/600x300?text=Pet+News'}
                    alt={article.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x300?text=Pet+News';
                    }}
                  />
                  <Badge bg="info" className="position-absolute top-0 start-0 m-2">
                    <i className="fas fa-paw me-1" />
                    Pet News
                  </Badge>
                  <Badge bg="light" text="dark" className="position-absolute top-0 end-0 m-2">
                    {article.sourceName}
                  </Badge>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{article.title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    {article.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1" />
                      {formatDate(article.publishedAt)}
                    </small>
                    <Button
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
        !error && (
          <Alert variant="info" className="text-center">
            <h5>No pet news articles found</h5>
            <p>Try adjusting your search or check back later.</p>
            <Button variant="outline-primary" onClick={() => setSearch('')}>
              <i className="fas fa-undo me-2" />
              Clear Search
            </Button>
          </Alert>
        )
      )}

      <style>{`
        .news-card:hover {
          transform: translateY(-4px);
          transition: transform 0.2s ease-in-out;
        }
      `}</style>
    </Container>
  );
};

export default News;
