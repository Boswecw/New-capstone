
// client/src/components/browse/BrowseResults.js
import React from 'react';
import { Row, Col, Alert, Button, Spinner, Pagination } from 'react-bootstrap';

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
  
  // Results header
  const renderResultsHeader = () => {
    if (useInfiniteScroll) {
      return (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">
            {pagination.total > 0 
              ? `Showing ${items.length} of ${pagination.total} ${entityConfig.displayName.toLowerCase()}${hasMore ? ' - scroll for more' : ''}`
              : `No ${entityConfig.displayName.toLowerCase()} found`
            }
          </span>
          {loading && <Spinner size="sm" animation="border" />}
        </div>
      );
    } else {
      return (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">
            {pagination.total > 0 
              ? `Page ${currentPage} of ${Math.ceil(pagination.total / (pagination.limit || 12))} - ${pagination.total} total ${entityConfig.displayName.toLowerCase()}`
              : `No ${entityConfig.displayName.toLowerCase()} found`
            }
          </span>
          {loading && <Spinner size="sm" animation="border" />}
        </div>
      );
    }
  };

  // Error state
  if (error) {
    return (
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error Loading {entityConfig.displayName}
        </Alert.Heading>
        <p className="mb-0">{error}</p>
        <hr />
        <Button variant="outline-danger" onClick={onRetry}>
          <i className="fas fa-redo me-2"></i>
          Try Again
        </Button>
      </Alert>
    );
  }

  // No results
  if (!loading && items.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <Alert.Heading>
          <i className="fas fa-search me-2"></i>
          No {entityConfig.displayName} Found
        </Alert.Heading>
        <p>Try adjusting your filters to find more {entityConfig.displayName.toLowerCase()}.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          <i className="fas fa-undo me-2"></i>
          Reset All Filters
        </Button>
      </Alert>
    );
  }

  // Pagination component for non-infinite scroll
  const renderPagination = () => {
    if (useInfiniteScroll || !pagination.total) return null;
    
    const totalPages = Math.ceil(pagination.total / (pagination.limit || 12));
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      />
    );

    // First page
    if (start > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => onPageChange(1)}>
          1
        </Pagination.Item>
      );
      if (start > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Visible pages
    for (let page = start; page <= end; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    );

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>{items}</Pagination>
      </div>
    );
  };

  return (
    <>
      {renderResultsHeader()}

      {/* Items Grid */}
      {items.length > 0 && (
        <>
          <Row>
            {items.map((item) => (
              <Col key={item._id} sm={6} lg={4} className="mb-4">
                <ItemCard 
                  item={item}
                  onClick={() => onItemClick(item._id)}
                />
              </Col>
            ))}
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