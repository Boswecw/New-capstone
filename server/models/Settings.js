// server/models/Settings.js - System Settings Model
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Site Information
  siteName: {
    type: String,
    default: 'FurBabies Pet Store',
    required: true,
    trim: true,
    maxlength: 100
  },
  siteDescription: {
    type: String,
    default: 'Find your perfect pet companion',
    trim: true,
    maxlength: 500
  },
  contactEmail: {
    type: String,
    default: 'info@furbabies.com',
    required: true,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    default: '(555) 123-4567',
    trim: true
  },
  siteUrl: {
    type: String,
    default: 'https://furbabies.com',
    trim: true
  },

  // User Settings
  allowRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  passwordMinLength: {
    type: Number,
    default: 6,
    min: 4,
    max: 50
  },

  // Pet Settings
  defaultPetStatus: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  maxPetImages: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  petApprovalRequired: {
    type: Boolean,
    default: false
  },
  allowPublicPetSubmission: {
    type: Boolean,
    default: false
  },

  // Product Settings
  defaultProductStatus: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  allowProductReviews: {
    type: Boolean,
    default: true
  },
  requireProductApproval: {
    type: Boolean,
    default: false
  },

  // System Settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently performing maintenance. Please check back soon!',
    trim: true
  },
  maxUploadSize: {
    type: String,
    default: '5MB',
    enum: ['1MB', '2MB', '5MB', '10MB', '20MB']
  },
  sessionTimeout: {
    type: String,
    default: '30',
    enum: ['15', '30', '60', '120', '240']
  },
  enableAnalytics: {
    type: Boolean,
    default: true
  },
  enableRateLimiting: {
    type: Boolean,
    default: true
  },

  // Email Settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  notifyOnNewContact: {
    type: Boolean,
    default: true
  },
  notifyOnNewRegistration: {
    type: Boolean,
    default: false
  },
  notifyOnAdoption: {
    type: Boolean,
    default: true
  },
  notifyOnNewProduct: {
    type: Boolean,
    default: false
  },
  adminNotificationEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Social Media Settings
  facebookUrl: {
    type: String,
    trim: true
  },
  twitterUrl: {
    type: String,
    trim: true
  },
  instagramUrl: {
    type: String,
    trim: true
  },
  youtubeUrl: {
    type: String,
    trim: true
  },

  // SEO Settings
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  metaKeywords: {
    type: String,
    trim: true
  },

  // API Settings
  apiRateLimit: {
    type: Number,
    default: 100,
    min: 10,
    max: 1000
  },
  apiTimeout: {
    type: Number,
    default: 30000,
    min: 5000,
    max: 120000
  },

  // Security Settings
  enableTwoFactorAuth: {
    type: Boolean,
    default: false
  },
  requireStrongPasswords: {
    type: Boolean,
    default: true
  },
  enableCaptcha: {
    type: Boolean,
    default: false
  },
  
  // Backup Settings
  autoBackup: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  retainBackups: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  },

  // Feature Flags
  features: {
    enableCart: {
      type: Boolean,
      default: true
    },
    enableReviews: {
      type: Boolean,
      default: true
    },
    enableRatings: {
      type: Boolean,
      default: true
    },
    enableWishlist: {
      type: Boolean,
      default: false
    },
    enableChat: {
      type: Boolean,
      default: false
    },
    enableNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Custom Fields
  customFields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      default: 'string'
    }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Version for optimistic locking
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'settings'
});

// Indexes
settingsSchema.index({ updatedAt: -1 });

// Pre-save middleware to update the updatedAt field
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted contact info
settingsSchema.virtual('formattedContact').get(function() {
  return {
    email: this.contactEmail,
    phone: this.contactPhone,
    formatted: `${this.contactEmail} | ${this.contactPhone}`
  };
});

// Virtual for social media links
settingsSchema.virtual('socialLinks').get(function() {
  const links = [];
  if (this.facebookUrl) links.push({ name: 'Facebook', url: this.facebookUrl });
  if (this.twitterUrl) links.push({ name: 'Twitter', url: this.twitterUrl });
  if (this.instagramUrl) links.push({ name: 'Instagram', url: this.instagramUrl });
  if (this.youtubeUrl) links.push({ name: 'YouTube', url: this.youtubeUrl });
  return links;
});

// Instance method to get specific feature flag
settingsSchema.methods.getFeature = function(featureName) {
  return this.features && this.features[featureName];
};

// Instance method to update specific feature flag
settingsSchema.methods.setFeature = function(featureName, value) {
  if (!this.features) this.features = {};
  this.features[featureName] = value;
  return this.save();
};

// Static method to get singleton settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({});
    await settings.save();
  }
  
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = new this(updates);
  } else {
    Object.assign(settings, updates);
    settings.version += 1;
  }
  
  return settings.save();
};

// Ensure only one settings document exists
settingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingSettings = await this.constructor.findOne();
    if (existingSettings && !existingSettings._id.equals(this._id)) {
      const error = new Error('Only one settings document is allowed');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Set virtuals to be included in JSON output
settingsSchema.set('toJSON', { virtuals: true });
settingsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Settings', settingsSchema);