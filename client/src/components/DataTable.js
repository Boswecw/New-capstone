import React from 'react';
import { Table, Button, Badge, Pagination } from 'react-bootstrap';

const DataTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onView,
  pagination,
  onPageChange,
  loading 
}) => {
  const renderCellContent = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], item);
    
    if (column.type === 'badge') {
      const variant = column.badgeVariant ? column.badgeVariant(value) : 'primary';
      return <Badge bg={variant}>{value}</Badge>;
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    return value || '-';
  };

  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null;

    const items = [];
    for (let i = 1; i <= pagination.pages; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === pagination.current}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">
          Showing page {pagination.current} of {pagination.pages} ({pagination.total} total)
        </small>
        <Pagination className="mb-0">
          <Pagination.Prev 
            disabled={pagination.current === 1}
            onClick={() => onPageChange(pagination.current - 1)}
          />
          {items}
          <Pagination.Next 
            disabled={pagination.current === pagination.pages}
            onClick={() => onPageChange(pagination.current + 1)}
          />
        </Pagination>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table responsive striped hover>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id || index}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {renderCellContent(item, column)}
                </td>
              ))}
              <td>
                <div className="btn-group" role="group">
                  {onView && (
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => onView(item)}
                      title="View"
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDelete(item)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-4">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5>No data found</h5>
          <p className="text-muted">No records match your current filters.</p>
        </div>
      )}
      
      {renderPagination()}
    </>
  );
};

export default DataTable;