const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'resolved'],
    default: 'new'
  },
  response: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);