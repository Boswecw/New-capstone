// Fixed ProductImageManager.js - Complete implementation
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
      console.log('Fetching product images...');
      const response = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      
      console.log('Product images response:', response.data);
      
      if (response.data.success) {
        setProductImages(response.data.data || []);
        console.log('Loaded product images:', response.data.data?.length || 0);
      } else {
        throw new Error(response.data.message || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError(`Failed to fetch product images: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !productId) return;

    console.log('File selected:', file.name, 'Size:', formatFileSize(file.size));

    // Validate file
    if (!isValidImage(file)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // ✅ FIXED: Complete file size validation with proper error message
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
    setSuccess('');
    
    try {
      console.log(`Uploading ${uploadFile.name} to product folder...`);
      
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('entityId', productId);
      formData.append('bucketName', 'furbabies-petstore');
      formData.append('folder', bucketFolders.PRODUCT);
      formData.append('public', 'true');

      const response = await api.post('/gcs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        setSuccess(`Image uploaded successfully: ${response.data.data.fileName}`);
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

  const assignImageToProduct = async (imageName) => {
    if (!productId || !imageName) return;

    try {
      console.log(`Assigning image ${imageName} to product ${productId}`);
      const publicUrl = getPublicImageUrl(imageName);
      console.log('Generated public URL:', publicUrl);
      
      // Update product with image URL
      const response = await api.patch(`/products/${productId}`, {
        image: imageName,          // ✅ Consistent field naming
        imageUrl: publicUrl,       // ✅ Full URL
        imageName: imageName       // ✅ File name reference
      });

      console.log('Product update response:', response.data);

      setSuccess(`Image assigned to ${productName} successfully`);
      setSelectedImage({ name: imageName, url: publicUrl });
      
      // Close modal after successful assignment
      setTimeout(() => {
        onHide();
      }, 1500);
      
    } catch (error) {
      console.error('Error assigning image to product:', error);
      setError(`Failed to assign image to product: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleImageSelect = (imageName) => {
    setSelectedImage({ name: imageName, url: getPublicImageUrl(imageName) });
    setError('');
    setSuccess('');
  };

  const handleAssignImage = () => {
    if (selectedImage) {
      assignImageToProduct(selectedImage.name);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
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
        {error && (
          <Alert variant="danger" dismissible onClose={clearMessages}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={clearMessages}>
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}
        
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
              {productImages.map((imageName, index) => (
                <Col key={index} md={4} sm={6}>
                  <Card className={`h-100 ${selectedImage?.name === imageName ? 'border-primary' : ''}`}>
                    <div style={{ position: 'relative', height: '150px' }}>
                      <Card.Img 
                        variant="top" 
                        src={getPublicImageUrl(imageName)}
                        style={{ 
                          height: '150px', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        alt={`Product image ${index + 1}`}
                        onClick={() => handleImageSelect(imageName)}
                        onError={(e) => {
                          console.error('Product image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                      />
                      {selectedImage?.name === imageName && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <Badge bg="primary">
                            <i className="fas fa-check"></i>
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Card.Body className="p-2">
                      <small className="text-muted d-block mb-2" title={imageName}>
                        {imageName.length > 30 ? `${imageName.substring(0, 30)}...` : imageName}
                      </small>
                      <Button
                        variant={selectedImage?.name === imageName ? 'success' : 'outline-primary'}
                        size="sm"
                        className="w-100"
                        onClick={() => assignImageToProduct(imageName)}
                      >
                        {selectedImage?.name === imageName ? (
                          <>
                            <i className="fas fa-check me-1"></i>
                            Use This Image
                          </>
                        ) : (
                          'Select & Use'
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-3">
            <h6>Selected Image:</h6>
            <div className="d-flex align-items-center">
              <img 
                src={selectedImage.url} 
                alt="Selected" 
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                className="me-2 rounded"
              />
              <div>
                <small className="text-muted d-block">{selectedImage.name}</small>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAssignImage}
                >
                  <i className="fas fa-check me-1"></i>
                  Assign to Product
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={() => fetchProductImages()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Refreshing...
            </>
          ) : (
            <>
              <i className="fas fa-sync me-2"></i>
              Refresh Images
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductImageManager;