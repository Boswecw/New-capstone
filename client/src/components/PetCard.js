// client/src/components/PetCard.js
import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/image';
import styles from './Card.module.css';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop&q=80';

const PetCard = ({ pet }) => {
  const [containerType, setContainerType] = useState('square');
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageSrc =
    normalizeImageUrl(pet?.image || pet?.imageUrl) || FALLBACK_IMG;

  const handleImageLoad = (e) => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      let detectedType = 'square';
      if (aspectRatio > 1.5) {
        detectedType = 'landscape';
      } else if (aspectRatio < 0.6) {
        detectedType = 'tall';
      } else if (aspectRatio < 0.8) {
        detectedType = 'portrait';
      }

      setContainerType(detectedType);
      console.log(
        `🖼️ Pet "${pet?.name}" - Aspect ratio: ${aspectRatio.toFixed(
          2
        )}, Container: ${detectedType}`
      );
    }
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    e.currentTarget.src = FALLBACK_IMG;
    setImageLoaded(true);
  };

  return (
    <Card className={`${styles.enhancedCard} h-100`}>
      <div className={`${styles.petImgContainer} ${styles[containerType]}`}>
        <img
          src={imageSrc}
          alt={pet?.name || 'Pet'}
          className={`${styles.petImg} ${!imageLoaded ? styles.loading : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {!imageLoaded && (
          <div className={styles.imageError} aria-live="polite">
            <i className="fas fa-paw" aria-hidden="true"></i>
            <span>Loading...</span>
          </div>
        )}
      </div>

      <Card.Body className={styles.enhancedCardBody}>
        <Card.Title className={styles.enhancedCardTitle}>
          {pet?.name || 'Unnamed Pet'}
        </Card.Title>

        <div className={styles.enhancedBadges}>
          <Badge className={styles.enhancedBadge} bg="info">
            {pet?.type || 'Pet'}
          </Badge>
          {pet?.breed && (
            <Badge className={styles.enhancedBadge} bg="secondary">
              {pet.breed}
            </Badge>
          )}
          {pet?.featured && (
            <Badge className={styles.enhancedBadge} bg="warning" text="dark">
              <i className="fas fa-star me-1" aria-hidden="true"></i>
              Featured
            </Badge>
          )}
          {pet?.status && (
            <Badge
              className={styles.enhancedBadge}
