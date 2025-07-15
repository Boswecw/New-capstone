// ==========================================
// FILE: client/src/components/NewsSection.js - FIXED FOR RENDER
// ==========================================
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { newsAPI, newsUtils } from "../services/newsAPI";

const NewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        console.log("📰 NewsSection: Fetching mixed featured news...");

        const response = await newsAPI.getFeaturedNews(3);

        if (response.data.success) {
          setArticles(response.data.data || []);
          console.log(
            "✅ NewsSection: Mixed news loaded:",
            response.data.breakdown
          );
        } else {
          setError("No news articles available at this time.");
        }
      } catch (err) {
        console.error("❌ NewsSection: Error loading news:", err);
        setError("Unable to load news at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Recent";
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text)
      return "Read the latest news and tips about pet care, health, and wellbeing.";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col>
              <Spinner animation="border" className="mb-3" />
              <h5>Loading latest news...</h5>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-5 bg-light">
        <Container>
          <Row>
            <Col>
              <Alert variant="warning" className="text-center">
                <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>News Temporarily Unavailable</h5>
                <p>{error}</p>
                <Button variant="primary" as={Link} to="/news">
                  <i className="fas fa-newspaper me-2"></i>
                  Visit News Page
                </Button>
              </Alert>
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
              Latest Pet News & Stories
            </h2>
            <p className="text-muted lead">
              Stay informed with pet care tips, success stories, and news from
              around the web
            </p>
            <hr
              className="w-25 mx-auto"
              style={{ height: "2px", backgroundColor: "#007bff" }}
            />
          </Col>
        </Row>

        {/* News Articles */}
        <Row className="g-4 mb-4">
          {articles.map((article, index) => {
            const sourceInfo = newsUtils.getArticleSource(article);

            return (
              <Col key={article.id || index} lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm hover-shadow">
                  {article.imageUrl && (
                    <Card.Img
                      variant="top"
                      src={article.imageUrl}
                      alt={article.title || "Article image"}
                      style={{
                        height: "200px",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                      onError={(e) => {
                        console.warn(
                          `❌ Failed to load article image: ${article.imageUrl}`
                        );
                        // Set fallback image
                        e.target.src = 'https://via.placeholder.com/400x200/f8f9fa/6c757d?text=Pet+News';
                      }}
                    />
                  )}

                  <Card.Body className="d-flex flex-column">
                    <div className="mb-2">
                      {/* Source Badge */}
                      <Badge bg={sourceInfo.color} className="me-2">
                        <i className={`${sourceInfo.icon} me-1`}></i>
                        {sourceInfo.label}
                      </Badge>

                      {/* Featured Badge */}
                      {article.featured && (
                        <Badge bg="warning" text="dark">
                          <i className="fas fa-star me-1"></i>
                          Featured
                        </Badge>
                      )}
                    </div>

                    <Card.Title className="h6">
                      {article.type === "external" && article.originalUrl ? (
                        <a
                          href={article.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none text-dark hover-primary"
                        >
                          {article.title}
                          <i className="fas fa-external-link-alt ms-1 small"></i>
                        </a>
                      ) : (
                        <Link
                          to={`/news/${article.id}`}
                          className="text-decoration-none text-dark hover-primary"
                        >
                          {article.title}
                        </Link>
                      )}
                    </Card.Title>

                    <Card.Text className="text-muted flex-grow-1 small">
                      {truncateText(article.summary)}
                    </Card.Text>

                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center text-muted small">
                        <span>
                          <i className="fas fa-user me-1"></i>
                          {article.author}
                        </span>
                        <span>
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                    </div>
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
              className="px-5"
            >
              <i className="fas fa-newspaper me-2"></i>
              View All News & Articles
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default NewsSection;