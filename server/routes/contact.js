// server/routes/contact.js - Updated Contact Routes
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, admin } = require('../middleware/auth');
const { validateContactSubmission, validateObjectId } = require('../middleware/validation');

// Helper function for async error handling
const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== PUBLIC ROUTES =====

// POST /api/contact - Submit contact form (public)
router.post('/', validateContactSubmission, handleAsyncError(async (req, res) => {
  try {
    console.log('📧 New contact form submission:', req.body);

    const { name, email, subject, message } = req.body;

    // Create new contact record
    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim(),
      status: 'new',
      submittedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await contact.save();

    console.log('✅ Contact form saved:', contact._id);

    // Return success response (don't expose internal details)
    res.status(201).json({
      success: true,
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        submittedAt: contact.submittedAt
      },
      message: 'Thank you for your message! We will get back to you soon.'
    });

    // TODO: Send email notification to admins (if enabled in settings)
    // TODO: Send auto-reply to user (if enabled in settings)

  } catch (error) {
    console.error('❌ Contact form error:', error);
    
    // Handle duplicate submissions (same email + message within time window)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'We recently received a similar message from you. Please wait before submitting again.'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Sorry, there was an error sending your message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// ===== ADMIN ROUTES =====

// GET /api/contact - Get all contact submissions (admin only)
router.get('/', protect, admin, handleAsyncError(async (req, res) => {
  try {
    console.log('📧 Admin fetching contacts with query:', req.query);

    const { 
      status, 
      search, 
      limit = 20, 
      page = 1, 
      sort = 'createdAt',
      dateFrom,
      dateTo
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Pagination
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    // Sort options
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
      case 'subject':
        sortOptions.subject = 1;
        break;
      default:
        sortOptions.createdAt = -1; // Newest first by default
    }

    // Execute query with pagination
    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .lean(); // Use lean() for better performance

    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limitNum);

    console.log(`✅ Found ${contacts.length} contacts (${totalContacts} total)`);

    // Get statistics for dashboard
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limitNum
      },
      stats: statusStats,
      filters: {
        status: status || 'all',
        search: search || '',
        sort,
        dateFrom,
        dateTo
      },
      message: 'Contacts retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contacts',
      error: error.message 
    });
  }
}));

// GET /api/contact/:id - Get single contact (admin only)
router.get('/:id', protect, admin, validateObjectId, handleAsyncError(async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read when admin views it
    if (contact.status === 'new') {
      contact.status = 'read';
      contact.readAt = new Date();
      contact.readBy = req.user._id;
      await contact.save();
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contact',
      error: error.message 
    });
  }
}));

// PUT /api/contact/:id - Update contact status (admin only)
router.put('/:id', protect, admin, validateObjectId, handleAsyncError(async (req, res) => {
  try {
    console.log(`📧 Updating contact ${req.params.id}:`, req.body);

    const { status, notes, priority } = req.body;
    
    const updateData = {
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    // Update status if provided
    if (status) {
      updateData.status = status;
      
      // Set timestamps for status changes
      if (status === 'read' && !updateData.readAt) {
        updateData.readAt = new Date();
        updateData.readBy = req.user._id;
      } else if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user._id;
      }
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.adminNotes = notes;
    }

    // Update priority if provided
    if (priority !== undefined) {
      updateData.priority = priority;
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    console.log('✅ Contact updated successfully');

    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update contact',
      error: error.message 
    });
  }
}));

// DELETE /api/contact/:id - Delete contact (admin only)
router.delete('/:id', protect, admin, validateObjectId, handleAsyncError(async (req, res) => {
  try {
    console.log(`📧 Deleting contact ${req.params.id}`);

    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    console.log('✅ Contact deleted successfully');

    res.json({
      success: true,
      data: { deletedId: req.params.id },
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete contact',
      error: error.message 
    });
  }
}));

// POST /api/contact/bulk-update - Bulk update contacts (admin only)
router.post('/bulk-update', protect, admin, handleAsyncError(async (req, res) => {
  try {
    const { contactIds, updates } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    console.log(`📧 Bulk updating ${contactIds.length} contacts:`, updates);

    // Add metadata to updates
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: req.user._id
    };

    // Handle status-specific timestamps
    if (updates.status === 'read') {
      updateData.readAt = new Date();
      updateData.readBy = req.user._id;
    } else if (updates.status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const result = await Contact.updateMany(
      { _id: { $in: contactIds } },
      updateData
    );

    console.log(`✅ Bulk update completed: ${result.modifiedCount} contacts updated`);

    res.json({
      success: true,
      data: { 
        updatedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `${result.modifiedCount} contacts updated successfully`
    });
  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update contacts',
      error: error.message 
    });
  }
}));

// POST /api/contact/bulk-delete - Bulk delete contacts (admin only)
router.post('/bulk-delete', protect, admin, handleAsyncError(async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs array is required'
      });
    }

    console.log(`📧 Bulk deleting ${contactIds.length} contacts`);

    const result = await Contact.deleteMany({ 
      _id: { $in: contactIds } 
    });

    console.log(`✅ Bulk delete completed: ${result.deletedCount} contacts deleted`);

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} contacts deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete contacts',
      error: error.message 
    });
  }
}));

// GET /api/contact/stats - Get contact statistics (admin only)
router.get('/admin/stats', protect, admin, handleAsyncError(async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysMap = { '7days': 7, '30days': 30, '90days': 90, '1year': 365 };
    const days = daysMap[period] || 30;
    const startDate = new Date(now - (days * 24 * 60 * 60 * 1000));

    // Get statistics
    const [
      totalContacts,
      newContacts,
      periodContacts,
      statusBreakdown,
      dailyStats
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ createdAt: { $gte: startDate } }),
      Contact.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Contact.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    const stats = {
      total: totalContacts,
      new: newContacts,
      period: periodContacts,
      breakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      daily: dailyStats,
      responseRate: totalContacts > 0 ? 
        Math.round(((totalContacts - newContacts) / totalContacts) * 100) : 0
    };

    res.json({
      success: true,
      data: stats,
      message: 'Contact statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contact statistics',
      error: error.message 
    });
  }
}));

module.exports = router;