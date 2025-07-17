// client/src/components/PetCard.js - Updated for perfect image sizing

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
      {/* Enhanced Image Container with Perfect Sizing */}
      <div className={styles.petImgContainer}>
        <ProxyImage
          item={pet}
          category={pet.species?.toLowerCase() || 'pet'}
          alt={`${pet.name} - ${pet.breed || pet.species}`}
          size="card-md"
          className={`${styles.petImg} ${styles.cover}`}
          containerStyle={{ 
            width: '100%', 
            height: '100%'
          }}
          priority={false}
          lazy={true}
          fallbackType="unsplash"
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
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)'
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
                       style={{ color: pet.gender.toLowerCase() === 'male' ? '#007bff' : '#e83e8c' }}></i>
                  )}
                </strong>
              </div>
            </div>
            
            {/* Description */}
            {pet.description && (
              <Card.Text className={styles.cardText}>
                {pet.description}
              </Card.Text>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link 
              to={`/pets/${pet._id}`} 
              className="btn btn-outline-primary w-100"
              style={{
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {isAvailable ? (
                <>
                  <i className="fas fa-heart me-2"></i>
                  Learn More
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