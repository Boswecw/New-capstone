// client/src/components/ProductImageManager.js
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

    if (!isValidFileSize(file)) {
      setError('File size too large. Maximum size is 10MB.');
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
      
      const response = await api.patch(`/products/${productId}`, {
        imageUrl: publicUrl,
        imageName: imageData.name
      });

      if (response.data.success) {
        setSuccess(`✅ Image assigned to ${productName || 'product'}`);
        setSelectedImage(imageData);
        
        // Close modal after short delay
        setTimeout(() => {
          onHide();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to assign image');
      }
    } catch (error) {
      console.error('Error assigning image to product:', error);
      setError(`Failed to assign image: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteImage = async (imageData) => {
    if (!window.confirm(`Are you sure you want to delete "${imageData.name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/gcs/buckets/furbabies-petstore/images/${imageData.name}`);
      
      if (response.data.success) {
        setSuccess(`✅ Image deleted successfully`);
        await fetchProductImages();
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(`Failed to delete image: ${error.response?.data?.message || error.message}`);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-images me-2"></i>
          Product Image Manager
          {productName && <small className="text-muted ms-2">for {productName}</small>}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Error/Success Messages */}
        {error && (
          <Alert variant="danger" dismissible onClose={clearMessages}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={clearMessages}>
            {success}
          </Alert>
        )}

        {/* Upload Section */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-upload me-2"></i>
              Upload New Image
            </h5>
          </Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Image File</Form.Label>
                <Form.Control
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Form.Text className="text-muted">
                  Maximum file size: 10MB. Supported formats: JPEG, PNG, GIF, WebP
                </Form.Text>
              </Form.Group>
              
              {uploadFile && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-grow-1">
                      <strong>Selected:</strong> {uploadFile.name}
                      <br />
                      <small className="text-muted">
                        Size: {formatFileSize(uploadFile.size)} | Type: {uploadFile.type}
                      </small>
                    </div>
                    <Button
                      variant="success"
                      onClick={uploadImageToBucket}
                      disabled={uploading}
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
                  </div>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>

        {/* Images Grid */}
        <Card>
          <Card.Header className="bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-folder me-2"></i>
                Available Product Images
              </h5>
              <Badge bg="light" text="dark">
                {productImages.length} images
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading images from furbabies-petstore bucket...</p>
              </div>
            ) : productImages.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-image fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No product images found</h5>
                <p className="text-muted">Upload your first product image to get started!</p>
              </div>
            ) : (
              <Row className="g-3">
                {productImages.map((image, index) => (
                  <Col key={index} md={4} lg={3}>
                    <Card className="h-100 border-0 shadow-sm">
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={getPublicImageUrl(image.name)}
                          alt={image.name}
                          style={{ 
                            height: '150px', 
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: selectedImage?.name === image.name ? '3px solid #0d6efd' : 'none'
                          }}
                          onClick={() => assignImageToProduct(image)}
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                        {selectedImage?.name === image.name && (
                          <div className="position-absolute top-0 start-0 m-2">
                            <Badge bg="success">
                              <i className="fas fa-check me-1"></i>
                              Selected
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Card.Body className="p-2">
                        <Card.Title className="h6 mb-1" title={image.name}>
                          {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
                        </Card.Title>
                        <Card.Text className="small text-muted mb-2">
                          {image.size && formatFileSize(image.size)}
                        </Card.Text>
                        <div className="d-grid">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => assignImageToProduct(image)}
                          >
                            <i className="fas fa-check me-1"></i>
                            Use This Image
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Bucket Information */}
        <div className="mt-3">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Images are stored in <strong>furbabies-petstore/{bucketFolders.PRODUCT}/</strong> folder
          </small>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Close
        </Button>
        
        <Button
          variant="outline-primary"
          onClick={fetchProductImages}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh Images
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductImageManager;