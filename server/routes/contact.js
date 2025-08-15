// server/routes/contact.js - Updated Contact Routes
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, admin } = require('../middleware/auth');
const { validateContactSubmission, validateObjectId } = require('../middleware/validation');

// POST /api/contact - Submit contact form
router.post('/', validateContactSubmission, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      subject: subject || 'General Inquiry',
      message,
      status: 'new'
    });

    await contact.save();

    res.status(201).json({
      success: true,
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: contact.createdAt
      },
      message: 'Contact message sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting contact form', error: error.message });
  }
});

// GET /api/contact - Get all contact submissions (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, search, limit = 20, page = 1, sort = 'createdAt' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'email':
        sortOptions.email = 1;
        break;
      case 'status':
        sortOptions.status = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalContacts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      },
      message: 'Contact submissions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contacts', error: error.message });
  }
});

module.exports = router;