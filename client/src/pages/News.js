// Simple working News.js component - Replace your current one with this temporarily
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { newsAPI } from '../services/newsAPI'; // Adjust import path as needed

const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('🔍 Simple News: Fetching articles...');
        
        // Try different API calls to see which works
        let response;
        try {
          response = await newsAPI.getAllNews({ limit: 10 });
          console.log('✅ getAllNews worked:', response);
        } catch (err1) {
          console.log('❌ getAllNews failed, trying getFeaturedNews:', err1.message);
          try {
            response = await newsAPI.getFeaturedNews(10);
            console.log('✅ getFeaturedNews worked:', response);
          } catch (err2) {
            console.log('❌ getFeaturedNews failed, trying getCustomNews:', err2.message);
            response = await newsAPI.getCustomNews({ limit: 10 });
            console.log('✅ getCustomNews worked:', response);
          }
        }

        if (response && response.data && response.data.success) {
          setArticles(response.data.data || []);
          console.log('✅ Articles set:', response.data.data.length);
        } else {
          setError('No articles found');
          console.log('❌ No successful response');
        }
      } catch (err) {
        console.error('❌ All API calls failed:', err);
        setError('Failed to load news articles');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  console.log('🔍 Simple News render:', { loading, error, articlesLength: articles.length });

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading news articles...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-4">
            <i className="fas fa-newspaper text-primary me-3"></i>
            Pet News & Stories
          </h1>
        </Col>
      </Row>

      {/* Debug Info */}
      <Alert variant="info" className="mb-4">
        <strong>Debug:</strong> Loading: {loading ? 'Yes' : 'No'} | 
        Error: {error || 'None'} | 
        Articles: {articles.length}
      </Alert>

      {error && (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      )}

      {articles.length === 0 && !error && (
        <Alert variant="info" className="text-center">
          <h4>No News Articles Found</h4>
          <p>We're working on bringing you the latest pet news. Check back soon!</p>
        </Alert>
      )}

      <Row>
        {articles.map((article, index) => (
          <Col md={6} lg={4} key={article.id || index} className="mb-4">
            <Card className="h-100 shadow-sm">
              {article.imageUrl && (
                <Card.Img 
                  variant="top" 
                  src={article.imageUrl}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h5">
                  {article.title || 'Untitled Article'}
                </Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  {article.summary || article.description || 'No description available'}
                </Card.Text>
                <div className="mt-auto">
                  <small className="text-muted">
                    {article.author && (
                      <>
                        <i className="fas fa-user me-1"></i>
                        {article.author}
                      </>
                    )}
                    {article.publishedAt && (
                      <span className="ms-3">
                        <i className="fas fa-calendar me-1"></i>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Raw Debug Data */}
      <details className="mt-5">
        <summary>🔍 Raw Article Data (Click to expand)</summary>
        <pre className="bg-light p-3 mt-2" style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(articles, null, 2)}
        </pre>
      </details>
    </Container>
  );
};

export default News;