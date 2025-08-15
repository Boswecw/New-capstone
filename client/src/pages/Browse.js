// src/pages/Browse.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import usePetFilters from '../hooks/usePetFilters'; // Fixed: Default import
import SafeImage from '../components/SafeImage';
import { buildPetImageUrl } from '../utils/imageUtils';
import './Browse.css';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const {
    filters,
    sortBy,
    sortOrder,
    filteredPets,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy,
    setSortOrder
  } = usePetFilters(pets); // Fixed: Using default import

  // Fetch pets data
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pets');
        if (!response.ok) {
          throw new Error('Failed to fetch pets');
        }
        const data = await response.json();
        setPets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  if (loading) {
    return (
      <div className="browse-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding your perfect companion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="browse-page error">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      {/* Hero Section */}
      <div className="browse-hero">
        <div className="hero-content">
          <h1>Find Your Perfect Companion</h1>
          <p>Browse through our wonderful pets looking for their forever homes</p>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">{filterStats.total}</span>
            <span className="stat-label">Total Pets</span>
          </div>
          <div className="stat">
            <span className="stat-number">{filterStats.available}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat">
            <span className="stat-number">{filterStats.adopted}</span>
            <span className="stat-label">Adopted</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="browse-filters">
        <div className="filters-header">
          <h3>Find Your Match</h3>
          <button 
            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            🔳 Grid
          </button>
          <button 
            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
        </div>

        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group search-group">
            <label htmlFor="pet-search">🔍 Search</label>
            <input
              id="pet-search"
              type="text"
              placeholder="Search by name, breed, or description..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Species Filter */}
          <div className="filter-group">
            <label htmlFor="species-filter">🐾 Species</label>
            <select
              id="species-filter"
              value={filters.species}
              onChange={(e) => updateFilter('species', e.target.value)}
              className="filter-select"
            >
              <option value="">All Species</option>
              {filterOptions.species.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {/* Breed Filter */}
          <div className="filter-group">
            <label htmlFor="breed-filter">🏷️ Breed</label>
            <select
              id="breed-filter"
              value={filters.breed}
              onChange={(e) => updateFilter('breed', e.target.value)}
              className="filter-select"
            >
              <option value="">All Breeds</option>
              {filterOptions.breeds.map(breed => (
                <option key={breed} value={breed}>{breed}</option>
              ))}
            </select>
          </div>

          {/* Age Filter */}
          <div className="filter-group">
            <label htmlFor="age-filter">🎂 Age</label>
            <select
              id="age-filter"
              value={filters.age}
              onChange={(e) => updateFilter('age', e.target.value)}
              className="filter-select"
            >
              <option value="">All Ages</option>
              {filterOptions.ages.map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div className="filter-group">
            <label htmlFor="size-filter">📏 Size</label>
            <select
              id="size-filter"
              value={filters.size}
              onChange={(e) => updateFilter('size', e.target.value)}
              className="filter-select"
            >
              <option value="">All Sizes</option>
              {filterOptions.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="filter-group">
            <label htmlFor="gender-filter">⚧ Gender</label>
            <select
              id="gender-filter"
              value={filters.gender}
              onChange={(e) => updateFilter('gender', e.target.value)}
              className="filter-select"
            >
              <option value="">All Genders</option>
              {filterOptions.genders.map(gender => (
                <option key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <label htmlFor="location-filter">📍 Location</label>
            <select
              id="location-filter"
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {filterOptions.locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Has Images Filter */}
          <div className="filter-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.hasImages}
                onChange={(e) => updateFilter('hasImages', e.target.checked)}
              />
              <span className="checkmark"></span>
              📸 With Photos Only
            </label>
          </div>
        </div>

        {/* Sort and Actions */}
        <div className="filters-actions">
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="species">Species</option>
              <option value="age">Age</option>
            </select>
            <button
              className={`sort-order-btn ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary reset-btn"
              onClick={resetFilters}
            >
              🔄 Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="summary-text">
          <h4>
            {filteredPets.length === 0 ? 
              'No pets found' : 
              `${filteredPets.length} ${filteredPets.length === 1 ? 'pet' : 'pets'} found`
            }
          </h4>
          {hasActiveFilters && (
            <p>Filtered from {filterStats.total} total pets</p>
          )}
        </div>
        
        <div className="summary-stats">
          <span className="stat-chip available">
            {filterStats.available} Available
          </span>
          <span className="stat-chip pending">
            {filterStats.pending} Pending
          </span>
          <span className="stat-chip with-images">
            {filterStats.withImages} With Photos
          </span>
        </div>
      </div>

      {/* Pet Results */}
      <div className={`pets-container ${viewMode}`}>
        {filteredPets.length === 0 ? (
          <div className="no-results">
            <div className="no-results-content">
              <div className="no-results-icon">🐾</div>
              <h3>No pets match your criteria</h3>
              <p>Try adjusting your filters or browse all available pets</p>
              <div className="no-results-actions">
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="btn btn-primary">
                    Clear All Filters
                  </button>
                )}
                <Link to="/pets" className="btn btn-secondary">
                  View All Pets
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="pets-results">
            {filteredPets.map(pet => (
              viewMode === 'grid' ? (
                <PetCard key={pet.id} pet={pet} />
              ) : (
                <PetListItem key={pet.id} pet={pet} />
              )
            ))}
          </div>
        )}
      </div>

      {/* Load More (if pagination needed) */}
      {filteredPets.length > 0 && filteredPets.length >= 20 && (
        <div className="load-more-container">
          <button className="btn btn-outline load-more-btn">
            Load More Pets
          </button>
        </div>
      )}
    </div>
  );
};

// Pet Card Component (Grid View)
const PetCard = ({ pet }) => {
  const imageUrl = buildPetImageUrl(pet.image, { width: 300, height: 300 });
  
  return (
    <div className="pet-card">
      <Link to={`/pets/${pet.id}`} className="pet-card-link">
        <div className="pet-card-image">
          <SafeImage
            src={imageUrl}
            alt={`${pet.name} - ${pet.species}`}
            className="pet-image"
            isPet={true}
          />
          <div className={`status-overlay ${pet.status}`}>
            {pet.status === 'available' && '✨ Available'}
            {pet.status === 'pending' && '⏳ Pending'}
            {pet.status === 'adopted' && '❤️ Adopted'}
          </div>
          {pet.featured && (
            <div className="featured-badge">⭐ Featured</div>
          )}
        </div>
        
        <div className="pet-card-content">
          <div className="pet-header">
            <h3 className="pet-name">{pet.name}</h3>
            <div className="pet-basics">
              <span className="pet-species">{pet.species}</span>
              {pet.breed && <span className="pet-breed">• {pet.breed}</span>}
            </div>
          </div>
          
          <div className="pet-details">
            <div className="detail-row">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{pet.age || 'Unknown'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{pet.size || 'Unknown'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Gender:</span>
              <span className="detail-value">{pet.gender || 'Unknown'}</span>
            </div>
          </div>

          {pet.location && (
            <div className="pet-location">
              📍 {pet.location}
            </div>
          )}

          {pet.description && (
            <div className="pet-description">
              {pet.description.length > 120 
                ? `${pet.description.substring(0, 120)}...`
                : pet.description
              }
            </div>
          )}

          <div className="pet-card-actions">
            <span className="learn-more">Learn More →</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Pet List Item Component (List View)
const PetListItem = ({ pet }) => {
  const imageUrl = buildPetImageUrl(pet.image, { width: 120, height: 120 });
  
  return (
    <div className="pet-list-item">
      <Link to={`/pets/${pet.id}`} className="pet-list-link">
        <div className="pet-list-image">
          <SafeImage
            src={imageUrl}
            alt={`${pet.name} - ${pet.species}`}
            className="pet-image"
            isPet={true}
          />
          <div className={`status-badge ${pet.status}`}>
            {pet.status}
          </div>
        </div>
        
        <div className="pet-list-content">
          <div className="pet-list-header">
            <h3 className="pet-name">{pet.name}</h3>
            <div className="pet-meta">
              {pet.species} {pet.breed && `• ${pet.breed}`} • {pet.age} • {pet.gender}
              {pet.location && ` • ${pet.location}`}
            </div>
          </div>
          
          {pet.description && (
            <div className="pet-list-description">
              {pet.description.length > 200 
                ? `${pet.description.substring(0, 200)}...`
                : pet.description
              }
            </div>
          )}
          
          <div className="pet-list-actions">
            <span className="learn-more-btn">View Details</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Browse;