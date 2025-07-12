// server/routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pet = require('../models/Pet');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');

// ✅ FIXED: corrected import
const { protect, admin: adminOnly } = require('../middleware/auth');

// ✅ Middleware for admin routes
router.use(protect, adminOnly);

// 🚀 Admin Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const [totalPets, availablePets, totalUsers, totalContacts, newContacts] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ available: true }),
      User.countDocuments(),
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
    ]);

    const recentPets = await Pet.find().sort({ createdAt: -1 }).limit(5);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalPets,
          availablePets,
          totalUsers,
          totalContacts,
          newContacts,
        },
        recent: {
          pets: recentPets,
          users: recentUsers,
          contacts: recentContacts,
        }
      }
    });
  } catch (err) {
    console.error('Error in /admin/stats:', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

// 👥 All Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error in /admin/users:', err);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// ❌ Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// 📊 Analytics (Mocked)
router.get('/analytics', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalVisits: 12543,
        uniqueVisitors: 8932,
        adoptionInquiries: 156,
        successfulAdoptions: 23,
        topPages: [
          { page: "/dogs", visits: 3421 },
          { page: "/cats", visits: 2876 },
          { page: "/browse", visits: 1987 },
          { page: "/aquatics", visits: 1234 },
        ],
        demographics: {
          ageGroups: [
            { range: "18-24", percentage: 15 },
            { range: "25-34", percentage: 35 },
            { range: "35-44", percentage: 25 },
            { range: "45-54", percentage: 15 },
            { range: "55+", percentage: 10 },
          ],
        },
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// 📄 Report Download (Mock CSV)
router.get('/reports/:type', async (req, res) => {
  const { type } = req.params;
  const timestamp = new Date().toISOString().split('T')[0];
  const content = `Report Type: ${type}\nDate: ${timestamp}\n\nID,Name,Status\n1,Sample,Active`;

  res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${timestamp}.csv`);
  res.setHeader('Content-Type', 'text/csv');
  res.send(content);
});

// ⚙️ Settings - GET
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne() || {};
    res.json(settings);
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ success: false, message: 'Error loading settings' });
  }
});

// ⚙️ Settings - PUT
router.put('/settings', async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate({}, req.body, {
      upsert: true,
      new: true,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
});

module.exports = router;
