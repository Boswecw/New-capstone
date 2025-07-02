import express from 'express';
const router = express.Router();

// Your existing routes
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard endpoint working!' });
});

export default router;