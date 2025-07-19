// server/models/News.js - MongoDB Model for News Articles
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  
  summary: {
    type: String,
    trim: true,
    maxLength: [500, 'Summary cannot exceed 500 characters']
  },
  
  excerpt: {
    type: String,
    trim: true,
    maxLength: [300, 'Excerpt cannot exceed 300 characters']
  },
  
  category: {
    type: String,
    required: true,
    enum: ['company-news', 'success-story', 'care', 'health', 'safety', 'adoption', 'general'],
    default: 'general'
  },
  
  author: {
    type: String,
    required: true,
    default: 'Admin'
  },
  
  source: {
    type: String,
    enum: ['internal', 'external'],
    default: 'internal'
  },
  
  type: {
    type: String,
    enum: ['custom', 'external'],
    default: 'custom'
  },
  
  published: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  },
  
  originalUrl: {
    type: String,
    trim: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // SEO fields
  metaDescription: {
    type: String,
    maxLength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Timestamps
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  
  // Add indexes for better query performance
  indexes: [
    { category: 1 },
    { featured: 1 },
    { published: 1 },
    { publishedAt: -1 },
    { 'title': 'text', 'content': 'text', 'summary': 'text' } // Text search index
  ]
});

// Virtual for URL-friendly slug
newsSchema.virtual('slug').get(function() {
  return this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
});

// Pre-save middleware to generate excerpt from content
newsSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Generate excerpt from first 150 characters of content
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 150) + '...';
  }
  
  if (!this.summary && this.content) {
    // Generate summary from first 200 characters
    this.summary = this.content
      .replace(/<[^>]*>/g, '')
      .substring(0, 200) + '...';
  }
  
  next();
});

// Static methods for common queries
newsSchema.statics.findPublished = function() {
  return this.find({ published: true }).sort({ publishedAt: -1 });
};

newsSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ published: true, featured: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

newsSchema.statics.findByCategory = function(category) {
  return this.find({ published: true, category })
    .sort({ publishedAt: -1 });
};

newsSchema.statics.searchArticles = function(searchTerm) {
  return this.find({
    $and: [
      { published: true },
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { summary: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  }).sort({ publishedAt: -1 });
};

// Instance methods
newsSchema.methods.incrementViews = function() {
  this.views = (this.views || 0) + 1;
  return this.save();
};

newsSchema.methods.toggleLike = function() {
  this.likes = (this.likes || 0) + 1;
  return this.save();
};

newsSchema.methods.toggleFeatured = function() {
  this.featured = !this.featured;
  return this.save();
};

newsSchema.methods.togglePublished = function() {
  this.published = !this.published;
  return this.save();
};

// Export the model
module.exports = mongoose.model('News', newsSchema);