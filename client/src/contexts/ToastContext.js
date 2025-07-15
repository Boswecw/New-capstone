import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ message, variant = 'info', delay = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant, delay }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, delay + 200); // Extra time for fadeout
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer position="bottom-end" className="p-3">
        {toasts.map(({ id, message, variant }) => (
          <Toast key={id} bg={variant} className="text-white">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
