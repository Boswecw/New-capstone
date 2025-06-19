const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'fish', 'bird', 'small-pet', 'supply']
  },
  breed: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    required: function() { 
      // Only require size for animals, not supplies
      return this.type !== 'supply';
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: function() { 
      // Only require gender for dogs, cats, birds, and small-pets
      // NOT for fish or supplies
      return ['dog', 'cat', 'bird', 'small-pet'].includes(this.type);
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for average rating
petSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return (total / this.ratings.length).toFixed(1);
});

module.exports = mongoose.model('Pet', petSchema);