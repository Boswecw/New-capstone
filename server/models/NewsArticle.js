const mongoose = require('mongoose');

const NewsArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },
  content: { type: String },
  category: { type: String, default: 'news' },
  author: { type: String, default: 'FurBabies Team' },
  imageUrl: { type: String },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('NewsArticle', NewsArticleSchema);
