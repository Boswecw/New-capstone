// src/pages/admin/AdminPets.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import usePetFilters from '../../hooks/usePetFilters';
import { 
  getOptimizedImageUrl,
  hasValidImageExtension
} from '../../utils/imageUtils';
import './AdminPets.css';

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPets, setSelectedPets] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    filters,
    sortBy,
    filteredPets,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy
  } = usePetFilters(pets, { status: '' }); // Show all statuses by default in admin

  // Fetch pets data
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/pets', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
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

  // Handle pet selection for bulk actions
  const handlePetSelection = (petId, isSelected) => {
    setSelectedPets(prev => 
      isSelected 
        ? [...prev, petId]
        : prev.filter(id => id !== petId)
    );
  };

  // Handle select all pets
  const handleSelectAll = (isSelected) => {
    setSelectedPets(isSelected ? filteredPets.map(pet => pet.id) : []);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedPets.length === 0) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/pets/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          petIds: selectedPets,
          updates: { status: newStatus }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update pets');
      }

      // Refresh pets data
      const updatedResponse = await fetch('/api/admin/pets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const updatedData = await updatedResponse.json();
      setPets(updatedData);
      setSelectedPets([]);
      
      alert(`Successfully updated ${selectedPets.length} pet(s) to ${newStatus}`);
    } catch (err) {
      alert(`Error updating pets: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPets.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPets.length} pet(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/pets/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ petIds: selectedPets })
      });

      if (!response.ok) {
        throw new Error('Failed to delete pets');
      }

      // Remove deleted pets from state
      setPets(prev => prev.filter(pet => !selectedPets.includes(pet.id)));
      setSelectedPets([]);
      
      alert(`Successfully deleted ${selectedPets.length} pet(s)`);
    } catch (err) {
      alert(`Error deleting pets: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-pets loading">
        <div className="loading-spinner">Loading pets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-pets error">
        <div className="error-message">
          <h2>Error Loading Pets</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pets">
      <div className="admin-pets-header">
        <div className="header-content">
          <h1>Manage Pets</h1>
          <p>Add, edit, and manage all pets in the system</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/pets/new" className="btn btn-primary">
            ➕ Add New Pet
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="admin-filters">
        <div className="filters-row">
          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search pets..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Species Filter */}
          <div className="filter-group">
            <label>Species</label>
            <select
              value={filters.species}
              onChange={(e) => updateFilter('species', e.target.value)}
            >
              <option value="">All Species</option>
              {filterOptions.species.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          <div className="filter-group">
            <label>Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
              <option value="species">Species</option>
              <option value="updated">Last Updated</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPets.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-actions-info">
            <span>{selectedPets.length} pet(s) selected</span>
          </div>
          <div className="bulk-actions-buttons">
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('available')}
              disabled={actionLoading}
            >
              Mark Available
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('adopted')}
              disabled={actionLoading}
            >
              Mark Adopted
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleBulkStatusUpdate('pending')}
              disabled={actionLoading}
            >
              Mark Pending
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {filterStats.filtered} of {filterStats.total} pets
          {hasActiveFilters && ' (filtered)'}
        </p>
        <div className="stats">
          <span className="stat available">
            {filterStats.available} Available
          </span>
          <span className="stat pending">
            {filterStats.pending} Pending
          </span>
          <span className="stat adopted">
            {filterStats.adopted} Adopted
          </span>
        </div>
      </div>

      {/* Pets Table */}
      <div className="pets-table-container">
        {filteredPets.length === 0 ? (
          <div className="no-pets-message">
            <h3>No pets found</h3>
            <p>Try adjusting your filters or add a new pet.</p>
            <Link to="/admin/pets/new" className="btn btn-primary">
              Add New Pet
            </Link>
          </div>
        ) : (
          <table className="pets-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedPets.length === filteredPets.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th>Species</th>
                <th>Breed</th>
                <th>Age</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPets.map(pet => (
                <AdminPetRow
                  key={pet.id}
                  pet={pet}
                  isSelected={selectedPets.includes(pet.id)}
                  onSelect={(isSelected) => handlePetSelection(pet.id, isSelected)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Admin Pet Row Component
const AdminPetRow = ({ pet, isSelected, onSelect }) => {
  const imageUrl = getOptimizedImageUrl(pet.image, { width: 60, height: 60 });
  
  return (
    <tr className={`pet-row ${isSelected ? 'selected' : ''}`}>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </td>
      <td>
        <div className="pet-image-cell">
          <SafeImage
            src={imageUrl}
            alt={pet.name}
            className="pet-thumbnail"
            isPet={true}
          />
          {!hasValidImageExtension(pet.image) && (
            <span className="no-image-indicator" title="No valid image">
              📷
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="pet-name-cell">
          <strong>{pet.name}</strong>
          {pet.microchipId && (
            <small>ID: {pet.microchipId}</small>
          )}
        </div>
      </td>
      <td>{pet.species}</td>
      <td>{pet.breed}</td>
      <td>{pet.age}</td>
      <td>
        <span className={`status-badge ${pet.status}`}>
          {pet.status}
        </span>
      </td>
      <td>
        <small>
          {new Date(pet.createdAt).toLocaleDateString()}
        </small>
      </td>
      <td>
        <div className="action-buttons">
          <Link
            to={`/admin/pets/${pet.id}`}
            className="btn btn-sm btn-primary"
            title="Edit Pet"
          >
            ✏️
          </Link>
          <Link
            to={`/pets/${pet.id}`}
            className="btn btn-sm btn-secondary"
            title="View Pet"
            target="_blank"
          >
            👁️
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default AdminPets;