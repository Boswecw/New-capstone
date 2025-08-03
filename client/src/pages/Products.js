
// client/src/pages/Products.js - NEW SIMPLIFIED VERSION  
import React from 'react';
import BrowseLayout from '../components/browse/BrowseLayout';
import { ENTITY_CONFIGS } from '../config/entityConfigs';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
  return (
    <BrowseLayout
      entityConfig={ENTITY_CONFIGS.products}
      apiService={productAPI}
      ItemCard={ProductCard}
      useInfiniteScroll={false}
      itemsPerPage={12}
    />
  );
};

export default Products;