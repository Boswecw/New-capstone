import React from 'react';
import { Card } from 'react-bootstrap';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`bg-${color} text-white rounded p-3 me-3`}>
            <i className={`fas ${icon} fa-2x`}></i>
          </div>
          <div>
            <h3 className="mb-0">{value}</h3>
            <h6 className="text-muted mb-0">{title}</h6>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;