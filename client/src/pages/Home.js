// Fix for Home.js - Add this to your fetchFeaturedPets function

const fetchFeaturedPets = useCallback(async () => {
  try {
    console.log('🏠 Home: Fetching random featured pets...');
    
    // ✅ FIXED: Get more pets and randomize on frontend
    // Since all your 55 pets have featured=true, we'll get a larger sample and randomize
    const response = await petAPI.getAllPets({ 
      featured: true, 
      limit: 20,  // Get 20 pets instead of 4
      status: 'available',
      sort: 'newest'  // or 'random' if your backend supports it
    });
    
    const allPets = response.data?.data || [];
    
    if (allPets.length > 0) {
      // ✅ RANDOMIZE: Shuffle the array and take first 4
      const shuffledPets = allPets.sort(() => Math.random() - 0.5);
      const randomFeaturedPets = shuffledPets.slice(0, 4);
      
      console.log('✅ Random featured pets loaded:', randomFeaturedPets.length);
      setFeaturedPets(randomFeaturedPets);
      setPetsError(null);
      
      if (!isInitialLoad) {
        showSuccess(`${randomFeaturedPets.length} featured pets loaded!`);
      }
    } else {
      setPetsError('No featured pets available at this time.');
      showInfo('No featured pets available right now. Check back soon!');
    }
  } catch (err) {
    console.error('❌ Error loading featured pets:', err);
    const errorMessage = 'Unable to load featured pets at this time.';
    setPetsError(errorMessage);
    showError(errorMessage);
  }
}, [isInitialLoad, showSuccess, showInfo, showError]);