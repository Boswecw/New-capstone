// client/src/pages/admin/AdminPets.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../../components/SafeImage';
import usePetFilters from '../../hooks/usePetFilters';
import { buildPetImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import './AdminPets.css';

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPets, setSelectedPets] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  console.log('🐾 AdminPets: Component rendering, pets state:', pets);

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
        setError(null);
        console.log('🐾 AdminPets: Fetching pets from API...');
        
        const response = await api.get('/admin/pets', {
          params: {
            page: 1,
            limit: 50 // Get more pets for admin view
          }
        });
        
        console.log('🐾 AdminPets: API Response status:', response.status);
        console.log('🐾 AdminPets: API Response data:', response.data);
        
        if (response.data.success && response.data.data) {
          // Handle both paginated and non-paginated responses
          const petsData = response.data.data.pets || response.data.data;
          
          if (Array.isArray(petsData)) {
            console.log('🐾 AdminPets: Extracted pets array:', petsData);
            setPets(petsData);
          } else {
            console.error('🐾 AdminPets: Expected array, got:', typeof petsData);
            setPets([]);
          }
        } else {
          console.error('🐾 AdminPets: Invalid response format:', response.data);
          setPets([]);
        }
      } catch (err) {
        console.error('🐾 AdminPets: Error fetching pets:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch pets');
        setPets([]);
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
    setSelectedPets(isSelected ? filteredPets.map(pet => pet.id || pet._id) : []);
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedPets.length === 0) return;

    setActionLoading(true);
    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedPets.length} pets?`)) {
            await api.post('/admin/pets/bulk-delete', { petIds: selectedPets });
            setPets(pets.filter(pet => !selectedPets.includes(pet.id || pet._id)));
            setSelectedPets([]);
          }
          break;
        case 'adopt':
          await api.post('/admin/pets/bulk-update', {
            petIds: selectedPets,
            updates: { status: 'adopted' }
          });
          setPets(pets.map(pet => 
            selectedPets.includes(pet.id || pet._id) 
              ? { ...pet, status: 'adopted' }
              : pet
          ));
          setSelectedPets([]);
          break;
        case 'available':
          await api.post('/admin/pets/bulk-update', {
            petIds: selectedPets,
            updates: { status: 'available' }
          });
          setPets(pets.map(pet => 
            selectedPets.includes(pet.id || pet._id) 
              ? { ...pet, status: 'available' }
              : pet
          ));
          setSelectedPets([]);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert(err.response?.data?.message || 'Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-pets loading">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading pets...</span>
            </div>
            <p className="mt-3 text-muted">Loading pets data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-pets error">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error Loading Pets
                  </h4>
                </div>
                <div className="card-body text-center">
                  <p className="card-text mb-3">{error}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-sync me-2"></i>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🐾 AdminPets: Final render state:', {
    petsCount: pets.length,
    filteredCount: filteredPets.length,
    selectedCount: selectedPets.length,
    hasFilters: hasActiveFilters
  });

  return (
    <div className="admin-pets">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h1 className="h3 mb-0">
              <i className="fas fa-paw me-2 text-primary"></i>
              Manage Pets
            </h1>
            <p className="text-muted">
              {filterStats.total} total pets, {filterStats.filtered} displayed
            </p>
          </div>
          <div className="col-md-6 text-end">
            <Link to="/admin/pets/new" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Add New Pet
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small text-muted">Species</label>
                    <select
                      className="form-select"
                      value={filters.species}
                      onChange={(e) => updateFilter('species', e.target.value)}
                    >
                      <option value="">All Species</option>
                      {filterOptions.species.map(species => (
                        <option key={species} value={species}>{species}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted">Status</label>
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="adopted">Adopted</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, breed, or description..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small text-muted">Sort</label>
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="species">Species</option>
                    </select>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <div className="row mt-3">
                    <div className="col-12">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={resetFilters}
                      >
                        <i className="fas fa-times me-1"></i>
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPets.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>{selectedPets.length}</strong> pets selected
                  </span>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleBulkAction('available')}
                      disabled={actionLoading}
                    >
                      Mark Available
                    </button>
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleBulkAction('adopt')}
                      disabled={actionLoading}
                    >
                      Mark Adopted
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleBulkAction('delete')}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pets Table */}
        {filteredPets.length === 0 ? (
          <div className="no-pets">
            <div className="no-pets-content text-center py-5">
              <i className="fas fa-paw fa-3x text-muted mb-3"></i>
              <h3>No pets found</h3>
              <p className="text-muted">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.'
                  : 'No pets have been added yet.'
                }
              </p>
              {!hasActiveFilters && (
                <Link to="/admin/pets/new" className="btn btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Add Your First Pet
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedPets.length === filteredPets.length && filteredPets.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.map(pet => (
                  <tr key={pet.id || pet._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPets.includes(pet.id || pet._id)}
                        onChange={(e) => handlePetSelection(pet.id || pet._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="pet-image-thumb">
                        <SafeImage
                          src={pet.imageUrl || buildPetImageUrl(pet.image)}
                          alt={pet.name}
                          entityType="pet"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <Link to={`/admin/pets/${pet.id || pet._id}`} className="pet-name-link">
                        <strong>{pet.name}</strong>
                      </Link>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {pet.species || pet.type}
                      </span>
                    </td>
                    <td>{pet.breed}</td>
                    <td>{pet.age}</td>
                    <td>
                      <span className={`badge ${
                        pet.status === 'available' ? 'bg-success' :
                        pet.status === 'pending' ? 'bg-warning text-dark' :
                        pet.status === 'adopted' ? 'bg-secondary' : 'bg-light text-dark'
                      }`}>
                        {pet.status}
                      </span>
                    </td>
                    <td>
                      {new Date(pet.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/admin/pets/${pet.id || pet._id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                          title="Edit Pet"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <Link 
                          to={`/pets/${pet.id || pet._id}`}
                          className="btn btn-sm btn-outline-secondary"
                          title="View Pet"
                          target="_blank"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPets;