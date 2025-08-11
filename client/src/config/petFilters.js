// client/src/config/petFilters.js - CLEAN CONFIG ONLY (NO REACT CODE)

export const PET_CATEGORIES = {
  ALL: 'all',
  DOGS: 'dog',        
  CATS: 'cat',        
  AQUATIC: 'aquatic', 
  OTHER: 'other'      
};

export const PET_TYPES = {
  dog: { label: 'Dogs', category: 'dog', icon: '🐕' },
  cat: { label: 'Cats', category: 'cat', icon: '🐱' },
  fish: { label: 'Fish', category: 'aquatic', icon: '🐠' },
  bird: { label: 'Birds', category: 'other', icon: '🦜' },
  'fancy-rat': { label: 'Fancy Rats', category: 'other', icon: '🐭' },
  'guinea-pig': { label: 'Guinea Pigs', category: 'other', icon: '🐹' },
  'sugar-glider': { label: 'Sugar Gliders', category: 'other', icon: '🐿️' },
  chinchilla: { label: 'Chinchillas', category: 'other', icon: '🐭' },
  ferret: { label: 'Ferrets', category: 'other', icon: '🦔' },
  hedgehog: { label: 'Hedgehogs', category: 'other', icon: '🦔' },
  hamster: { label: 'Hamsters', category: 'other', icon: '🐹' },
  rabbit: { label: 'Rabbits', category: 'other', icon: '🐰' },
  gerbil: { label: 'Gerbils', category: 'other', icon: '🐭' },
  stoat: { label: 'Stoats', category: 'other', icon: '🦔' }
};

export const FILTER_GROUPS = {
  type: {
    label: 'Pet Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'dog', label: 'Dogs (16)' },
      { value: 'cat', label: 'Cats (9)' },
      { value: 'fish', label: 'Fish (9)' },
      { value: 'fancy-rat', label: 'Fancy Rats (5)' },
      { value: 'ferret', label: 'Ferrets (3)' },
      { value: 'hamster', label: 'Hamsters (2)' },
      { value: 'guinea-pig', label: 'Guinea Pigs (2)' },
      { value: 'chinchilla', label: 'Chinchillas (2)' },
      { value: 'rabbit', label: 'Rabbits (2)' },
      { value: 'hedgehog', label: 'Hedgehogs (2)' },
      { value: 'bird', label: 'Birds (1)' },
      { value: 'gerbil', label: 'Gerbils (1)' },
      { value: 'stoat', label: 'Stoats (1)' },
      { value: 'sugar-glider', label: 'Sugar Gliders (1)' }
    ]
  }
};