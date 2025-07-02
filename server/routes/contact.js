import express from 'express';
const router = express.Router();

// Your existing routes
router.post('/', (req, res) => {
  res.json({ message: 'Contact submission endpoint working!' });
});

export default router;