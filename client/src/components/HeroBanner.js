// client/src/components/HeroBanner.js - UPDATED for Home Page Integration with FIX

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import './HeroBanner.css';

const HeroBanner = ({
  title = "Find Your Perfect Companion",
  subtitle = "Discover loving pets looking for their forever homes and find everything you need to keep them happy and healthy.",
  showLogo = true,
  showHeartIcon = true,
  primaryButtonText = "Find a Pet",
  primaryButtonLink = "/browse",
  primaryButtonIcon = "fas fa-search",
  secondaryButtonText = "Shop Products", 
  secondaryButtonLink = "/products",
  secondaryButtonIcon = "fas fa-shopping-cart",
  customContent = null,
  className = "",
  subtitleIcon = "fas fa-heart",
  variant = "default", // "default", "home", "simple"
  backgroundGradient = "linear-gradient(135deg, #007bff 0%, #6f42c1 50%, #fd7e14 100%)",
  minHeight = "400px",
  showStats = false,
  stats = { pets: 0, products: 0, adoptions: 0 },
  ...props
}) => {
  const furBabiesIconUrl =
    "https://storage.googleapis.com/furbabies-petstore/brand/FurBabiesicon.png";

  const handleImageError = (e) => {
    e.target.src = "/images/brand/FurBabiesicon.png"; // fallback
  };

  // Different variants for different page needs - TRULY DROP-IN VERSION
  const getVariantStyles = () => {
    switch (variant) {
      case "home":
        return {
          background: backgroundGradient,
          minHeight: minHeight,
          color: "#ffffff"
        };
      case "simple":
        return {
          background: "#228b22", // turf green
          minHeight: "200px",
          color: "#ffffff"
        };
      default:
        return {
          background: backgroundGradient,
          minHeight: minHeight,
          color: "#ffffff"
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <section 
      className={`furbabies-banner ${className}`} 
      style={variantStyles}
      {...props}
    >
      <Container className="h-100">
        <Row className="justify-content-center align-items-center h-100 text-center">
          <Col xs={12} lg={variant === "home" ? 8 : 10}>
            {/* FurBabies Icon */}
            {showLogo && (
              <img
                src={furBabiesIconUrl}
                alt="FurBabies icon"
                onError={handleImageError}
                className={`hero-icon ${variant === "home" ? "bounce-energetic" : "bounce-loop"}`}
                style={{
                  maxHeight: variant === "home" ? "120px" : "100px",
                  marginBottom: variant === "home" ? "2rem" : "1.5rem"
                }}
              />
            )}

            {/* Main Title */}
            {title && (
              <h1 className={`${variant === "home" ? "display-4" : "display-5"} fw-bold mb-4 hero-title`}>
                {title}
              </h1>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className={`${variant === "home" ? "lead" : "hero-subtitle"} mb-4`}>
                {showHeartIcon && <i className={`${subtitleIcon} me-2`}></i>}
                {subtitle}
              </p>
            )}

            {/* Action Buttons */}
            <div className="hero-buttons mb-4">
              {primaryButtonText && primaryButtonLink && (
                <Link 
                  to={primaryButtonLink} 
                  className="btn btn-lg btn-light px-4 py-3 me-3 mb-3 hero-btn-primary"
                >
                  {primaryButtonIcon && <i className={`${primaryButtonIcon} me-2`}></i>}
                  {primaryButtonText}
                </Link>
              )}

              {secondaryButtonText && secondaryButtonLink && (
                <Link 
                  to={secondaryButtonLink} 
                  className="btn btn-lg btn-outline-light px-4 py-3 mb-3 hero-btn-secondary"
                >
                  {secondaryButtonIcon && <i className={`${secondaryButtonIcon} me-2`}></i>}
                  {secondaryButtonText}
                </Link>
              )}
            </div>

            {/* Statistics Row (for home page) */}
            {showStats && variant === "home" && (
              <Row className="justify-content-center mt-5">
                <Col md={4} className="text-center mb-3">
                  <div className="hero-stat">
                    <h3 className="display-6 fw-bold mb-1">{stats.pets || 0}</h3>
                    <p className="mb-0">Pets Available</p>
                  </div>
                </Col>
                <Col md={4} className="text-center mb-3">
                  <div className="hero-stat">
                    <h3 className="display-6 fw-bold mb-1">{stats.products || 0}</h3>
                    <p className="mb-0">Products in Store</p>
                  </div>
                </Col>
                <Col md={4} className="text-center mb-3">
                  <div className="hero-stat">
                    <h3 className="display-6 fw-bold mb-1">{stats.adoptions || 0}</h3>
                    <p className="mb-0">Happy Adoptions</p>
                  </div>
                </Col>
              </Row>
            )}

            {/* Custom Content */}
            {customContent && (
              <div className="hero-custom-content mt-4">{customContent}</div>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

HeroBanner.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showLogo: PropTypes.bool,
  showHeartIcon: PropTypes.bool,
  subtitleIcon: PropTypes.string,
  primaryButtonText: PropTypes.string,
  primaryButtonLink: PropTypes.string,
  primaryButtonIcon: PropTypes.string,
  secondaryButtonText: PropTypes.string,
  secondaryButtonLink: PropTypes.string,
  secondaryButtonIcon: PropTypes.string,
  customContent: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "home", "simple"]),
  backgroundGradient: PropTypes.string,
  minHeight: PropTypes.string,
  showStats: PropTypes.bool,
  stats: PropTypes.shape({
    pets: PropTypes.number,
    products: PropTypes.number,
    adoptions: PropTypes.number
  })
};

export default HeroBanner;