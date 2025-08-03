
// client/src/pages/Browse.js - NEW SIMPLIFIED VERSION
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
      useInfiniteScroll={true}
      itemsPerPage={12}
    />
  );
};

export default Browse;