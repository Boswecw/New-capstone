// File: client/src/components/CartIcon.js (CREATE NEW FILE)

import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartIcon = ({ className = '' }) => {
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <Button 
      variant="outline-primary" 
      className={`position-relative ${className}`}
      onClick={handleCartClick}
      title="View Cart"
    >
      <i className="fas fa-shopping-cart"></i>
      {cart.totalItems > 0 && (
        <Badge 
          pill 
          bg="danger" 
          className="position-absolute top-0 start-100 translate-middle"
          style={{ fontSize: '0.7rem' }}
        >
          {cart.totalItems > 99 ? '99+' : cart.totalItems}
        </Badge>
      )}
      <span className="visually-hidden">Cart with {cart.totalItems} items</span>
    </Button>
  );
};

export default CartIcon;