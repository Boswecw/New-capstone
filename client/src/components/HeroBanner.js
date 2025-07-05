// client/src/components/HeroBanner.js

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import './HeroBanner.css';

const HeroBanner = ({
  subtitle = "Your One Stop Pet Super Store",
  showLogo = true,
  showHeartIcon = true,
  buttonText = null,
  buttonLink = null,
  buttonIcon = null,
  customContent = null,
  className = "",
  subtitleIcon = "fas fa-heart",
  ...props
}) => {
  const furBabiesIconUrl =
    "https://storage.googleapis.com/furbabies-petstore/brand/FurBabieicon.png";

  const handleImageError = (e) => {
    e.target.src = "/images/brand/FurBabiesicon.png"; // fallback
  };

  return (
    <section className={`furbabies-banner ${className}`} {...props}>
      <Container>
        <Row className="justify-content-center text-center">
          <Col xs={12} md={10}>
            {/* FurBabies Icon */}
            {showLogo && (
              <img
                src={furBabiesIconUrl}
                alt="FurBabies icon"
                onError={handleImageError}
                className="hero-icon bounce-loop"
              />
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className="hero-subtitle">
                {showHeartIcon && <i className={`${subtitleIcon} me-2`}></i>}
                {subtitle}
              </p>
            )}

            {/* Call-to-Action Button */}
            {buttonText && buttonLink && (
              <Link to={buttonLink} className="btn btn-lg btn-light px-4 py-2">
                {buttonIcon && <i className={`${buttonIcon} me-2`}></i>}
                {buttonText}
              </Link>
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
  subtitle: PropTypes.string,
  showLogo: PropTypes.bool,
  showHeartIcon: PropTypes.bool,
  subtitleIcon: PropTypes.string,
  buttonText: PropTypes.string,
  buttonLink: PropTypes.string,
  buttonIcon: PropTypes.string,
  customContent: PropTypes.node,
  className: PropTypes.string,
};

export default HeroBanner;
