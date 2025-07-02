import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    message: 'Pets endpoint working!',
    data: [
      { id: 1, name: 'Buddy', type: 'dog' },
      { id: 2, name: 'Whiskers', type: 'cat' }
    ]
  });
});

router.get('/featured', (req, res) => {
  res.json({
    message: 'Featured pets endpoint working!',
    data: [
      { id: 1, name: 'Buddy', type: 'dog', featured: true }
    ]
  });
});

export default router;