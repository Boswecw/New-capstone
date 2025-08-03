// client/src/components/browse/BrowseLayout.js - FIXED DATA FLOW VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

const BrowseLayout = ({ 
  entityConfig, 
  apiService, 
  ItemCard, 
  useInfiniteScroll = false, 
  itemsPerPage = 12 
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get query parameters
        const type = searchParams.get('type');
        const page = parseInt(searchParams.get('page')) || 1;
        
        console.log('🔧 BrowseLayout fetching with params:', { type, page, itemsPerPage });
        
        // ✅ FIX: Ensure apiService exists and has the expected method
        if (!apiService || !apiService.getAllPets) {
          throw new Error('API service not properly configured');
        }
        
        // Call API service with proper error handling
        const response = await apiService.getAllPets({
          type,
          page,
          limit: itemsPerPage
        });
        
        console.log('🔧 BrowseLayout Raw API response:', response);
        
        // ✅ FIX: Handle multiple response structures safely
        let fetchedItems = [];
        let totalCount = 0;
        
        if (response && typeof response === 'object') {
          // Structure 1: { data: { data: [...], total: N } }
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            fetchedItems = response.data.data;
            totalCount = response.data.total || fetchedItems.length;
          }
          // Structure 2: { data: [...], total: N }
          else if (response.data && Array.isArray(response.data)) {
            fetchedItems = response.data;
            totalCount = response.total || fetchedItems.length;
          }
          // Structure 3: { pets: [...], total: N } (legacy)
          else if (response.pets && Array.isArray(response.pets)) {
            fetchedItems = response.pets;
            totalCount = response.total || fetchedItems.length;
          }
          // Structure 4: Direct array
          else if (Array.isArray(response)) {
            fetchedItems = response;
            totalCount = fetchedItems.length;
          }
          // Structure 5: Success wrapper { success: true, data: [...] }
          else if (response.success && response.data) {
            if (Array.isArray(response.data)) {
              fetchedItems = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              fetchedItems = response.data.data;
            }
            totalCount = response.total || response.data.total || fetchedItems.length;
          }
          else {
            console.warn('🚨 Unexpected API response structure:', response);
            fetchedItems = [];
          }
        } else {
          console.warn('🚨 API response is not an object:', typeof response, response);
          fetchedItems = [];
        }
        
        // ✅ FIX: Validate and clean the items array
        const validItems = fetchedItems
          .filter(item => {
            if (!item || typeof item !== 'object') {
              console.warn('🚨 Invalid item found:', item);
              return false;
            }
            return true;
          })
          .map((item, index) => ({
            // ✅ FIX: Ensure required properties exist
            _id: item._id || `temp-${Date.now()}-${index}`,
            name: item.name || `Pet ${index + 1}`,
            type: item.type || 'unknown',
            ...item // Spread the rest of the properties
          }));
        
        console.log('🔧 BrowseLayout Processed items:', {
          originalCount: fetchedItems.length,
          validCount: validItems.length,
          totalFromAPI: totalCount,
          firstItem: validItems[0]
        });
        
        setItems(validItems);
        
      } catch (err) {
        console.error('🚨 BrowseLayout fetch error:', err);
        setError(err.message || 'Failed to load items');
        setItems([]); // Ensure items is empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchParams, apiService, itemsPerPage]);

  // Loading state
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading pets...</p>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Error Loading Pets
          </Alert.Heading>
          <p className="mb-3">{error}</p>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-danger"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-redo me-1"></i>
              Retry
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => {
                setError(null);
                setItems([]);
              }}
            >
              <i className="fas fa-times me-1"></i>
              Clear Error
            </button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info" className="text-center">
          <Alert.Heading>
            <i className="fas fa-search me-2"></i>
            No Pets Found
          </Alert.Heading>
          <p className="mb-3">
            We couldn't find any pets matching your criteria. 
            Try adjusting your search or check back later for new arrivals!
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/browse'}
          >
            <i className="fas fa-paw me-1"></i>
            Browse All Pets
          </button>
        </Alert>
      </Container>
    );
  }

  // Success state - render items
  return (
    <Container className="py-4">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="alert alert-info small mb-4">
          <strong>🔧 Debug:</strong> Loaded {items.length} items
          <details className="mt-2">
            <summary>View item data</summary>
            <pre className="mt-2" style={{ fontSize: '10px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(items.slice(0, 2), null, 2)}
            </pre>
          </details>
        </div>
      )}

      <Row>
        {items.map((item, index) => {
          // ✅ FIX: Extra safety check for each item render
          if (!item) {
            console.warn(`🚨 Item at index ${index} is null/undefined`);
            return null;
          }
          
          return (
            <Col 
              key={item._id || `item-${index}`}
              xs={12} 
              sm={6} 
              md={4} 
              lg={3} 
              className="mb-4"
            >
              <ItemCard 
                pet={item}
                {...(entityConfig?.cardProps || {})}
                showFavoriteButton={true}
                showActions={true}
              />
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default BrowseLayout;