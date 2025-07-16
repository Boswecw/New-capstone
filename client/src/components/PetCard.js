// client/src/components/PetCard.js - UPDATED VERSION
import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";
import { getCardImageProps } from "../utils/imageUtils";

const PetCard = ({ pet, priority = false }) => {
  const imageProps = getCardImageProps(pet, "medium");

  const daysSincePosted = pet.createdAt
    ? Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
    : null;

  const TestImageComponent = () => {
    const testUrls = [
      "https://storage.googleapis.com/furbabies-petstore/pets/dog1.jpg",
      "https://storage.googleapis.com/furbabies-petstore/products/food1.jpg",
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80",
    ];

    return (
      <div>
        <h4>Image Loading Test</h4>
        {testUrls.map((url, i) => (
          <div key={i} style={{ margin: "10px 0" }}>
            <p>Testing: {url}</p>
            <img
              src={url}
              alt={`Test ${i}`}
              style={{ width: "200px", height: "150px", objectFit: "cover" }}
              onLoad={() => console.log(`✅ Loaded: ${url}`)}
              onError={() => console.log(`❌ Failed: ${url}`)}
            />
          </div>
        ))}
      </div>
    );
  };
  return (
    <Card className="h-100 shadow-sm">
      <div
        className="position-relative"
        style={{ height: "250px", overflow: "hidden" }}
      >
        <SafeImage
          src={imageProps.src}
          alt={imageProps.alt}
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
          showSpinner={true}
        />

        {/* Badges */}
        <div className="position-absolute top-0 end-0 p-2">
          {pet.featured && (
            <Badge bg="warning" className="me-1">
              <i className="fas fa-star"></i> Featured
            </Badge>
          )}
          {daysSincePosted !== null && daysSincePosted <= 7 && (
            <Badge bg="success">
              <i className="fas fa-clock"></i> New
            </Badge>
          )}
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-primary mb-2">
          <i className="fas fa-paw me-1"></i>
          {pet.name || "Unnamed Pet"}
        </Card.Title>

        <div className="mb-2">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            {pet.breed} • {pet.age} • {pet.size}
          </small>
        </div>

        <Card.Text className="flex-grow-1">
          {pet.description
            ? pet.description.substring(0, 100) +
              (pet.description.length > 100 ? "..." : "")
            : "A wonderful pet looking for a loving home."}
        </Card.Text>

        <div className="mt-auto">
          <Link to={`/pets/${pet._id}`} className="btn btn-primary w-100">
            <i className="fas fa-heart me-1"></i>
            Learn More
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
