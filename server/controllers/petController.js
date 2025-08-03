const petController = {
  getAllPets: async (req, res) => {
    try {
      // Your existing logic
      res.json({ message: 'Get all pets' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPetById: async (req, res) => {
    try {
      // Your existing logic
      res.json({ message: `Get pet ${req.params.id}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default petController;