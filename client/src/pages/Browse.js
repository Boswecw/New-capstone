// client/src/pages/Browse.js
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize, formatFileSize } from '../utils/bucketUtils';
// Removed direct GCS import - using server API instead

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [bucketImages, setBucketImages] = useState([]);
 const [selectedBucket] = useState('furbabies-petstore');
  const [selectedFolder, setSelectedFolder] = useState(bucketFolders.PET);
  const [availableFolders] = useState(Object.values(bucketFolders));
  const [filters, setFilters] = useState({
    type: 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: 'newest'
  });

  const searchInputRef = useRef(null);

  // Fetch images from selected bucket and folder via API (public bucket)
  const fetchBucketImages = async (bucketName, folder = bucketFolders.PET) => {
    if (!bucketName) return;
    
    setImageLoading(true);
    try {
      const prefix = folder ? `${folder}/` : '';
      const response = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${prefix}&public=true`);
      if (response.data.success) {
        setBucketImages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bucket images:', error);
      setError('Failed to fetch images from bucket');
    } finally {
      setImageLoading(false);
    }
  };

  // Assign image to pet (using public URL)
  const assignImageToPet = async (petId, imageFileName) => {
    try {
      const publicUrl = getPublicImageUrl(imageFileName);
      
      await api.patch(`/pets/${petId}`, {
        imageUrl: publicUrl,
        imageName: imageFileName
      });

      // Update local state
      setPets(prev => prev.map(pet => 
        pet._id === petId 
          ? { ...pet, imageUrl: publicUrl, imageName: imageFileName }
          : pet
      ));

      setShowImageModal(false);
      setSelectedPetId(null);
    } catch (error) {
      console.error('Error assigning image to pet:', error);
      setError('Failed to assign image to pet');
    }
  };

  // Upload new image to bucket via API (public bucket)
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
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params.append(key, value);
          }
        });

        const response = await api.get(`/pets?${params.toString()}`);
        setPets(response.data.data);
      } catch (error) {
        setError('Error fetching pets. Please try again.');
        console.error('Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [filters]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      fetchBucketImages(selectedBucket, selectedFolder);
    }
  }, [selectedBucket, selectedFolder]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVote = (petId, voteType) => {
    setPets(prev => prev.map(pet => {
      if (pet._id === petId) {
        const newPet = { ...pet };
        if (voteType === 'up') {
          newPet.votes = { ...newPet.votes, up: (newPet.votes?.up || 0) + 1 };
        } else {
          newPet.votes = { ...newPet.votes, down: (newPet.votes?.down || 0) + 1 };
        }
        return newPet;
      }
      return pet;
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      size: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: 'newest'
    });
  };

  const openImageModal = (petId) => {
    setSelectedPetId(petId);
    setShowImageModal(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedPetId) return;

    // Validate file
    if (!isValidImage(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (!isValidFileSize(file)) {
      setError(`File size too large. Maximum size is 10MB. Your file: ${formatFileSize(file.size)}`);
      return;
    }

    setImageLoading(true);
    try {
      const uploadResult = await uploadImageToBucket(file, selectedPetId);
      await assignImageToPet(selectedPetId, uploadResult.fileName);
      
      // Refresh bucket images from current folder
      await fetchBucketImages(selectedBucket, selectedFolder);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <h2 className="text-center mb-4">Browse All Pets</h2>

      {/* Google Cloud Storage Controls */}
      <Row className="mb-4">
        <Col>
          <Card className="p-3 bg-info bg-opacity-10">
            <h5>FurBabies PetStore - Image Management</h5>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Bucket</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedBucket}
                  disabled
                  className="bg-light"
                />
                <small className="text-success">
                  <i className="fas fa-globe me-1"></i>Public Access
                </small>
              </Col>
              <Col md={3}>
                <Form.Label>Folder</Form.Label>
                <Form.Select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  {availableFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder.charAt(0).toUpperCase() + folder.slice(1)} Images
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button 
                  variant="primary" 
                  onClick={() => fetchBucketImages(selectedBucket, selectedFolder)}
                  disabled={imageLoading}
                >
                  {imageLoading ? 'Loading...' : 'Refresh Images'}
                </Button>
              </Col>
              <Col md={3}>
                <small className="text-muted">
                  {bucketImages.length} images in {selectedFolder} folder
                </small>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Form className="p-3 bg-light rounded">
            <Row className="g-3">
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
                  <option value="extra-large">Extra Large</option>
                </Form.Select>
              </Col>

              <Col md={1}>
                <Form.Label>Min Price</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </Col>

              <Col md={1}>
                <Form.Label>Max Price</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="$999"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </Col>

              <Col md={2}>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search pets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Col>

              <Col md={1} className="d-flex align-items-end">
                <Button variant="outline-secondary" onClick={clearFilters}>
                  Clear
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Results */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading pets...</span>
          </Spinner>
          <p className="mt-3 text-muted">Finding pets that match your criteria...</p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <span className="text-muted">
              {pets?.length || 0} pet{pets?.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <Row className="g-4">
            {pets.map(pet => (
              <Col key={pet._id} sm={6} md={4} lg={3}>
                <div style={{ position: 'relative' }}>
                  <PetCard pet={pet} onVote={handleVote} />
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="mt-2 w-100"
                    onClick={() => openImageModal(pet._id)}
                  >
                    <i className="fas fa-images me-2"></i>
                    Manage Images
                  </Button>
                </div>
              </Col>
            ))}
          </Row>

          {pets.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4>No pets found</h4>
              <p className="text-muted">Try adjusting your filters or search terms.</p>
              <Button variant="outline-primary" onClick={clearFilters}>
                <i className="fas fa-rotate-right me-2"></i>
                Clear All Filters
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Management Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Manage Pet Images - {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Upload Section */}
          <div className="mb-4">
            <h6>Upload New Image</h6>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageLoading}
            />
            {imageLoading && (
              <div className="mt-2">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Uploading...</span>
              </div>
            )}
          </div>

          {/* Bucket Images Grid */}
          <div>
            <h6>Available Images from {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Folder</h6>
            <small className="text-muted mb-3 d-block">
              Bucket: FurBabies-petstore/{selectedFolder}/
            </small>
            {imageLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <p className="mt-2">Loading images...</p>
              </div>
            ) : (
              <Row className="g-3">
                {bucketImages.map((image, index) => (
                  <Col key={index} xs={6} md={4}>
                    <Card className="h-100">
                      <Card.Img 
                        variant="top" 
                        src={getPublicImageUrl(image.name)} 
                        style={{ height: '150px', objectFit: 'cover' }}
                        alt={image.fileName}
                      />
                      <Card.Body className="p-2">
                        <small className="text-muted d-block mb-2">
                          {image.fileName}
                        </small>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100"
                          onClick={() => assignImageToPet(selectedPetId, image.name)}
                        >
                          Use This Image
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            
            {bucketImages.length === 0 && !imageLoading && (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-images fa-2x mb-2"></i>
                <p>No images found in the selected bucket</p>
              </div>
            )}
          </div>
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