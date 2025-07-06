import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize, formatFileSize } from '../utils/bucketUtils';

const Browse = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [bucketImages, setBucketImages] = useState([]);
  const [selectedBucket] = useState('furbabies-petstore');
  // Fixed: Now both selectedFolder and setSelectedFolder are used
  const [selectedFolder, setSelectedFolder] = useState(bucketFolders.PET);
  const availableFolders = Object.values(bucketFolders);
  const [filters, setFilters] = useState({
    type: 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: 'newest',
    available: '',
    featured: ''
  });

  // Parse URL parameters and update filters
  useEffect(() => {
    const parseUrlParams = () => {
      const queryParams = new URLSearchParams(location.search);
      const newFilters = {
        type: queryParams.get('type') || 'all',
        size: queryParams.get('size') || '',
        minPrice: queryParams.get('minPrice') || '',
        maxPrice: queryParams.get('maxPrice') || '',
        search: queryParams.get('search') || '',
        sort: queryParams.get('sort') || 'newest',
        available: queryParams.get('available') || '',
        featured: queryParams.get('featured') || ''
      };
      
      console.log('🔍 Parsed URL params:', newFilters);
      setFilters(newFilters);
    };

    parseUrlParams();
  }, [location.search]);

  // Fetch pets when filters change
  useEffect(() => {
    const fetchPets = async () => {
      console.log('🐾 Fetching pets with filters:', filters);
      setLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams();
        
        // Add all non-empty filter parameters
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all' && value !== '') {
            params.append(key, value);
          }
        });
        
        console.log('🔗 API call: /pets?' + params.toString());
        const response = await api.get(`/pets?${params.toString()}`);
        
        console.log('📊 API response:', response.data);
        
        if (response.data.success) {
          setPets(response.data.data || []);
        } else {
          setPets([]);
          setError('No pets found matching your criteria');
        }
      } catch (error) {
        console.error('❌ Error fetching pets:', error);
        setError(`Error fetching pets: ${error.response?.data?.message || error.message}`);
        setPets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [filters]);

  // Update URL when filters change locally
  const updateFiltersAndUrl = (newFilters) => {
    setFilters(newFilters);
    
    // Update URL to reflect current filters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });
    
    const newUrl = `/browse${params.toString() ? '?' + params.toString() : ''}`;
    navigate(newUrl, { replace: true });
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    updateFiltersAndUrl(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: 'all',
      size: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: 'newest',
      available: '',
      featured: ''
    };
    updateFiltersAndUrl(clearedFilters);
  };

  const fetchBucketImages = async (bucketName, folder) => {
    if (!bucketName) return;
    setImageLoading(true);
    setError('');
    try {
      const prefix = folder ? `${folder}/` : '';
      const response = await api.get(`/gcs/buckets/${bucketName}/images?prefix=${prefix}&public=true`);
      if (response.data.success) {
        setBucketImages(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error) {
      setError(`Failed to fetch images from bucket: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  const assignImageToPet = async (petId, imageFileName) => {
    try {
      const publicUrl = getPublicImageUrl(imageFileName);
      await api.patch(`/pets/${petId}`, {
        image: imageFileName,
        imageUrl: publicUrl,
        imageName: imageFileName
      });
      setPets(prev => prev.map(pet => pet._id === petId ? 
        { ...pet, image: imageFileName, imageUrl: publicUrl, imageName: imageFileName } : pet));
      setShowImageModal(false);
      setSelectedPetId(null);
    } catch (error) {
      setError(`Failed to assign image to pet: ${error.response?.data?.message || error.message}`);
    }
  };

  const uploadImageToBucket = async (file, petId) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('petId', petId);
      formData.append('bucketName', selectedBucket);
      formData.append('folder', selectedFolder);
      formData.append('public', 'true');

      const response = await api.post('/gcs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedPetId) return;
    if (!isValidImage(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    if (!isValidFileSize(file)) {
      setError(`File size too large. Max: 10MB. Yours: ${formatFileSize(file.size)}`);
      return;
    }
    setImageLoading(true);
    setError('');
    try {
      const uploadResult = await uploadImageToBucket(file, selectedPetId);
      await assignImageToPet(selectedPetId, uploadResult.fileName);
      await fetchBucketImages(selectedBucket, selectedFolder);
    } catch (error) {
      setError(`Failed to upload image: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  // Handle folder change
  const handleFolderChange = (newFolder) => {
    setSelectedFolder(newFolder);
    fetchBucketImages(selectedBucket, newFolder);
  };

  useEffect(() => {
    fetchBucketImages(selectedBucket, selectedFolder);
  }, [selectedBucket, selectedFolder]);

  const openImageModal = (petId) => {
    setSelectedPetId(petId);
    setShowImageModal(true);
  };

  const getPageTitle = () => {
    if (filters.featured === 'true') return 'Featured Pets';
    if (filters.search) return `Search Results for "${filters.search}"`;
    if (filters.type !== 'all') {
      return `Browse ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}s`;
    }
    return 'Browse All Pets';
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="mb-4">
        <Col>
          <h2 className="text-center mb-4">{getPageTitle()}</h2>
          
          {/* Filter Controls */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search pets..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="dog">Dogs</option>
                    <option value="cat">Cats</option>
                    <option value="fish">Fish</option>
                    <option value="bird">Birds</option>
                    <option value="small-pet">Small Pets</option>
                    <option value="supply">Supplies</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Size</Form.Label>
                  <Form.Select
                    value={filters.size}
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                  >
                    <option value="">Any Size</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label>Min Price</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Max Price</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button variant="outline-secondary" onClick={clearFilters}>
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>{error}
          <Button variant="link" size="sm" className="ms-2" onClick={() => setError('')}>
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="lg" />
          <p className="mt-3 text-muted">Finding pets that match your criteria...</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-3">
            <span className="text-muted">
              {pets.length} pet{pets.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Pet Grid */}
          <Row className="g-4">
            {pets.length > 0 ? (
              pets.map(pet => (
                <Col key={pet._id} sm={6} md={4} lg={3}>
                  <div style={{ position: 'relative' }}>
                    <PetCard pet={pet} onVote={() => {}} />
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="mt-2 w-100" 
                      onClick={() => openImageModal(pet._id)}
                    >
                      <i className="fas fa-images me-2"></i>Manage Images
                    </Button>
                  </div>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h4>No pets found</h4>
                  <p className="text-muted mb-3">
                    Try adjusting your search criteria or browse all available pets.
                  </p>
                  <Button variant="primary" onClick={clearFilters}>
                    <i className="fas fa-paw me-2"></i>Browse All Pets
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Image Management Modal with Folder Selection */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Images - {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Folder Selection */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>Select Folder</Form.Label>
              <Form.Select 
                value={selectedFolder} 
                onChange={(e) => handleFolderChange(e.target.value)}
              >
                {availableFolders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder.charAt(0).toUpperCase() + folder.slice(1)} Images
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Upload New Image</Form.Label>
              <Form.Control 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={imageLoading} 
              />
            </Col>
          </Row>

          {imageLoading && (
            <div className="text-center mb-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Loading images...</span>
            </div>
          )}

          <Row className="g-3">
            {bucketImages.length > 0 ? (
              bucketImages.map((imageName, index) => (
                <Col key={index} xs={6} md={4}>
                  <Card className="h-100">
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      <Card.Img
                        variant="top"
                        src={getPublicImageUrl(imageName)}
                        style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => assignImageToPet(selectedPetId, imageName)}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                    <Card.Body className="p-2">
                      <small className="text-muted d-block mb-2" title={imageName}>
                        {imageName.length > 30 ? 
                          `${imageName.substring(0, 30)}...` : 
                          imageName
                        }
                      </small>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="w-100"
                        onClick={() => assignImageToPet(selectedPetId, imageName)}
                      >
                        <i className="fas fa-check me-1"></i>Use This Image
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="text-center py-4">
                  <i className="fas fa-image fa-3x text-muted mb-3"></i>
                  <h5>No images found in {selectedFolder} folder</h5>
                  <p className="text-muted">Upload an image to get started</p>
                </div>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Browse;