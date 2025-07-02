import express from 'express';
const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ message: 'User registration endpoint working!' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'User login endpoint working!' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint working!' });
});

// Favorites routes to match your frontend API calls
router.get('/favorites', (req, res) => {
  res.json({ message: 'User favorites endpoint working!' });
});

router.post('/favorites/:petId', (req, res) => {
  res.json({ message: `Added pet ${req.params.petId} to favorites!` });
});

router.delete('/favorites/:petId', (req, res) => {
  res.json({ message: `Removed pet ${req.params.petId} from favorites!` });
});

export default router;