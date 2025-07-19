// client/src/pages/NewsDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { newsAPI } from '../services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📰 Fetching article with ID: ${id}`);
        const response = await newsAPI.getNewsById(id);
        setArticle(response.data?.data || null);
      } catch (err) {
        console.error('❌ Failed to fetch article:', err);
        setError('Unable to load the news article.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h3 className="mt-3">Loading Article...</h3>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || 'Article not found'}
        </Alert>
        <Button as={Link} to="/news" variant="outline-primary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to News
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold mb-2">{article.title}</h1>
          <div className="text-muted mb-2">
            <i className="fas fa-calendar me-2"></i>
            {formatDate(article.publishedAt)}
          </div>
          {article.category && (
            <Badge bg="info" className="mb-3">
              <i className="fas fa-tag me-1"></i> {article.category}
            </Badge>
          )}
        </Col>
      </Row>
      {article.imageUrl && (
        <Row className="mb-4">
          <Col>
            <img
              src={article.imageUrl}
              alt={article.title}
              className="img-fluid rounded shadow-sm"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
              }}
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <p className="lead">{article.excerpt}</p>
          <hr />
          <div dangerouslySetInnerHTML={{ __html: article.content || '<p>No additional content available.</p>' }} />
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <Button as={Link} to="/news" variant="primary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to News
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NewsDetail;
