// ===== server/controllers/contactController.js =====
const mongoose = require('mongoose');
const Contact = require('../models/Contact');

// ---- helpers ----
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const sendError = (res, status, message, err) =>
  res.status(status).json({ success: false, message, error: err ? String(err) : undefined });

const sanitize = (s) => (typeof s === 'string' ? s.trim() : s);
const normalizeEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : e);

// Allowed statuses for safety
const CONTACT_STATUSES = new Set(['new', 'read', 'responded', 'resolved']);

// ---- Controllers ----

// POST /contact  (public)
const submitContact = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body || {};
    name = sanitize(name);
    email = normalizeEmail(email);
    subject = sanitize(subject) || 'General Inquiry';
    message = sanitize(message);

    if (!name || !email || !message) {
      return sendError(res, 400, 'Name, email, and message are required.');
    }

    const contact = new Contact({
      name,
      email,
      subject,
      message,
      status: 'new',
    });

    await contact.save();

    return res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Error submitting contact form', error.message);
  }
};

// GET /contact?status=&search=&page=&limit=  (admin)
const getAllContacts = async (req, res) => {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const { status } = req.query;
    const search = sanitize(req.query.search);

    const filter = {};
    if (status && CONTACT_STATUSES.has(status)) {
      filter.status = status;
    }
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { name: rx },
        { email: rx },
        { subject: rx },
        { message: rx },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('response.respondedBy', 'username email'),
      Contact.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: contacts,
      pagination: {
        current: page,
        pages: Math.max(1, Math.ceil(total / limit)),
        total,
        limit,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Error fetching contacts', error.message);
  }
};

// GET /contact/:id (admin)
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return sendError(res, 400, 'Invalid contact ID');

    const contact = await Contact.findById(id).populate(
      'response.respondedBy',
      'username email'
    );
    if (!contact) return sendError(res, 404, 'Contact not found');

    return res.json({ success: true, data: contact });
  } catch (error) {
    return sendError(res, 500, 'Error fetching contact', error.message);
  }
};

// PUT /contact/:id/status  (admin)
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = sanitize(req.body?.status);

    if (!isObjectId(id)) return sendError(res, 400, 'Invalid contact ID');
    if (!nextStatus || !CONTACT_STATUSES.has(nextStatus)) {
      return sendError(res, 400, 'Invalid status value');
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { $set: { status: nextStatus } },
      { new: true }
    ).populate('response.respondedBy', 'username email');

    if (!updated) return sendError(res, 404, 'Contact not found');

    return res.json({
      success: true,
      message: 'Contact status updated',
      data: updated,
    });
  } catch (error) {
    return sendError(res, 500, 'Error updating status', error.message);
  }
};

// PUT /contact/:id/respond  (admin)
const respondToContact = async (req, res) => {
  try {
    const { id } = req.params;
    let { message } = req.body || {};
    message = sanitize(message);

    if (!isObjectId(id)) return sendError(res, 400, 'Invalid contact ID');
    if (!message) return sendError(res, 400, 'Response message is required');

    // Prefer authenticated user if available (protect middleware should set req.user)
    const responderId = req.user?.id && isObjectId(req.user.id) ? req.user.id : undefined;

    const update = {
      $set: {
        response: {
          message,
          respondedAt: new Date(),
          ...(responderId ? { respondedBy: responderId } : {}),
        },
        status: 'responded',
      },
    };

    const updated = await Contact.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate('response.respondedBy', 'username email');

    if (!updated) return sendError(res, 404, 'Contact not found');

    return res.json({
      success: true,
      message: 'Response recorded successfully',
      data: updated,
    });
  } catch (error) {
    return sendError(res, 500, 'Error sending response', error.message);
  }
};

// DELETE /contact/:id  (admin)
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return sendError(res, 400, 'Invalid contact ID');

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) return sendError(res, 404, 'Contact not found');

    return res.json({
      success: true,
      message: 'Contact deleted successfully',
      data: { id },
    });
  } catch (error) {
    return sendError(res, 500, 'Error deleting contact', error.message);
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  respondToContact,
  deleteContact,
};
