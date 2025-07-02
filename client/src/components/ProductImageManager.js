// client/src/components/ProductImageManager.js
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import { getPublicImageUrl, bucketFolders, isValidImage, isValidFileSize } from '../utils/bucketUtils';

const ProductImageManager = ({ show, onHide, productId, productName }) => {
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      fetchProductImages();
    }
  }, [show]);

  const fetchProductImages = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/gcs/buckets/FurBabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      if (response.data.success) {
        setProductImages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError('Failed to fetch product images');
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

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('petId', productId); // Using petId field for product ID
      formData.append('bucketName', 'FurBabies-petstore');
      formData.append('folder', bucketFolders.PRODUCT);
      formData.append('public', 'true');

      const response = await api.post('/gcs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Refresh the images list
        await fetchProductImages();
        
        // Clear the file input
        event.target.value = '';
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const assignImageToProduct = async (imageName) => {
    try {
      const publicUrl = getPublicImageUrl(imageName);
      
      // Update your product database with the new image
      await api.patch(`/products/${productId}`, {
        imageUrl: publicUrl,
        imageName: imageName
      });

      console.log(`Assigned image ${imageName} to product ${productId}`);
      onHide();
    } catch (error) {
      console.error('Error assigning image to product:', error);
      setError('Failed to assign image to product');
    }
  };

  const deleteImage = async (imageName) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await api.delete(`/gcs/images/${encodeURIComponent(imageName)}`);
      await fetchProductImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-images me-2"></i>
          Manage Product Images
          {productName && <small className="text-muted d-block">for {productName}</small>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Upload Section */}
        <div className="mb-4">
          <h6>
            <i className="fas fa-cloud-upload-alt me-2"></i>
            Upload New Product Image
          </h6>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && (
            <div className="mt-2">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Uploading to FurBabies-petstore/product/...</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="mb-4">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Product Images Grid */}
        <div>
          <h6>
            <i className="fas fa-box me-2"></i>
            Available Product Images
          </h6>
          <small className="text-muted mb-3 d-block">
            Bucket: FurBabies-petstore/product/
          </small>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <p className="mt-2">Loading product images...</p>
            </div>
          ) : (
            <Row className="g-3">
              {productImages.map((image, index) => (
                <Col key={index} xs={6} md={4}>
                  <Card className="h-100">
                    <Card.Img 
                      variant="top" 
                      src={getPublicImageUrl(image.name)} 
                      style={{ height: '150px', objectFit: 'cover' }}
                      alt={image.fileName}
                    />
                    <Card.Body className="p-2">
                      <small className="text-muted d-block mb-2" style={{ fontSize: '0.7rem' }}>
                        {image.fileName}
                      </small>
                      <div className="d-grid gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => assignImageToProduct(image.name)}
                        >
                          <i className="fas fa-check me-1"></i>
                          Use This Image
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteImage(image.name)}
                        >
                          <i className="fas fa-trash me-1"></i>
                          Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {productImages.length === 0 && !loading && (
            <div className="text-center py-4 text-muted">
              <i className="fas fa-box-open fa-2x mb-2"></i>
              <p>No product images found</p>
              <small>Upload images to see them here</small>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Close
        </Button>
        <Button variant="outline-primary" onClick={fetchProductImages} disabled={loading}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductImageManager;