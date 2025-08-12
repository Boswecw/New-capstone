// File: client/src/pages/Cart.js (CREATE NEW FILE)

import React from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';

const Cart = () => {
  const { cart, updateCartItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading cart...</span>
          </Spinner>
          <div className="mt-3">Loading your cart...</div>
        </div>
      </Container>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center shadow-sm">
              <Card.Body className="py-5">
                <i className="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
                <h3>Your Cart is Empty</h3>
                <p className="text-muted">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="mt-3"
                >
                  <i className="fas fa-shopping-bag me-2"></i>
                  Start Shopping
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const handleQuantityChange = async (itemIndex, newQuantity) => {
    if (newQuantity < 0 || newQuantity > 10) return;
    await updateCartItem(itemIndex, newQuantity);
  };

  const handleRemoveItem = async (itemIndex) => {
    await updateCartItem(itemIndex, 0);
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : price;
  };

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-shopping-cart me-2"></i>
                Your Cart ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
              </h5>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={clearCart}
                disabled={cart.items.length === 0}
              >
                <i className="fas fa-trash me-1"></i>
                Clear Cart
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '100px' }}>Image</th>
                    <th>Product</th>
                    <th style={{ width: '120px' }}>Price</th>
                    <th style={{ width: '150px' }}>Quantity</th>
                    <th style={{ width: '120px' }}>Total</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ width: '80px', height: '80px' }}>
                          <SafeImage
                            item={item.product}
                            category="product"
                            className="w-100 h-100 rounded"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td>
                        <div>
                          <h6 className="mb-1">{item.product?.name || 'Unknown Product'}</h6>
                          <small className="text-muted">
                            Category: {item.product?.category || 'N/A'}
                          </small>
                          {!item.product?.inStock && (
                            <Badge bg="warning" className="ms-2">Out of Stock</Badge>
                          )}
                        </div>
                      </td>
                      <td className="fw-bold">
                        {formatPrice(item.price)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="fas fa-minus"></i>
                          </Button>
                          <span className="mx-3 fw-bold">{item.quantity}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            disabled={item.quantity >= 10 || !item.product?.inStock}
                          >
                            <i className="fas fa-plus"></i>
                          </Button>
                        </div>
                      </td>
                      <td className="fw-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          title="Remove item"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal ({cart.totalItems} items):</span>
                <span className="fw-bold">{formatPrice(cart.totalAmount)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Shipping:</span>
                <span className="text-success">Free</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Tax:</span>
                <span>{formatPrice(cart.totalAmount * 0.08)}</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <span className="h5">Total:</span>
                <span className="h5 text-primary fw-bold">
                  {formatPrice(cart.totalAmount * 1.08)}
                </span>
              </div>

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  disabled={cart.items.length === 0 || cart.items.some(item => !item.product?.inStock)}
                >
                  <i className="fas fa-credit-card me-2"></i>
                  Proceed to Checkout
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  onClick={() => navigate('/products')}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Continue Shopping
                </Button>
              </div>

              {cart.items.some(item => !item.product?.inStock) && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <small>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Some items are out of stock and cannot be purchased.
                  </small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;