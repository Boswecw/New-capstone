// server/models/Article.js - Complete News CMS Model for FurBabies
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  // Basic article information
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    minlength: [5, 'Title must be at least 5 characters']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [250, 'Slug cannot exceed 250 characters']
  },
  
  summary: {
    type: String,
    required: [true, 'Article summary is required'],
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters'],
    minlength: [10, 'Summary must be at least 10 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Article content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  
  // Content categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['pets', 'dogs', 'cats', 'veterinary', 'adoption', 'care', 'training', 'health', 'nutrition'],
      message: 'Category must be one of: pets, dogs, cats, veterinary, adoption, care, training, health, nutrition'
    },
    lowercase: true,
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  
  // Author information
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  
  // Publishing information
  published: {
    type: Boolean,
    default: false
  },
  
  publishedAt: {
    type: Date,
    default: null
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // Media
  image: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        // If image is provided, validate it's a reasonable path
        if (!v) return true;
        return v.length > 0 && v.length <= 500;
      },
      message: 'Image path must be between 1 and 500 characters'
    }
  },
  
  imageAlt: {
    type: String,
    trim: true,
    maxlength: [200, 'Image alt text cannot exceed 200 characters'],
    default: null
  },
  
  // Reader engagement
  readTime: {
    type: String,
    default: '5 min read',
    validate: {
      validator: function(v) {
        return /^\d+\s+(min|minute|minutes)\s+read$/i.test(v);
      },
      message: 'Read time must be in format "X min read"'
    }
  },
  
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Likes cannot be negative']
  },
  
  // SEO and metadata
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
    default: null
  },
  
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
    default: null
  },
  
  metaKeywords: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Each keyword cannot exceed 50 characters']
  }],
  
  // Content structure for rich articles
  sections: [{
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'image', 'list', 'quote'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  
  // Article status and workflow
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  // Comments and interaction (for future use)
  allowComments: {
    type: Boolean,
    default: true
  },
  
  commentsCount: {
    type: Number,
    default: 0,
    min: [0, 'Comments count cannot be negative']
  },
  
  // Related content
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  
  // Editorial notes (internal use)
  editorNotes: {
    type: String,
    default: null,
    maxlength: [1000, 'Editor notes cannot exceed 1000 characters']
  },
  
  // Archive and deletion
  archivedAt: {
    type: Date,
    default: null
  },
  
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.editorNotes;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// ============================================
// VIRTUAL FIELDS
// ============================================

// Virtual for full image URL
articleSchema.virtual('imageUrl').get(function() {
  if (!this.image) return null;
  
  // If already a full URL, return as-is
  if (this.image.startsWith('http://') || this.image.startsWith('https://')) {
    return this.image;
  }
  
  // Construct Google Cloud Storage URL
  return `https://storage.googleapis.com/furbabies-petstore/${this.image}`;
});

// Virtual for reading statistics
articleSchema.virtual('readingStats').get(function() {
  return {
    views: this.views,
    likes: this.likes,
    readTime: this.readTime,
    engagement: this.views > 0 ? Math.round((this.likes / this.views) * 100) : 0
  };
});

// Virtual for publication status
articleSchema.virtual('isPublished').get(function() {
  return this.published && this.status === 'published';
});

// Virtual for content word count
articleSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.split(/\s+/).filter(word => word.length > 0).length;
});

// ============================================
// MIDDLEWARE (PRE-SAVE HOOKS)
// ============================================

// Generate slug from title before saving
articleSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    // Create URL-friendly slug
    let slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    
    // Ensure slug is not empty
    if (!slug) {
      slug = `article-${Date.now()}`;
    }
    
    this.slug = slug;
  }
  
  next();
});

// Set publishedAt when article is published
articleSchema.pre('save', function(next) {
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update status based on published field
  if (this.isModified('published')) {
    if (this.published) {
      this.status = 'published';
    } else if (this.status === 'published') {
      this.status = 'draft';
    }
  }
  
  next();
});

// Auto-generate meta fields if not provided
articleSchema.pre('save', function(next) {
  // Generate meta title from title if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title.length > 60 
      ? this.title.substring(0, 57) + '...'
      : this.title;
  }
  
  // Generate meta description from summary if not provided
  if (!this.metaDescription && this.summary) {
    this.metaDescription = this.summary.length > 160 
      ? this.summary.substring(0, 157) + '...'
      : this.summary;
  }
  
  // Auto-generate read time if content changed
  if (this.isModified('content') && this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${minutes} min read`;
  }
  
  next();
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Primary indexes for queries
articleSchema.index({ published: 1, publishedAt: -1 });
articleSchema.index({ category: 1, published: 1, publishedAt: -1 });
articleSchema.index({ featured: 1, published: 1, publishedAt: -1 });
articleSchema.index({ slug: 1 });
articleSchema.index({ authorId: 1, publishedAt: -1 });
articleSchema.index({ status: 1, createdAt: -1 });

// Text search indexes
articleSchema.index({ 
  title: 'text', 
  summary: 'text', 
  content: 'text', 
  tags: 'text' 
});

// Compound indexes for complex queries
articleSchema.index({ published: 1, category: 1, featured: 1 });
articleSchema.index({ status: 1, publishedAt: -1, views: -1 });

// ============================================
// STATIC METHODS
// ============================================

// Find published articles
articleSchema.statics.findPublished = function(conditions = {}) {
  return this.find({ 
    published: true, 
    status: 'published',
    ...conditions 
  }).sort({ publishedAt: -1 });
};

// Find featured articles
articleSchema.statics.findFeatured = function(limit = 5) {
  return this.findPublished({ featured: true }).limit(limit);
};

// Find by category
articleSchema.statics.findByCategory = function(category, options = {}) {
  const { limit = 10, skip = 0, sort = { publishedAt: -1 } } = options;
  
  return this.findPublished({ category: category.toLowerCase() })
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Search articles
articleSchema.statics.search = function(query, options = {}) {
  const { limit = 10, skip = 0 } = options;
  
  return this.find({
    $and: [
      { published: true, status: 'published' },
      { $text: { $search: query } }
    ]
  })
  .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
  .limit(limit)
  .skip(skip);
};

// ============================================
// INSTANCE METHODS
// ============================================

// Increment view count
articleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Increment likes
articleSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Publish article
articleSchema.methods.publish = function() {
  this.published = true;
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Archive article
articleSchema.methods.archive = function(userId) {
  this.status = 'archived';
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Article', articleSchema);