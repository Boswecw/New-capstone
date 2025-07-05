// client/src/pages/Pets.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// Since you already have Browse.js with full functionality,
// redirect /pets to /browse or use Browse component directly
const Pets = () => {
  // Option 1: Redirect to browse
  return <Navigate to="/browse" replace />;
  
  // Option 2: If you want to use Browse component directly, uncomment this:
  // import Browse from './Browse';
  // return <Browse />;
};

export default Pets;