// client/src/pages/Home.js - Fixed and Enhanced Version
import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Button, Spinner, Alert, Card } from "react-bootstrap"; // ✅ Added Card import
import { Link } from "react-router-dom";
// ❌ Removed Navbar import - it should be handled at App level
import HeroBanner from "../components/HeroBanner";
import PetCard from "../components/PetCard";
import ProductCard from "../components/ProductCard";
import api from "../services/api";

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug mode - set to false in production
  const DEBUG_MODE = process.env.NODE_ENV === 'development';

  const fetchFeaturedPets = useCallback(async () => {
    setLoadingPets(true);
    setError("");
    try {
      console.log("🐾 Fetching featured pets...");
      const response = await api.get("/pets?featured=true&limit=6");

      if (DEBUG_MODE) {
        console.log("Pets API Response:", response);
      }

      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
        console.log("✅ Featured pets loaded:", response.data.data.length);
      } else {
        setError("No featured pets available");
        setFeaturedPets([]);
      }
    } catch (err) {
      console.error("❌ Error fetching featured pets:", err);

      if (DEBUG_MODE) {
        setDebugInfo((prev) => ({
          ...prev,
          petsError: {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
          },
        }));
      }

      setError("Failed to load featured pets");
      setFeaturedPets([]);
    } finally {
      setLoadingPets(false);
    }
  }, [DEBUG_MODE]);

  const fetchFeaturedProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError("");
    try {
      console.log("🛍️ Fetching featured products...");

      // Try the specific featured endpoint first
      let response;
      try {
        response = await api.get("/products/featured?limit=6");
      } catch (featuredErr) {
        console.log("Featured endpoint failed, trying fallback...");
        // Fallback to regular products with featured flag
        response = await api.get("/products?featured=true&limit=6");
      }

      if (DEBUG_MODE) {
        console.log("Products API Response:", response);
      }

      if (response.data?.success) {
        setFeaturedProducts(response.data.data || []);
        console.log("✅ Featured products loaded:", response.data.data.length);
      } else {
        setError("No featured products available");
        setFeaturedProducts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching featured products:", err);

      if (DEBUG_MODE) {
        setDebugInfo((prev) => ({
          ...prev,
          productsError: {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
          },
        }));
      }

      setError("Failed to load featured products");
      setFeaturedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [DEBUG_MODE]);

  // Test API endpoints function
  const testApiEndpoints = useCallback(async () => {
    console.log("🧪 Testing API endpoints...");

    const endpoints = [
      "/api/health",
      "/api/products",
      "/api/products/categories",
      "/api/products/brands",
      "/api/products/featured",
      "/pets",
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        results[endpoint] = {
          status: response.status,
          success: response.data?.success,
          dataLength: Array.isArray(response.data?.data)
            ? response.data.data.length
            : "N/A",
        };
        console.log(`✅ ${endpoint}:`, results[endpoint]);
      } catch (err) {
        results[endpoint] = {
          status: err.response?.status || "Network Error",
          error: err.message,
          url: err.config?.url,
        };
        console.log(`❌ ${endpoint}:`, results[endpoint]);
      }
    }

    setDebugInfo((prev) => ({ ...prev, endpointTests: results }));
  }, []);

  const getProductImageUrl = useCallback((product) => {
    const fallback = "product/placeholder.png";
    if (!product)
      return `https://storage.googleapis.com/furbabies-petstore/${fallback}`;
    const rawImage = product.image || product.imageUrl || fallback;
    return `https://storage.googleapis.com/furbabies-petstore/${rawImage}`;
  }, []);

  useEffect(() => {
    fetchFeaturedPets();
    fetchFeaturedProducts();
  }, [fetchFeaturedPets, fetchFeaturedProducts]);

  return (
    <div className="home-page">
      {/* ❌ Removed <Navbar /> - should be handled at App level */}
      <HeroBanner />

      {/* Debug Panel - only show in development mode */}
      {DEBUG_MODE && debugInfo && (
        <Container className="py-2">
          <Alert variant="info" className="mb-3">
            <Alert.Heading>🐛 Debug Information</Alert.Heading>
            <pre
              style={{ fontSize: "12px", maxHeight: "200px", overflow: "auto" }}
            >
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <Button
              variant="outline-info"
              size="sm"
              onClick={testApiEndpoints}
              className="mt-2"
            >
              Test API Endpoints
            </Button>
          </Alert>
        </Container>
      )}

      <Container className="py-5">
        {/* Featured Pets Section */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-paw me-2"></i>
            Featured Pets
            {loadingPets && (
              <Spinner animation="border" size="sm" className="ms-2" />
            )}
          </h2>

          {error && (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {loadingPets ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : featuredPets?.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map((pet) => (
                <Col key={pet._id} md={4}>
                  <PetCard pet={pet} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured pets available at the moment.
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={fetchFeaturedPets}
                >
                  <i className="fas fa-refresh me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">
            <i className="fas fa-shopping-cart me-2"></i>
            Featured Products
            {loadingProducts && (
              <Spinner animation="border" size="sm" className="ms-2" />
            )}
          </h2>

          {loadingProducts ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : featuredProducts?.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map((product) => (
                <Col key={product._id} md={4}>
                  <ProductCard
                    product={product}
                    imageUrl={getProductImageUrl(product)}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured products available at the moment.
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={fetchFeaturedProducts}
                >
                  <i className="fas fa-refresh me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="primary" size="lg">
                <i className="fas fa-shopping-cart me-2"></i>
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Bottom Links Section */}
        <section className="bottom-links-section py-5 mt-5">
          <div className="text-center">
            {/* Decorative Divider */}
            <div className="d-flex align-items-center justify-content-center mb-4">
              <div className="border-top flex-grow-1 mx-3"></div>
              <i className="fas fa-paw text-primary fs-4"></i>
              <div className="border-top flex-grow-1 mx-3"></div>
            </div>

            <h3 className="h4 mb-4 text-muted">
              Need More Information?
            </h3>

            {/* Quick Links */}
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Row className="g-3">
                  {/* News Link */}
                  <Col sm={6}>
                    <Link to="/news" className="text-decoration-none">
                      <Card className="h-100 border-primary border-2 shadow-sm hover-card">
                        <Card.Body className="text-center py-4">
                          <div className="mb-3">
                            <i className="fas fa-newspaper fa-2x text-primary"></i>
                          </div>
                          <Card.Title className="h5 text-primary mb-2">
                            Pet News & Articles
                          </Card.Title>
                          <Card.Text className="text-muted small">
                            Stay updated with the latest pet care tips, health news, and heartwarming stories
                          </Card.Text>
                          <div className="mt-3">
                            <span className="btn btn-outline-primary btn-sm">
                              <i className="fas fa-arrow-right me-1"></i>
                              Read Latest News
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>

                  {/* Help/Contact Link */}
                  <Col sm={6}>
                    <Link to="/contact" className="text-decoration-none">
                      <Card className="h-100 border-success border-2 shadow-sm hover-card">
                        <Card.Body className="text-center py-4">
                          <div className="mb-3">
                            <i className="fas fa-question-circle fa-2x text-success"></i>
                          </div>
                          <Card.Title className="h5 text-success mb-2">
                            Need Help?
                          </Card.Title>
                          <Card.Text className="text-muted small">
                            Have questions about adoption, pet care, or our services? We're here to help!
                          </Card.Text>
                          <div className="mt-3">
                            <span className="btn btn-outline-success btn-sm">
                              <i className="fas fa-arrow-right me-1"></i>
                              Get Support
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>

                {/* Alternative: Simple Button Links */}
                {/*
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link to="/news">
                    <Button variant="outline-primary" size="lg" className="px-4">
                      <i className="fas fa-newspaper me-2"></i>
                      Latest Pet News
                    </Button>
                  </Link>
                  
                  <Link to="/contact">
                    <Button variant="outline-success" size="lg" className="px-4">
                      <i className="fas fa-question-circle me-2"></i>
                      Need Help?
                    </Button>
                  </Link>
                </div>
                */}
              </Col>
            </Row>

            {/* Quick Help Links */}
            <div className="mt-4 pt-3 border-top">
              <p className="text-muted small mb-2">Quick Links:</p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Link to="/about" className="text-decoration-none small">
                  <i className="fas fa-info-circle me-1"></i>
                  About FurBabies
                </Link>
                <Link to="/browse" className="text-decoration-none small">
                  <i className="fas fa-search me-1"></i>
                  Browse All Pets
                </Link>
                <Link to="/products" className="text-decoration-none small">
                  <i className="fas fa-shopping-cart me-1"></i>
                  Pet Supplies
                </Link>
                <a href="tel:123-456-7890" className="text-decoration-none small">
                  <i className="fas fa-phone me-1"></i>
                  Call Us: (123) 456-7890
                </a>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Home;