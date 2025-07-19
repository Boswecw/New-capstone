// client/src/pages/NewsDetail.js - UPDATED TO USE newsAPI
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { newsAPI } from '../services/api';

const NewsDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        console.log('📰 Fetching article by ID:', id);
        const res = await newsAPI.getNewsById(id);
        setArticle(res.data?.data || null);
      } catch (err) {
        console.error('❌ Failed to fetch article:', err);
        setError('Unable to load the article. It may not exist.');
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
        <h4 className="mt-3">Loading Article...</h4>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h5>{error}</h5>
          <Button as={Link} to="/news" variant="outline-danger">
            <i className="fas fa-arrow-left me-2"></i>Back to News
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col md={10} className="mx-auto">
          <Card className="shadow">
            {article.imageUrl && (
              <Card.Img
                variant="top"
                src={article.imageUrl}
                alt={article.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=Pet+News';
                }}
              />
            )}
            <Card.Body>
              <Badge bg="info" className="mb-2">
                <i className="fas fa-paw me-1"></i> Pet News
              </Badge>
              <Card.Title className="h3 fw-bold">{article.title}</Card.Title>
              <Card.Subtitle className="text-muted mb-3">
                <i className="fas fa-calendar me-1"></i>{formatDate(article.publishedAt)}
              </Card.Subtitle>
              <Card.Text>{article.content || article.excerpt || article.description}</Card.Text>
              <div className="text-end">
                <Button as={Link} to="/news" variant="primary">
                  <i className="fas fa-arrow-left me-2"></i>Back to News
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NewsDetail;
