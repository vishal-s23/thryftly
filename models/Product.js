const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
      'accessories', 'bags', 'jewelry', 'swimwear', 'activewear',
      'formal', 'vintage', 'designer', 'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 50
  },
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20+', 'One Size']
  },
  condition: {
    type: String,
    required: true,
    enum: ['New with tags', 'Like new', 'Good', 'Fair', 'Poor']
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'inactive'],
    default: 'available'
  },
  measurements: {
    bust: Number,
    waist: Number,
    hips: Number,
    length: Number,
    sleeve: Number,
    inseam: Number
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  negotiable: {
    type: Boolean,
    default: true
  },
  shippingOptions: {
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      min: 0,
      default: 0
    },
    expeditedAvailable: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for search functionality
productSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});

// Index for filtering
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);