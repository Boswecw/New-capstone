const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  subject: {
    type: String,
    default: 'General Inquiry',
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['new', 'read', 'responded', 'resolved'],
      message: 'Status must be one of: new, read, responded, resolved'
    },
    default: 'new'
  },
  response: {
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Response cannot exceed 1000 characters']
    },
    respondedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    respondedAt: {
      type: Date
    }
  },
  // Optional enhancements
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['adoption', 'volunteer', 'donation', 'general', 'complaint'],
    default: 'general'
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  petInterest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ category: 1 });

// Virtual for days since submission
contactSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get unread contacts
contactSchema.statics.getUnread = function() {
  return this.find({ status: { $in: ['new', 'read'] } })
    .sort({ createdAt: -1 });
};

// Static method to get by status
contactSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Method to mark as read
contactSchema.methods.markAsRead = function() {
  if (this.status === 'new') {
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Contact', contactSchema);