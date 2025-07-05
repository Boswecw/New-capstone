// Fixed Browse.js - Consistent field names, dynamic routing, and better error handling
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize, formatFileSize } from '../utils/bucketUtils';

const Browse = () => {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const typeFromUrl = queryParams.get('type');

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
    type: typeFromUrl || 'all',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: 'newest'
  });

  useEffect(() => {
    if (typeFromUrl && typeFromUrl !== filters.type) {
      setFilters(prev => ({ ...prev, type: typeFromUrl }));
    }
  }, [typeFromUrl]);

  const fetchBucketImages = async (bucketName, folder = bucketFolders.PET) => {
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
      setPets(prev => prev.map(pet => pet._id === petId ? { ...pet, image: imageFileName, imageUrl: publicUrl, imageName: imageFileName } : pet));
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
        setPets(response.data.data || []);
      } catch (error) {
        setError(`Error fetching pets: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [filters]);

  useEffect(() => {
    fetchBucketImages(selectedBucket, selectedFolder);
  }, [selectedBucket, selectedFolder]);

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
      <h2 className="text-center mb-4">
        {filters.type !== 'all' ? `Browse ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}s` : 'Browse All Pets'}
      </h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>{error}
          <Button variant="link" size="sm" className="ms-2" onClick={() => setError('')}>Dismiss</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="lg" />
          <p className="mt-3 text-muted">Finding pets that match your criteria...</p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <span className="text-muted">{pets.length} pet{pets.length !== 1 ? 's' : ''} found</span>
          </div>
          <Row className="g-4">
            {pets.map(pet => (
              <Col key={pet._id} sm={6} md={4} lg={3}>
                <div style={{ position: 'relative' }}>
                  <PetCard pet={pet} onVote={() => {}} />
                  <Button variant="outline-primary" size="sm" className="mt-2 w-100" onClick={() => openImageModal(pet._id)}>
                    <i className="fas fa-images me-2"></i>Manage Images
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}

      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Pet Images - {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={imageLoading} />
          {imageLoading && <Spinner animation="border" className="mt-2" size="sm" />}

          <Row className="g-3 mt-3">
            {bucketImages.map((imageName, index) => (
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
                      {imageName.length > 30 ? `${imageName.substring(0, 30)}...` : imageName}
                    </small>
                    <Button variant="primary" size="sm" className="w-100" onClick={() => assignImageToPet(selectedPetId, imageName)}>
                      Use This Image
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Browse;
