// server/models/Contact.js - Updated Contact Model
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Basic contact information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    maxlength: [255, 'Email cannot exceed 255 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    minlength: [10, 'Message must be at least 10 characters']
  },

  // Contact metadata
  status: {
    type: String,
    enum: {
      values: ['new', 'read', 'in_progress', 'resolved', 'spam'],
      message: 'Status must be one of: new, read, in_progress, resolved, spam'
    },
    default: 'new',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Priority must be one of: low, normal, high, urgent'
    },
    default: 'normal'
  },
  category: {
    type: String,
    enum: {
      values: ['general', 'adoption', 'support', 'complaint', 'suggestion', 'other'],
      message: 'Category must be one of: general, adoption, support, complaint, suggestion, other'
    },
    default: 'general'
  },

  // Admin fields
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Tracking fields
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responseAt: {
    type: Date
  },
  responseBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Technical metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  referrer: {
    type: String,
    trim: true,
    maxlength: [500, 'Referrer cannot exceed 500 characters']
  },

  // Contact source and context
  source: {
    type: String,
    enum: ['website', 'email', 'phone', 'social', 'referral', 'other'],
    default: 'website'
  },
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'email'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },

  // Follow-up and communication
  followUpRequired: {
    type: Boolean,
    default: true
  },
  followUpDate: {
    type: Date
  },
  communicationHistory: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'note'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Communication content cannot exceed 1000 characters']
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],

  // Flags and markers
  isSpam: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  requiresFollowUp: {
    type: Boolean,
    default: true
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    },
    submittedAt: {
      type: Date
    }
  },

  // Related records
  relatedPet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Version control
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'contacts'
});

// ===== INDEXES =====
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ priority: 1, status: 1 });
contactSchema.index({ assignedTo: 1, status: 1 });
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ readAt: -1 });
contactSchema.index({ resolvedAt: -1 });

// Text search index
contactSchema.index({
  name: 'text',
  email: 'text',
  subject: 'text',
  message: 'text',
  adminNotes: 'text'
});

// ===== VIRTUALS =====
contactSchema.virtual('isNew').get(function() {
  return this.status === 'new';
});

contactSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved';
});

contactSchema.virtual('responseTime').get(function() {
  if (this.responseAt && this.submittedAt) {
    return this.responseAt - this.submittedAt;
  }
  return null;
});

contactSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt && this.submittedAt) {
    return this.resolvedAt - this.submittedAt;
  }
  return null;
});

contactSchema.virtual('age').get(function() {
  return Date.now() - this.submittedAt;
});

contactSchema.virtual('formattedAge').get(function() {
  const age = this.age;
  const days = Math.floor(age / (1000 * 60 * 60 * 24));
  const hours = Math.floor((age % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
});

// ===== MIDDLEWARE =====
// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Auto-set read timestamp when status changes to read
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }

  // Auto-set resolved timestamp when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  // Increment version on updates
  if (!this.isNew) {
    this.version += 1;
  }

  // Auto-detect spam patterns
  if (this.isNew) {
    const spamPatterns = [
      /viagra|cialis|loan|casino|gambling/i,
      /(free|easy)\s+(money|cash|loan)/i,
      /click\s+here\s+now/i,
      /(urgent|immediate)\s+(action|response)\s+required/i
    ];

    const hasSpamPattern = spamPatterns.some(pattern => 
      pattern.test(this.subject) || pattern.test(this.message)
    );

    if (hasSpamPattern) {
      this.isSpam = true;
      this.status = 'spam';
    }
  }

  next();
});

// Post-save middleware for notifications
contactSchema.post('save', function(doc) {
  // TODO: Send notifications to admins when new contact is created
  if (doc.isNew && doc.status === 'new' && !doc.isSpam) {
    console.log(`📧 New contact received: ${doc.subject} from ${doc.email}`);
    // Trigger email notification logic here
  }
});

// ===== INSTANCE METHODS =====
contactSchema.methods.markAsRead = function(userId) {
  this.status = 'read';
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

contactSchema.methods.markAsResolved = function(userId, notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  if (notes) {
    this.adminNotes = notes;
  }
  return this.save();
};

contactSchema.methods.addCommunication = function(type, content, userId, isInternal = false) {
  this.communicationHistory.push({
    type,
    content,
    sentBy: userId,
    sentAt: new Date(),
    isInternal
  });

  if (!isInternal && !this.responseAt) {
    this.responseAt = new Date();
    this.responseBy = userId;
  }

  return this.save();
};

contactSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'new') {
    this.status = 'in_progress';
  }
  return this.save();
};

contactSchema.methods.setPriority = function(priority) {
  this.priority = priority;
  this.isUrgent = priority === 'urgent' || priority === 'high';
  return this.save();
};

// ===== STATIC METHODS =====
contactSchema.statics.getStatistics = async function(dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const stats = await this.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        recentContacts: [
          { $match: { createdAt: { $gte: startDate } } },
          { $count: 'count' }
        ],
        avgResponseTime: [
          { $match: { responseAt: { $exists: true } } },
          {
            $group: {
              _id: null,
              avgTime: {
                $avg: { $subtract: ['$responseAt', '$submittedAt'] }
              }
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
};

contactSchema.statics.findUnresolved = function() {
  return this.find({ 
    status: { $in: ['new', 'read', 'in_progress'] } 
  }).sort({ priority: -1, submittedAt: 1 });
};

contactSchema.statics.findOverdue = function(hours = 24) {
  const overdueDate = new Date();
  overdueDate.setHours(overdueDate.getHours() - hours);

  return this.find({
    status: { $in: ['new', 'read', 'in_progress'] },
    submittedAt: { $lt: overdueDate }
  }).sort({ submittedAt: 1 });
};

// ===== VALIDATION =====
contactSchema.path('email').validate(async function(email) {
  // Check for duplicate recent submissions
  const recentCutoff = new Date();
  recentCutoff.setMinutes(recentCutoff.getMinutes() - 5); // 5-minute window

  const existing = await this.constructor.findOne({
    email: email,
    submittedAt: { $gte: recentCutoff },
    _id: { $ne: this._id }
  });

  return !existing;
}, 'Please wait before submitting another message');

// Set virtuals to be included in JSON output
contactSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields from JSON output
    delete ret.ipAddress;
    delete ret.userAgent;
    delete ret.__v;
    return ret;
  }
});

contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);