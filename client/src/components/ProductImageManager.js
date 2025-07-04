// client/src/components/ProductImageManager.js - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize, formatFileSize } from '../utils/bucketUtils';

const ProductImageManager = ({ show, onHide, productId, productName }) => {
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    if (show) {
      fetchProductImages();
    }
  }, [show]);

  const fetchProductImages = async () => {
    setLoading(true);
    setError('');
    
    try {
      // ✅ FIXED: Using correct bucket name (all lowercase)
      const response = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      
      if (response.data.success) {
        setProductImages(response.data.data);
        console.log('📸 Loaded product images:', response.data.data.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError('Failed to fetch product images from bucket');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !productId) return;

    // Validate file
    if (!isValidImage(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // ✅ FIXED: Complete the file size validation
    if (!isValidFileSize(file)) {
      setError(`File size too large. Maximum size is 10MB. Your file: ${formatFileSize(file.size)}`);
      return;
    }

    setUploadFile(file);
    setError('');
    setSuccess('');
  };

  const uploadImageToBucket = async () => {
    if (!uploadFile || !productId) return;

    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('entityId', productId);
      formData.append('bucketName', 'furbabies-petstore'); // ✅ FIXED: Correct bucket name
      formData.append('folder', bucketFolders.PRODUCT);
      formData.append('public', 'true');

      const response = await api.post('/gcs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(`✅ Image uploaded successfully: ${response.data.data.fileName}`);
        setUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) fileInput.value = '';
        
        // Refresh image list
        await fetchProductImages();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(`Failed to upload image: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const assignImageToProduct = async (imageData) => {
    if (!productId || !imageData) return;

    try {
      const publicUrl = getPublicImageUrl(imageData.name);
      
      // Update product with image URL
      await api.patch(`/products/${productId}`, {
        imageUrl: publicUrl,
        imageName: imageData.name
      });

      setSuccess(`✅ Image assigned to ${productName} successfully`);
      setSelectedImage(imageData);
      
      // Close modal after successful assignment
      setTimeout(() => {
        onHide();
      }, 2000);
      
    } catch (error) {
      console.error('Error assigning image to product:', error);
      setError(`Failed to assign image to product: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
    setError('');
    setSuccess('');
  };

  const handleAssignImage = () => {
    if (selectedImage) {
      assignImageToProduct(selectedImage);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-images me-2"></i>
          Image Manager - {productName}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Alert Messages */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {/* Upload Section */}
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="fas fa-upload me-2"></i>
            Upload New Image
          </h5>
          <Row className="g-3">
            <Col md={8}>
              <Form.Control
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <small className="text-muted">
                Supported formats: JPEG, PNG, GIF, WebP (Max: 10MB)
              </small>
            </Col>
            <Col md={4}>
              <Button
                variant="primary"
                onClick={uploadImageToBucket}
                disabled={!uploadFile || uploading}
                className="w-100"
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt me-2"></i>
                    Upload
                  </>
                )}
              </Button>
            </Col>
          </Row>
          
          {uploadFile && (
            <div className="mt-2">
              <small className="text-info">
                <i className="fas fa-file-image me-1"></i>
                Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
              </small>
            </div>
          )}
        </div>

        <hr />

        {/* Existing Images Section */}
        <div className="mb-4">
          <h5 className="mb-3">
            <i className="fas fa-folder-open me-2"></i>
            Available Product Images
            <Badge bg="secondary" className="ms-2">
              {productImages.length}
            </Badge>
          </h5>
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading images...</p>
            </div>
          ) : productImages.length === 0 ? (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No product images found. Upload some images to get started.
            </Alert>
          ) : (
            <Row className="g-3">
              {productImages.map((image, index) => (
                <Col key={index} md={4} sm={6}>
                  <Card className={`h-100 ${selectedImage?.name === image.name ? 'border-primary' : ''}`}>
                    <Card.Img
                      variant="top"
                      src={getPublicImageUrl(image.name)}
                      alt={image.name}
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="small text-truncate" title={image.name}>
                        {image.name.split('/').pop()}
                      </Card.Title>
                      <div className="mt-auto">
                        <small className="text-muted d-block">
                          {formatFileSize(parseInt(image.size))}
                        </small>
                        <Button
                          variant={selectedImage?.name === image.name ? "primary" : "outline-primary"}
                          size="sm"
                          className="w-100 mt-2"
                          onClick={() => handleImageSelect(image)}
                        >
                          {selectedImage?.name === image.name ? (
                            <><i className="fas fa-check me-1"></i>Selected</>
                          ) : (
                            <><i className="fas fa-mouse-pointer me-1"></i>Select</>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Cancel
        </Button>
        {selectedImage && (
          <Button variant="success" onClick={handleAssignImage}>
            <i className="fas fa-check me-2"></i>
            Assign Selected Image
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProductImageManager;