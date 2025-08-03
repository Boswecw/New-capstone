// client/src/hooks/useSequentialLoader.js
import { useState, useEffect, useCallback } from 'react';
import { petAPI, productAPI } from '../services/api';

export const useSequentialLoader = () => {
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('pets');
  const [data, setData] = useState({
    featuredPets: [],
    featuredProducts: [],
    categories: [],
    brands: []
  });
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    const stages = [
      { name: 'pets', loader: () => petAPI.getFeaturedPets(6), key: 'featuredPets' },
      { name: 'products', loader: () => productAPI.getFeaturedProducts(6), key: 'featuredProducts' },
      { name: 'categories', loader: () => productAPI.getCategories(), key: 'categories' },
      { name: 'brands', loader: () => productAPI.getBrands(), key: 'brands' }
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setLoadingStage(stage.name);
      
      try {
        console.log(`🔄 Loading ${stage.name}...`);
        const response = await stage.loader();
        
        setData(prev => ({
          ...prev,
          [stage.key]: response.data.data || []
        }));
        
        setErrors(prev => ({
          ...prev,
          [stage.key]: null
        }));
        
        console.log(`✅ ${stage.name} loaded successfully`);
        
      } catch (error) {
        console.error(`❌ Error loading ${stage.name}:`, error);
        setErrors(prev => ({
          ...prev,
          [stage.key]: error
        }));
      }
      
      setProgress(((i + 1) / stages.length) * 100);
      
      // Small delay between requests to avoid overwhelming the server
      if (i < stages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setLoading(false);
    setLoadingStage('complete');
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    loadingStage,
    data,
    errors,
    progress,
    retry: loadData
  };
};

// Home page component using sequential loading
import React from 'react';
import { Container, Row, Col, Card, ProgressBar, Alert, Button } from 'react-bootstrap';
import { useColdStartHandler, ColdStartLoader } from '../hooks/useColdStartHandler';
import { useSequentialLoader } from '../hooks/useSequentialLoader';

const HomePage = () => {
  const coldStart = useColdStartHandler();
  const dataLoader = useSequentialLoader();

  const handleRetry = () => {
    coldStart.wakeUpServerIfNeeded().then(() => {
      dataLoader.retry();
    });
  };

  return (
    <ColdStartLoader
      isWakingUp={coldStart.isWakingUp}
      serverStatus={coldStart.serverStatus}
      error={coldStart.error}
      onRetry={handleRetry}
    >
      <Container className="py-4">
        {dataLoader.loading && (
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body className="text-center">
                  <h5>Loading {dataLoader.loadingStage}...</h5>
                  <ProgressBar 
                    now={dataLoader.progress} 
                    label={`${Math.round(dataLoader.progress)}%`}
                    className="mb-2"
                  />
                  <small className="text-muted">
                    Please wait while we load the latest data
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Display errors if any */}
        {Object.keys(dataLoader.errors).some(key => dataLoader.errors[key]) && (
          <Row className="mb-4">
            <Col>
              <Alert variant="warning" dismissible>
                <Alert.Heading>Some data couldn't be loaded</Alert.Heading>
                <p>We encountered issues loading some content. You can try refreshing the page.</p>
                <Button variant="outline-warning" onClick={handleRetry}>
                  Retry Loading
                </Button>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Featured Pets Section */}
        <Row className="mb-5">
          <Col>
            <h2>Featured Pets</h2>
            {dataLoader.data.featuredPets.length > 0 ? (
              <Row>
                {dataLoader.data.featuredPets.map(pet => (
                  <Col key={pet._id} md={4} className="mb-3">
                    <Card>
                      <Card.Img 
                        variant="top" 
                        src={pet.imageUrl || '/images/default-pet.png'} 
                        alt={pet.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body>
                        <Card.Title>{pet.name}</Card.Title>
                        <Card.Text>
                          {pet.breed} • {pet.age} • {pet.size}
                        </Card.Text>
                        <Button variant="primary" href={`/pets/${pet._id}`}>
                          Learn More
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert variant="info">
                {dataLoader.errors.featuredPets 
                  ? "Unable to load featured pets at the moment."
                  : "Loading featured pets..."}
              </Alert>
            )}
          </Col>
        </Row>

        {/* Featured Products Section */}
        <Row className="mb-5">
          <Col>
            <h2>Featured Products</h2>
            {dataLoader.data.featuredProducts.length > 0 ? (
              <Row>
                {dataLoader.data.featuredProducts.map(product => (
                  <Col key={product._id} md={4} className="mb-3">
                    <Card>
                      <Card.Img 
                        variant="top" 
                        src={product.imageUrl || '/images/default-product.png'} 
                        alt={product.name}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body>
                        <Card.Title>{product.name}</Card.Title>
                        <Card.Text>
                          {product.category} • ${product.price}
                        </Card.Text>
                        <Button variant="primary" href={`/products/${product._id}`}>
                          View Product
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert variant="info">
                {dataLoader.errors.featuredProducts 
                  ? "Unable to load featured products at the moment."
                  : "Loading featured products..."}
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </ColdStartLoader>
  );
};

export default HomePage;