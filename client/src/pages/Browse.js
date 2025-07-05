// Fixed Browse.js - Consistent field names and better error handling
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize, formatFileSize } from '../utils/bucketUtils';

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



  // ✅ FIXED: Enhanced bucket image fetching with better error handling
  const fetchBucketImages = async (bucketName, folder = bucketFolders.PET) => {
    if (!bucketName) return;
    
    console.log(`Fetching images from bucket: ${bucketName}, folder: ${folder}`);
    setImageLoading(true);
    setError('');
    
    try {
      const prefix = folder ? `${folder}/` : '';
      const response = await api.get(`/gcs/buckets/${bucketName}/images?prefix=${prefix}&public=true`);
      
      console.log('GCS Response:', response.data);
      
      if (response.data.success) {
        const images = response.data.data || [];
        console.log(`Found ${images.length} images in ${folder} folder`);
        setBucketImages(images);
      } else {
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching bucket images:', error);
      setError(`Failed to fetch images from bucket: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  // ✅ FIXED: Update pet with both image and imageUrl for consistency
  const assignImageToPet = async (petId, imageFileName) => {
    try {
      console.log(`Assigning image ${imageFileName} to pet ${petId}`);
      const publicUrl = getPublicImageUrl(imageFileName);
      console.log('Generated public URL:', publicUrl);
      
      const response = await api.patch(`/pets/${petId}`, {
        image: imageFileName,      // ✅ Keep original field name
        imageUrl: publicUrl,       // ✅ Also set full URL
        imageName: imageFileName   // ✅ Also set name for reference
      });

      console.log('Pet update response:', response.data);

      // Update local state with all image fields
      setPets(prev => prev.map(pet => 
        pet._id === petId 
          ? { 
              ...pet, 
              image: imageFileName,
              imageUrl: publicUrl, 
              imageName: imageFileName 
            }
          : pet
      ));

      setShowImageModal(false);
      setSelectedPetId(null);
      
      // Show success message
      setError('');
      console.log('Successfully assigned image to pet');
      
    } catch (error) {
      console.error('Error assigning image to pet:', error);
      setError(`Failed to assign image to pet: ${error.response?.data?.message || error.message}`);
    }
  };

  // ✅ FIXED: Enhanced upload with better error handling
  const uploadImageToBucket = async (file, petId) => {
    try {
      console.log(`Uploading file ${file.name} for pet ${petId}`);
      
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

      console.log('Upload response:', response.data);

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

  // ✅ FIXED: Better image upload handling
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedPetId) return;

    console.log('File selected:', file.name, 'Size:', formatFileSize(file.size));

    // Enhanced validation
    if (!isValidImage(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (!isValidFileSize(file)) {
      setError(`File size too large. Maximum size is 10MB. Your file: ${formatFileSize(file.size)}`);
      return;
    }

    setImageLoading(true);
    setError('');
    
    try {
      const uploadResult = await uploadImageToBucket(file, selectedPetId);
      console.log('Upload successful:', uploadResult);
      
      await assignImageToPet(selectedPetId, uploadResult.fileName);
      
      // Refresh bucket images from current folder
      await fetchBucketImages(selectedBucket, selectedFolder);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(`Failed to upload image: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  // ✅ FIXED: Better pet fetching with debugging
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

        console.log('Fetching pets with params:', params.toString());
        const response = await api.get(`/pets?${params.toString()}`);
        console.log('Pets response:', response.data);
        
        setPets(response.data.data || []);
      } catch (error) {
        console.error('Error fetching pets:', error);
        setError(`Error fetching pets: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [filters]);

  // Load initial bucket images
  useEffect(() => {
    fetchBucketImages(selectedBucket, selectedFolder);
  }, [selectedBucket, selectedFolder]);

  const handleVote = async (petId, voteType) => {
    // Implement vote logic
    console.log(`Voting ${voteType} for pet ${petId}`);
  };

  const openImageModal = (petId) => {
    setSelectedPetId(petId);
    setShowImageModal(true);
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

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <h2 className="text-center mb-4">Browse All Pets</h2>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <Button 
            variant="link" 
            size="sm" 
            className="ms-2"
            onClick={() => setError('')}
          >
            Dismiss
          </Button>
        </Alert>
      )}

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
                  {imageLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync me-2"></i>
                      Refresh Images
                    </>
                  )}
                </Button>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <small className="text-muted">Images Found:</small>
                  <div className="fw-bold text-primary">{bucketImages.length}</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Pet Grid */}
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
              Bucket: {selectedBucket}/{selectedFolder}/
            </small>
            
            {imageLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <p className="mt-2">Loading images...</p>
              </div>
            ) : (
              <Row className="g-3">
                {bucketImages.map((imageName, index) => (
                  <Col key={index} xs={6} md={4}>
                    <Card className="h-100">
                      <div style={{ position: 'relative', height: '150px' }}>
                        <Card.Img 
                          variant="top" 
                          src={getPublicImageUrl(imageName)}
                          style={{ 
                            height: '150px', 
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          alt={`Image ${index + 1}`}
                          onError={(e) => {
                            console.error('Image failed to load:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                          onClick={() => {
                            console.log('Image clicked:', imageName);
                            window.open(getPublicImageUrl(imageName), '_blank');
                          }}
                        />
                      </div>
                      <Card.Body className="p-2">
                        <small className="text-muted d-block mb-2" title={imageName}>
                          {imageName.length > 30 ? `${imageName.substring(0, 30)}...` : imageName}
                        </small>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100"
                          onClick={() => assignImageToPet(selectedPetId, imageName)}
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
                <p>No images found in the {selectedFolder} folder</p>
                <small>Try uploading some images or checking a different folder.</small>
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