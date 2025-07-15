// client/src/components/ProductImageManager.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, Row, Col, Card, Button, Form, Spinner, Alert, Badge,
} from 'react-bootstrap';
import api from '../services/api';
import {
  getPublicImageUrl,
  bucketFolders,
  isValidImage,
  isValidFileSize,
  formatFileSize,
} from '../utils/bucketUtils';
import styles from './Card.module.css';

const ProductImageManager = ({ show, onHide, productId, productName }) => {
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && productId) fetchProductImages();
  }, [show, productId]);

  const fetchProductImages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      if (res.data.success) setProductImages(res.data.data || []);
      else throw new Error(res.data.message);
    } catch (err) {
      setError(`Fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidImage(file)) {
      return setError('Invalid image type. JPEG, PNG, GIF, WebP only.');
    }

    if (!isValidFileSize(file)) {
      return setError(`File too large. Max: 10MB. Yours: ${formatFileSize(file.size)}`);
    }

    const duplicate = productImages.find(name => name === file.name);
    if (duplicate) {
      return setError(`An image named "${file.name}" already exists.`);
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

    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('entityId', productId);
    formData.append('bucketName', 'furbabies-petstore');
    formData.append('folder', bucketFolders.PRODUCT);
    formData.append('public', 'true');

    try {
      const res = await api.post('/gcs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccess(`Uploaded: ${res.data.data.fileName}`);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProductImages();
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const assignImageToProduct = async (imageName) => {
    try {
      const publicUrl = getPublicImageUrl(imageName);
      const res = await api.patch(`/products/${productId}`, {
        image: imageName,
        imageUrl: publicUrl,
        imageName,
      });

      if (res.data.success) {
        setSuccess(`Assigned ${imageName} to ${productName}`);
        setSelectedImage({ name: imageName, url: publicUrl });
        setTimeout(onHide, 1500);
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      setError(`Assignment failed: ${err.message}`);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      aria-labelledby="product-image-manager-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="product-image-manager-title">
          <i className="fas fa-images me-2" /> Image Manager - {productName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={clearMessages}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={clearMessages}>{success}</Alert>}

        <div className="mb-4">
          <h5><i className="fas fa-upload me-2" />Upload New Image</h5>
          <Row className="g-3">
            <Col md={8}>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <small className="text-muted">Supported: JPG, PNG, GIF, WebP — Max 10MB</small>
            </Col>
            <Col md={4}>
              <Button
                variant="primary"
                className="w-100"
                disabled={!uploadFile || uploading}
                onClick={uploadImageToBucket}
              >
                {uploading ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="fas fa-cloud-upload-alt me-2" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </Col>
          </Row>
          {uploadFile && (
            <small className="text-info mt-2 d-block">
              <i className="fas fa-file-image me-1" />
              Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
            </small>
          )}
        </div>

        <hr />

        <h5><i className="fas fa-folder-open me-2" />Available Images <Badge bg="secondary">{productImages.length}</Badge></h5>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading images...</p>
          </div>
        ) : productImages.length === 0 ? (
          <Alert variant="info" className="text-center">
            No images found. Upload some to begin.
          </Alert>
        ) : (
          <Row className="g-3">
            {productImages.map((imageName, i) => {
              const imageUrl = getPublicImageUrl(imageName);
              const isSelected = selectedImage?.name === imageName;

              return (
                <Col md={4} sm={6} key={i}>
                  <Card className={`h-100 ${isSelected ? 'border-primary' : ''}`}>
                    <div className={styles.cardImgContainer}>
                      <Card.Img
                        src={imageUrl}
                        className={styles.cardImg}
                        alt={`Product image ${i + 1}`}
                        onClick={() => setSelectedImage({ name: imageName, url: imageUrl })}
                        style={{ cursor: 'pointer' }}
                        onError={(e) => {
                          console.warn('Failed to load image:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                      />
                      {isSelected && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <Badge bg="primary"><i className="fas fa-check" /></Badge>
                        </div>
                      )}
                    </div>
                    <Card.Body className="p-2">
                      <small className="text-muted d-block mb-2">
                        {imageName.length > 30 ? `${imageName.slice(0, 30)}...` : imageName}
                      </small>
                      <Button
                        size="sm"
                        className="w-100"
                        variant={isSelected ? 'success' : 'outline-primary'}
                        onClick={() => assignImageToProduct(imageName)}
                      >
                        {isSelected ? <><i className="fas fa-check me-1" /> Use This</> : 'Select & Use'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {selectedImage && (
          <div className="mt-4">
            <h6>Selected Image:</h6>
            <div className="d-flex align-items-center">
              <img
                src={selectedImage.url}
                alt="Preview"
                className="me-2 rounded"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              />
              <div>
                <small className="text-muted d-block">{selectedImage.name}</small>
                <Button size="sm" variant="success" onClick={() => assignImageToProduct(selectedImage.name)}>
                  <i className="fas fa-check me-1" /> Assign to Product
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="primary" onClick={fetchProductImages} disabled={loading}>
          {loading ? <><Spinner animation="border" size="sm" className="me-2" />Refreshing...</> : <><i className="fas fa-sync me-2" />Refresh</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductImageManager;
