// client/src/pages/Pets.js - UPDATED TO USE BROWSELAYOUT
import React from 'react';
import BrowseLayout from '../components/browse/BrowseLayout';
import { ENTITY_CONFIGS } from '../config/entityConfigs';
import { petAPI } from '../services/api';
import PetCard from '../components/PetCard';

const Pets = () => {
  return (
    <BrowseLayout
      entityConfig={ENTITY_CONFIGS.pets}
      apiService={petAPI}
      ItemCard={PetCard}
      useInfiniteScroll={false}
      itemsPerPage={20}
    />
  );
};

export default Pets;