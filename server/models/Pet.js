// ===== server/models/Pet.js =====
import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [100, 'Pet name cannot exceed 100 characters']
  },
  species: {
    type: String,
    required: [true, 'Species is required'],
    enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'],
    lowercase: true
  },
  breed: {
    type: String,
    trim: true,
    maxlength: [100, 'Breed cannot exceed 100 characters']
  },
  age: {
    value: {
      type: Number,
      min: 0,
      max: 50
    },
    unit: {
      type: String,
      enum: ['months', 'years'],
      default: 'years'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    required: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    required: function() {
      return this.species === 'dog' || this.species === 'cat';
    }
  },
  color: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  location: {
    shelter: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String
  },
  medicalInfo: {
    vaccinated: {
      type: Boolean,
      default: false
    },
    spayedNeutered: {
      type: Boolean,
      default: false
    },
    specialNeeds: {
      type: String,
      maxlength: [500, 'Special needs description cannot exceed 500 characters']
    },
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }]
  },
  temperament: [{
    type: String,
    enum: [
      'friendly', 'energetic', 'calm', 'playful', 'independent',
      'social', 'gentle', 'protective', 'curious', 'affectionate'
    ]
  }],
  goodWith: {
    children: {
      type: Boolean,
      default: null
    },
    dogs: {
      type: Boolean,
      default: null
    },
    cats: {
      type: Boolean,
      default: null
    }
  },
  adoptionStatus: {
    type: String,
    enum: ['available', 'pending', 'adopted', 'not-available'],
    default: 'available'
  },
  featured: {
    type: Boolean,
    default: false
  },
  adoptionFee: {
    type: Number,
    min: 0,
    default: 0
  },
  datePosted: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
petSchema.index({
  name: 'text',
  breed: 'text',
  description: 'text'
});

// Virtual for age display
petSchema.virtual('ageDisplay').get(function() {
  if (!this.age.value) return 'Unknown';
  return `${this.age.value} ${this.age.unit}`;
});

// Virtual for primary image
petSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Ensure virtual fields are serialized
petSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Pet', petSchema);