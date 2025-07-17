// client/src/components/PetCard.js

import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import styles from './Card.module.css';
import classNames from 'classnames';

const PetCard = ({ pet, className = "", fitMode = "contain" }) => {
  if (!pet) {
    return (
      <Card className={`${styles.card} ${className} h-100`}>
        <div className={styles.petImgContainer}>
          <div className="text-center text-muted p-4">
            <i className="fas fa-paw fa-2x mb-2" style={{ color: '#dee2e6' }}></i>
            <p className="mb-0">Pet information unavailable</p>
          </div>
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>Pet Not Found</Card.Title>
          <Card.Text className={styles.cardText}>
            This pet's information is currently unavailable.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // 🕒 Format age display
  const formatAge = (age) => {
    if (!age) return 'Age unknown';
    if (typeof age === 'string') return age;
    if (typeof age === 'number') {
      if (age < 1) {
        const months = Math.floor(age * 12);
        return `${months} month${months !== 1 ? 's' : ''}`;
      }
      return `${age} year${age !== 1 ? 's' : ''}`;
    }
    return 'Age unknown';
  };

  // 🟢 Status badge details
  const getStatusInfo = () => {
    const status = pet.status?.toLowerCase() || 'unknown';
    const badgeStyles = {
      available: styles.available,
      adopted: styles.adopted,
      pending: styles.pending,
      unavailable: styles.unavailable,
    };
    const textMap = {
      available: 'Available',
      adopted: 'Adopted',
      pending: 'Pending',
      unavailable: 'Unavailable',
    };

    return {
      text: textMap[status] || 'Unknown',
      className: `${styles.statusBadge} ${badgeStyles[status] || ''}`,
    };
  };

  // 🐾 Species icon
  const getSpeciesIcon = () => {
    const species = pet.species?.toLowerCase() || '';
    const icons = {
      dog: 'fas fa-dog',
      cat: 'fas fa-cat',
      fish: 'fas fa-fish',
      bird: 'fas fa-dove',
      rabbit: 'fas fa-rabbit',
      hamster: 'fas fa-mouse',
      'guinea pig': 'fas fa-mouse',
      reptile: 'fas fa-dragon',
    };
    return icons[species] || 'fas fa-paw';
  };

  const statusInfo = getStatusInfo();
  const speciesIcon = getSpeciesIcon();
  const isAvailable = pet.status?.toLowerCase() === 'available';

  const imageClass = classNames(styles.petImg, {
    [styles['fit-contain']]: fitMode === 'contain',
    [styles['fit-cover']]: fitMode === 'cover',
    [styles['fit-fill']]: fitMode === 'fill',
    [styles['fit-scale-down']]: fitMode === 'scale-down',
  });

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      <div className={styles.petImgContainer}>
        <SafeImage
          item={pet}
          category={pet.species?.toLowerCase() || 'pet'}
          alt={`${pet.name} - ${pet.breed || pet.species}`}
          className={imageClass}
          showSpinner
          onLoad={() => console.log(`✅ Pet image loaded for: ${pet.name}`)}
          onError={() => console.warn(`❌ Pet image failed for: ${pet.name}`)}
        />

        {/* Status Badge */}
        <div className={statusInfo.className}>{statusInfo.text}</div>

        {/* Species Icon */}
        <div className="position-absolute bottom-0 start-0 p-2">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}
          >
            <i className={`${speciesIcon} text-primary`} style={{ fontSize: 14 }} />
          </div>
        </div>
      </div>

      <Card.Body className={styles.cardBody}>
        <div className="d-flex flex-column h-100">
          <div className="mb-2">
            <Card.Title className={styles.cardTitle}>{pet.name}</Card.Title>
            {pet.breed && (
              <Card.Subtitle className={`${styles.cardSubtitle} text-muted`}>
                {pet.breed}
              </Card.Subtitle>
            )}
          </div>

          {/* Pet Details */}
          <div className="mb-3 flex-grow-1">
            <div className="row g-2 mb-2">
              <div className="col-6">
                <small className="text-muted d-block">Age</small>
                <strong className="text-dark">{formatAge(pet.age)}</strong>
              </div>
              <div className="col-6">
                <small className="text-muted d-block">Gender</small>
                <strong className="text-dark">
                  {pet.gender || 'Unknown'}
                  {pet.gender && (
                    <i
                      className={`ms-1 fas fa-${pet.gender.toLowerCase() === 'male' ? 'mars' : 'venus'}`}
                      style={{ color: pet.gender.toLowerCase() === 'male' ? '#4a90e2' : '#e24a90' }}
                    />
                  )}
                </strong>
              </div>
            </div>

            {pet.size && (
              <div className="mb-2">
                <small className="text-muted d-block">Size</small>
                <strong className="text-dark text-capitalize">{pet.size}</strong>
              </div>
            )}

            {pet.location && (
              <div className="mb-2">
                <small className="text-muted d-block">Location</small>
                <strong className="text-dark">
                  <i className="fas fa-map-marker-alt me-1 text-primary"></i>
                  {pet.location}
                </strong>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link
              to={`/pets/${pet._id}`}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
            >
              {isAvailable ? (
                <>
                  <i className="fas fa-heart me-2"></i>
                  Meet {pet.name}
                </>
              ) : (
                <>
                  <i className="fas fa-info-circle me-2"></i>
                  View Details
                </>
              )}
            </Link>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;
