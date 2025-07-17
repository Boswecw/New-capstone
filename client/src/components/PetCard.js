// client/src/components/PetCard.js - Updated with optimized image handling

import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProxyImage from './ProxyImage';
import styles from './Card.module.css';

const PetCard = ({ pet, className = "" }) => {
  if (!pet) {
    return (
      <Card className={`${styles.card} ${className} h-100`}>
        <div className={styles.cardImgContainer}>
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

  // Format age display
  const formatAge = (age) => {
    if (!age) return 'Age unknown';
    
    if (typeof age === 'string') {
      return age;
    }
    
    if (typeof age === 'number') {
      if (age < 1) {
        const months = Math.floor(age * 12);
        return `${months} month${months !== 1 ? 's' : ''}`;
      }
      return `${age} year${age !== 1 ? 's' : ''}`;
    }
    
    return 'Age unknown';
  };

  // Get status badge info
  const getStatusInfo = () => {
    const status = pet.status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'available':
        return { 
          text: 'Available', 
          variant: 'success',
          className: styles.statusBadge + ' ' + styles.available
        };
      case 'adopted':
        return { 
          text: 'Adopted', 
          variant: 'warning',
          className: styles.statusBadge + ' ' + styles.adopted
        };
      case 'pending':
        return { 
          text: 'Pending', 
          variant: 'info',
          className: styles.statusBadge + ' ' + styles.pending
        };
      case 'unavailable':
        return { 
          text: 'Unavailable', 
          variant: 'danger',
          className: styles.statusBadge + ' ' + styles.unavailable
        };
      default:
        return { 
          text: 'Unknown', 
          variant: 'secondary',
          className: styles.statusBadge
        };
    }
  };

  // Get species icon
  const getSpeciesIcon = () => {
    const species = pet.species?.toLowerCase() || '';
    const icons = {
      'dog': 'fas fa-dog',
      'cat': 'fas fa-cat',
      'fish': 'fas fa-fish',
      'bird': 'fas fa-dove',
      'rabbit': 'fas fa-rabbit',
      'hamster': 'fas fa-mouse',
      'guinea pig': 'fas fa-mouse',
      'reptile': 'fas fa-dragon',
      'other': 'fas fa-paw'
    };
    
    return icons[species] || icons['other'];
  };

  const statusInfo = getStatusInfo();
  const speciesIcon = getSpeciesIcon();
  const isAvailable = pet.status?.toLowerCase() === 'available';

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      {/* Image Container with Status Badge */}
      <div className={styles.petImgContainer}>
        <ProxyImage
          item={pet}
          category={pet.species?.toLowerCase() || 'pet'}
          alt={`${pet.name} - ${pet.breed || pet.species}`}
          size="card-md"
          className={styles.petImg}
          containerStyle={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '0'
          }}
          priority={false}
          lazy={true}
        />
        
        {/* Status Badge */}
        <div className={statusInfo.className}>
          {statusInfo.text}
        </div>
        
        {/* Species Icon */}
        <div className="position-absolute bottom-0 start-0 p-2">
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <i className={`${speciesIcon} text-primary`} style={{ fontSize: '14px' }}></i>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <Card.Body className={styles.cardBody}>
        <div className="d-flex flex-column h-100">
          {/* Header */}
          <div className="mb-2">
            <Card.Title className={styles.cardTitle}>
              {pet.name}
            </Card.Title>
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
                    <i className={`ms-1 fas fa-${pet.gender.toLowerCase() === 'male' ? 'mars' : 'venus'}`} 
                       style={{ color: pet.gender.toLowerCase() === 'male' ? '#007bff' : '#e91e63' }}></i>
                  )}
                </strong>
              </div>
            </div>

            {pet.size && (
              <div className="mb-2">
                <small className="text-muted d-block">Size</small>
                <strong className="text-dark">{pet.size}</strong>
              </div>
            )}

            {pet.description && (
              <Card.Text className={styles.cardText}>
                {pet.description}
              </Card.Text>
            )}

            {/* Special Badges */}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {pet.goodWithKids && (
                <Badge bg="success" className="small">
                  <i className="fas fa-child me-1"></i>
                  Good with kids
                </Badge>
              )}
              {pet.goodWithPets && (
                <Badge bg="info" className="small">
                  <i className="fas fa-paw me-1"></i>
                  Good with pets
                </Badge>
              )}
              {pet.spayed && (
                <Badge bg="secondary" className="small">
                  <i className="fas fa-check me-1"></i>
                  Spayed/Neutered
                </Badge>
              )}
              {pet.vaccinated && (
                <Badge bg="primary" className="small">
                  <i className="fas fa-syringe me-1"></i>
                  Vaccinated
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.cardFooter}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div>
                {pet.location && (
                  <small className="text-muted">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {pet.location}
                  </small>
                )}
              </div>
              
              <div className="d-flex gap-2">
                <Link
                  to={`/pets/${pet._id}`}
                  className={`${styles.cardButton} ${styles.secondary}`}
                  style={{ textDecoration: 'none' }}
                >
                  <i className="fas fa-info-circle me-1"></i>
                  Details
                </Link>
                
                {isAvailable && (
                  <Link
                    to={`/adopt/${pet._id}`}
                    className={styles.cardButton}
                    style={{ textDecoration: 'none' }}
                  >
                    <i className="fas fa-heart me-1"></i>
                    Adopt
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PetCard;