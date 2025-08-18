// client/src/pages/Browse.js - UPDATED TO USE NEW SYSTEM
import React from 'react';
import BrowseLayout from '../components/browse/BrowseLayout';
import { ENTITY_CONFIGS } from '../config/entityConfigs';
import { petAPI } from '../services/api';
import PetCard from '../components/PetCard';

const Browse = () => {
  return (
    <BrowseLayout
      entityConfig={ENTITY_CONFIGS.pets}
      apiService={petAPI}
      ItemCard={PetCard}
      useInfiniteScroll={true}  // Enable infinite scroll for better UX
      itemsPerPage={12}
    />
  );
};

export default Browse;