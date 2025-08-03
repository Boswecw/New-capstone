
// client/src/components/browse/DetailLayout.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Breadcrumb, Card } from 'react-bootstrap';
import SafeImage from '../SafeImage';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';

const DetailLayout = ({ 
  entityConfig, 
  apiService,
  children,
  CustomDetailView 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setError(`No ${entityConfig.singularName} ID provided`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService[entityConfig.api.getByIdMethod](id);
        
        let itemData = null;
        
        if (response?.data?.success && response.data.data) {
          itemData = response.data.data;
        } else if (response?.data && response.data._id) {
          itemData = response.data;
        } else {
          throw new Error('Invalid response format from server');
        }
        
        if (itemData && itemData._id) {
          setItem(itemData);
        } else {
          throw new Error(`${entityConfig.singularDisplayName} data is incomplete`);
        }
        
      } catch (err) {
        console.error(`❌ Error fetching ${entityConfig.singularName}:`, err);
        
        if (err.response?.status === 404) {
          setError(`${entityConfig.singularDisplayName} "${id}" not found.`);
        } else {
          setError(`Unable to load ${entityConfig.singularName} "${id}". Please try again.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, apiService, entityConfig]);

  if (loading) {
    return <LoadingSpinner message={`Loading ${entityConfig.singularName}...`} />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <ErrorAlert 
          error={error}
          onRetry={() => window.location.reload()}
          onGoBack={() => navigate(entityConfig.routes.browse)}
        />
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-5">
        <ErrorAlert 
          error={`${entityConfig.singularDisplayName} not found`}
          onGoBack={() => navigate(entityConfig.routes.browse)}
        />
      </Container>
    );
  }

  // If custom detail view provided, use it
  if (CustomDetailView) {
    return <CustomDetailView item={item} config={entityConfig} />;
  }

  // Default detail layout
  const title = item[entityConfig.detail.titleField] || `Unnamed ${entityConfig.singularDisplayName}`;
  
  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate(entityConfig.routes.browse)}>
          {entityConfig.displayName}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          {entityConfig.detail.breadcrumbLogic ? entityConfig.detail.breadcrumbLogic(item) : title}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        {/* Image */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <SafeImage
                item={item}
                category={entityConfig.detail.imageCategory}
                size="large"
                className="img-fluid"
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                alt={title}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Details */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h1 className="h2 mb-3">{title}</h1>
              
              {/* Custom content area */}
              {children}
              
              {/* Action buttons */}
              <div className="d-flex gap-2 mt-4">
                <Button variant={entityConfig.detail.primaryAction.variant} size="lg">
                  <i className={`fas fa-${entityConfig.detail.primaryAction.icon} me-2`}></i>
                  {entityConfig.detail.primaryAction.text}
                </Button>
                
                <Button variant={entityConfig.detail.secondaryAction.variant} size="lg">
                  <i className={`fas fa-${entityConfig.detail.secondaryAction.icon} me-2`}></i>
                  {entityConfig.detail.secondaryAction.text}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DetailLayout;