// ===== REACT SHOPPING CART CONTEXT =====
// File: client/src/contexts/CartContext.js (CREATE NEW FILE)

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        totalAmount: action.payload.totalAmount || 0,
        totalItems: action.payload.totalItems || 0,
        loading: false
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'ADD_ITEM':
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount,
        totalItems: action.payload.totalItems
      };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount,
        totalItems: action.payload.totalItems
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalAmount: 0,
        totalItems: 0
      };
    
    default:
      return state;
  }
};

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  loading: true
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  // Generate session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const sessionId = getSessionId();
      const response = await api.get(`/cart?sessionId=${sessionId}`);
      
      if (response.data.success) {
        dispatch({ type: 'SET_CART', payload: response.data.data });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const sessionId = getSessionId();
      
      const response = await api.post('/cart/add', {
        productId,
        quantity,
        sessionId
      });
      
      if (response.data.success) {
        dispatch({ type: 'ADD_ITEM', payload: response.data.data });
        toast.success('Item added to cart!');
        return true;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
      return false;
    }
  };

  const updateCartItem = async (itemIndex, quantity) => {
    try {
      const sessionId = getSessionId();
      
      const response = await api.put(`/cart/update/${itemIndex}`, {
        quantity,
        sessionId
      });
      
      if (response.data.success) {
        dispatch({ type: 'UPDATE_ITEM', payload: response.data.data });
        toast.success(quantity === 0 ? 'Item removed from cart' : 'Cart updated');
        return true;
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const sessionId = getSessionId();
      
      const response = await api.delete(`/cart/clear?sessionId=${sessionId}`);
      
      if (response.data.success) {
        dispatch({ type: 'CLEAR_CART' });
        toast.success('Cart cleared');
        return true;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      return false;
    }
  };

  const value = {
    cart,
    addToCart,
    updateCartItem,
    clearCart,
    loadCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};