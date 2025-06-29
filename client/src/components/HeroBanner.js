// client/src/components/HeroBanner.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { getBrandLogo } from "../utils/imageUtils";

/**
 * Reusable HeroBanner component
 * Maintains exact styling while providing flexibility for different pages
 */
const HeroBanner = ({
  title = "FurBabies",
  subtitle = "Your One Stop Pet Super Store",
  showLogo = true,
  showPawIcon = true,
  showHeartIcon = true,
  buttonText = null,
  buttonLink = null,
  buttonIcon = null,
  customContent = null,
  className = "",
  titleIcon = "fas fa-paw",
  subtitleIcon = "fas fa-heart",
  logoSize = "medium",
  ...props
}) => {
  const handleImageError = (e) => {
    // Fallback to smaller logo if large version fails
    e.target.src = getBrandLogo("medium");
  };

  return (
    <section className={`furbabies-banner ${className}`} {...props}>
      <Container>
        <Row className="justify-content-center align-items-center">
          <Col xs={12} md={10}>
            <div className="hero-content">
              {/* Hero Title */}
              <h1 className="hero-title">
                {showPawIcon && <i className={`${titleIcon} me-2`}></i>}
                {title}
                {showLogo && (
                  <img
                    src={getBrandLogo(logoSize)}
                    alt="FurBabies icon"
                    className="hero-icon ms-2"
                    onError={handleImageError}
                  />
                )}
              </h1>

              {/* Hero Subtitle */}
              {subtitle && (
                <p className="hero-subtitle">
                  {showHeartIcon && <i className={`${subtitleIcon} me-2`}></i>}
                  {subtitle}
                </p>
              )}

              {/* Call-to-Action Button */}
              {buttonText && buttonLink && (
                <Link
                  to={buttonLink}
                  className="btn btn-lg btn-light px-4 py-2"
                >
                  {buttonIcon && <i className={`${buttonIcon} me-2`}></i>}
                  {buttonText}
                </Link>
              )}

              {/* Custom Content Slot */}
              {customContent && (
                <div className="hero-custom-content">{customContent}</div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

HeroBanner.propTypes = {
  // Text content
  title: PropTypes.string,
  subtitle: PropTypes.string,

  // Icon visibility
  showLogo: PropTypes.bool,
  showPawIcon: PropTypes.bool,
  showHeartIcon: PropTypes.bool,

  // Icon customization
  titleIcon: PropTypes.string,
  subtitleIcon: PropTypes.string,
  logoSize: PropTypes.oneOf(["small", "medium", "large", "hero"]),

  // Button configuration
  buttonText: PropTypes.string,
  buttonLink: PropTypes.string,
  buttonIcon: PropTypes.string,

  // Advanced customization
  customContent: PropTypes.node,
  className: PropTypes.string,
};

export default HeroBanner;
