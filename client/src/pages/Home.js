// pages/Home.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { bucketFolders, findBestMatchingImage } from '../utils/bucketUtils';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPets();
    fetchFeaturedProducts();
    fetchProductImages();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      const response = await api.get('/pets/featured?limit=6');
      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
      } else {
        setFeaturedPets([]);
      }
    } catch (err) {
      console.error('Error fetching featured pets:', err);
      setFeaturedPets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products/featured?limit=3');
      if (response.data?.success) {
        setFeaturedProducts(response.data.data || []);
      } else {
        setFeaturedProducts([]);
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setFeaturedProducts([]);
    }
  };

  const fetchProductImages = async () => {
    try {
      const response = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      if (response.data?.success) {
        setProductImages(response.data.data || []);
      } else {
        setProductImages([]);
      }
    } catch (err) {
      console.error('Error fetching product images:', err);
      setProductImages([]);
      setError('Failed to load product images');
    } finally {
      setImageLoading(false);
    }
  };

  const findProductImage = (product) => {
    if (!product) return 'product/placeholder.png';
    try {
      return findBestMatchingImage(
        productImages,
        [product.name, product.category, product.brand],
        product.image
      );
    } catch (err) {
      console.error('Error finding product image:', err);
      return product.image || 'product/placeholder.png';
    }
  };

  const getProductImageUrl = (product) => {
    if (product.imageUrl) return product.imageUrl;
    const imagePath = findProductImage(product);
    return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
  };

  return (
    <div className="home-page">
      <Navbar />
      <HeroBanner />
      <Container className="py-5">
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">Featured Pets</h2>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : featuredPets?.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map(pet => (
                <Col key={pet._id} md={4}>
                  <PetCard pet={pet} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured pets available at the moment.
            </Alert>
          )}
          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
                View All Pets
              </Button>
            </Link>
          </div>
        </section>

        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">Featured Products</h2>
          {imageLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : featuredProducts?.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map(product => (
                <Col key={product._id} md={4}>
                  <ProductCard product={product} imageUrl={getProductImageUrl(product)} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured products available at the moment.
            </Alert>
          )}
          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-secondary" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Home;
