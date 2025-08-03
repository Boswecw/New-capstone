// client/src/components/browse/BrowseResults.js - FIXED VERSION
import React from 'react';
import { Row, Col, Alert, Spinner, Button, Pagination } from 'react-bootstrap';

const BrowseResults = ({
  items,
  ItemCard,
  entityConfig,
  pagination,
  currentPage,
  loading,
  error,
  useInfiniteScroll,
  hasMore,
  triggerRef,
  onItemClick,
  onPageChange,
  onRetry
}) => {

  // ✅ FIXED: Function to determine correct prop name for ItemCard
  const getCardProps = (item) => {
    // For PetCard, use 'pet' prop
    if (entityConfig.displayName === 'Pets') {
      return {
        pet: item,
        showFavoriteButton: true,
        onClick: onItemClick ? () => onItemClick(item._id) : null
      };
    }
    
    // For ProductCard, use 'product' prop  
    if (entityConfig.displayName === 'Products') {
      return {
        product: item,
        showActions: true,
        onClick: onItemClick ? () => onItemClick(item._id) : null
      };
    }
    
    // Default fallback
    return {
      item: item,
      onClick: onItemClick ? () => onItemClick(item._id) : null
    };
  };

  const renderPagination = () => {
    if (useInfiniteScroll || !pagination || pagination.totalPages <= 1) {
      return null;
    }

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          showInfo={true}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      </div>
    );
  };

  return (
    <>
      {/* Error State */}
      {error && (
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Oops! Something went wrong
          </Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={onRetry}>
            <i className="fas fa-redo me-2"></i>
            Try Again
          </Button>
        </Alert>
      )}

      {/* Loading State (Non-infinite scroll) */}
      {loading && !useInfiniteScroll && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5 className="text-primary mb-2">Loading {entityConfig.displayName}...</h5>
          <p className="text-muted">Please wait while we fetch the latest data</p>
        </div>
      )}

      {/* No Items State */}
      {!loading && !error && items.length === 0 && (
        <Alert variant="info" className="text-center">
          <Alert.Heading>
            <i className="fas fa-search me-2"></i>
            No {entityConfig.displayName} Found
          </Alert.Heading>
          <p>We couldn't find any {entityConfig.displayName.toLowerCase()} matching your criteria.</p>
          <p className="text-muted mb-0">Try adjusting your search filters or check back later!</p>
        </Alert>
      )}

      {/* Items Grid */}
      {!error && items.length > 0 && (
        <>
          <Row>
            {items.map((item) => {
              // ✅ DEFENSIVE CHECK: Skip if item is null/undefined
              if (!item || !item._id) {
                console.warn('⚠️ BrowseResults: Skipping invalid item:', item);
                return null;
              }

              return (
                <Col key={item._id} sm={6} lg={4} className="mb-4">
                  {/* ✅ FIXED: Pass correct props based on card type */}
                  <ItemCard {...getCardProps(item)} />
                </Col>
              );
            })}
          </Row>

          {/* Infinite Scroll Elements */}
          {useInfiniteScroll && hasMore && (
            <>
              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <h6 className="text-primary mb-2">Loading More {entityConfig.displayName}...</h6>
                </div>
              )}
              
              <div 
                ref={triggerRef} 
                style={{ height: '40px', margin: '30px 0' }}
                className="d-flex justify-content-center align-items-center"
              >
                {!loading && (
                  <div className="bg-light rounded-pill px-4 py-2">
                    <small className="text-muted">
                      <i className="fas fa-arrow-down me-2"></i>
                      Keep scrolling for more {entityConfig.displayName.toLowerCase()}
                      <i className="fas fa-paw ms-2"></i>
                    </small>
                  </div>
                )}
              </div>
            </>
          )}

          {/* All Items Loaded Message (Infinite Scroll) */}
          {useInfiniteScroll && !hasMore && items.length > 12 && (
            <div className="text-center mt-4">
              <Alert variant="success" className="d-inline-block">
                <i className="fas fa-check-circle me-2"></i>
                🎉 You've seen all {items.length} available {entityConfig.displayName.toLowerCase()}! 
                <br />
                <small className="text-muted">Try adjusting filters to discover more</small>
              </Alert>
            </div>
          )}

          {/* Regular Pagination */}
          {renderPagination()}
        </>
      )}
    </>
  );
};

export default BrowseResults;