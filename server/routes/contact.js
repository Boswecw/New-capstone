// ===== server/routes/contact.js =====
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const { protect, admin } = require('../middleware/auth');
const { validateContactSubmission, validateObjectId } = require('../middleware/validation');

// Helpers
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const sanitize = (s) => (typeof s === 'string' ? s.trim() : s);
const normalizeEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : e);
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const sendErr = (res, status, message, error) =>
  res.status(status).json({ success: false, message, error: error ? String(error) : undefined });

const VALID_STATUSES = ['new', 'read', 'responded', 'resolved'];

// POST /api/contact - Submit contact form (public)
router.post('/', validateContactSubmission, async (req, res) => {
  try {
    let { name, email, subject, message } = req.body || {};
    name = sanitize(name);
    email = normalizeEmail(email);
    subject = sanitize(subject) || 'General Inquiry';
    message = sanitize(message);

    if (!name || !email || !message) {
      return sendErr(res, 400, 'Name, email, and message are required.');
    }

    const contact = new Contact({
      name,
      email,
      subject,
      message,
      status: 'new',
    });

    await contact.save();

    // TODO: send admin notification email here

    return res.status(201).json({
      success: true,
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: contact.createdAt,
      },
      message: 'Contact message sent successfully',
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return sendErr(res, 500, 'Error submitting contact form', error.message);
  }
});

// GET /api/contact - List contacts (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, search, sort = 'createdAt', page = 1, limit = 20 } = req.query;
    const pageNum = toInt(page, 1);
    const limitNum = toInt(limit, 20);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && VALID_STATUSES.includes(status)) query.status = status;

    if (search && String(search).trim()) {
      const rx = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
    }

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

    const [contacts, totalContacts, statusAgg] = await Promise.all([
      Contact.find(query)
        .sort(sortOptions)
        .limit(limitNum)
        .skip(skip)
        .populate('response.respondedBy', 'name username email'),
      Contact.countDocuments(query),
      Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalContacts / limitNum));
    const statusCounts = statusAgg.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalContacts,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum,
      },
      stats: { statusCounts },
      message: 'Contact submissions retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return sendErr(res, 500, 'Error fetching contacts', error.message);
  }
});

// GET /api/contact/:id - Single contact (admin)
router.get('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return sendErr(res, 400, 'Invalid contact ID');

    const contact = await Contact.findById(id).populate(
      'response.respondedBy',
      'name username email'
    );
    if (!contact) return sendErr(res, 404, 'Contact submission not found');

    // Mark as read if it was new
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    return res.json({
      success: true,
      data: contact,
      message: 'Contact submission retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return sendErr(res, 500, 'Error fetching contact', error.message);
  }
});

// PUT /api/contact/:id/status - Update status (admin)
router.put('/:id/status', protect, admin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = sanitize(req.body?.status);
    if (!VALID_STATUSES.includes(nextStatus)) {
      return sendErr(res, 400, 'Invalid status. Must be one of: new, read, responded, resolved');
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { $set: { status: nextStatus } },
      { new: true }
    ).populate('response.respondedBy', 'name username email');

    if (!updated) return sendErr(res, 404, 'Contact submission not found');

    return res.json({
      success: true,
      data: updated,
      message: 'Contact status updated successfully',
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    return sendErr(res, 500, 'Error updating contact status', error.message);
  }
});

// PUT /api/contact/:id/respond - Add/Update response (admin)  <-- PUT to match frontend
router.put('/:id/respond', protect, admin, validateObjectId, async (req, res) => {
  try {
    let { message } = req.body || {};
    message = sanitize(message);
    if (!message) return sendErr(res, 400, 'Response message is required');

    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return sendErr(res, 404, 'Contact submission not found');

    contact.response = {
      message,
      respondedBy: req.user?._id,
      respondedAt: new Date(),
    };
    contact.status = 'responded';
    await contact.save();

    await contact.populate('response.respondedBy', 'name username email');

    // TODO: optionally send email to the customer with the response

    return res.json({
      success: true,
      data: contact,
      message: 'Response added successfully',
    });
  } catch (error) {
    console.error('Error adding response:', error);
    return sendErr(res, 500, 'Error adding response', error.message);
  }
});

// DELETE /api/contact/:id - Delete submission (admin)
router.delete('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) return sendErr(res, 404, 'Contact submission not found');

    return res.json({
      success: true,
      message: 'Contact submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return sendErr(res, 500, 'Error deleting contact', error.message);
  }
});

// GET /api/contact/stats/dashboard - Dashboard stats (admin)
router.get('/stats/dashboard', protect, admin, async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [totalContacts, newContacts, pendingContacts, recentContacts, monthlyTrends, statusDistribution, recentUnread] =
      await Promise.all([
        Contact.countDocuments(),
        Contact.countDocuments({ status: 'new' }),
        Contact.countDocuments({ status: { $in: ['new', 'read'] } }),
        Contact.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Contact.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),
        Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Contact.find({ status: { $in: ['new', 'read'] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email subject createdAt status'),
      ]);

    return res.json({
      success: true,
      data: {
        overview: { totalContacts, newContacts, pendingContacts, recentContacts },
        trends: monthlyTrends,
        statusDistribution: statusDistribution.reduce((acc, x) => {
          acc[x._id] = x.count;
          return acc;
        }, {}),
        recentUnread,
      },
      message: 'Contact statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return sendErr(res, 500, 'Error fetching contact statistics', error.message);
  }
});

module.exports = router;
