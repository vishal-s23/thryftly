const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const User = require('../models/User');
const azureStorage = require('../config/azure');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = { status: 'available' };

    // Apply filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.size) query.size = req.query.size;
    if (req.query.condition) query.condition = req.query.condition;
    if (req.query.brand) query.brand = new RegExp(req.query.brand, 'i');
    if (req.query.color) query.color = new RegExp(req.query.color, 'i');

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort options
    let sort = {};
    switch (req.query.sortBy) {
      case 'price_low':
        sort.price = 1;
        break;
      case 'price_high':
        sort.price = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      case 'popular':
        sort.views = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const products = await Product.find(query)
      .populate('seller', 'username firstName lastName avatar rating')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username firstName lastName avatar rating location createdAt');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create new product
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title, description, price, originalPrice, category, subcategory,
      brand, size, condition, color, material, tags, negotiable,
      freeShipping, shippingCost, expeditedAvailable,
      bust, waist, hips, length, sleeve, inseam
    } = req.body;

    // Upload images to Azure Blob Storage
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        imageUrls.push({ url: imageUrl, alt: title });
      }
    }

    const product = new Product({
      title,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      category,
      subcategory,
      brand,
      size,
      condition,
      color,
      material,
      images: imageUrls,
      seller: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      negotiable: negotiable === 'true',
      shippingOptions: {
        freeShipping: freeShipping === 'true',
        shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
        expeditedAvailable: expeditedAvailable === 'true'
      },
      measurements: {
        bust: bust ? parseFloat(bust) : undefined,
        waist: waist ? parseFloat(waist) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
        length: length ? parseFloat(length) : undefined,
        sleeve: sleeve ? parseFloat(sleeve) : undefined,
        inseam: inseam ? parseFloat(inseam) : undefined
      }
    });

    await product.save();
    
    await product.populate('seller', 'username firstName lastName avatar rating');
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/:id', authenticateToken, upload.array('newImages', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updates = { ...req.body };
    
    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        newImageUrls.push({ url: imageUrl, alt: updates.title || product.title });
      }
      
      // Add new images to existing ones
      updates.images = [...product.images, ...newImageUrls];
    }

    // Process tags
    if (updates.tags) {
      updates.tags = updates.tags.split(',').map(tag => tag.trim());
    }

    Object.assign(product, updates);
    await product.save();
    
    await product.populate('seller', 'username firstName lastName avatar rating');
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete images from Azure Blob Storage
    for (const image of product.images) {
      try {
        await azureStorage.deleteImage(image.url);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Toggle like/unlike product
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const user = await User.findById(req.user._id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isLiked = product.likes.includes(req.user._id);
    
    if (isLiked) {
      // Unlike
      product.likes = product.likes.filter(id => id.toString() !== req.user._id.toString());
      user.favorites = user.favorites.filter(id => id.toString() !== product._id.toString());
    } else {
      // Like
      product.likes.push(req.user._id);
      user.favorites.push(product._id);
    }

    await product.save();
    await user.save();

    res.json({ 
      liked: !isLiked,
      likeCount: product.likes.length 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
});

module.exports = router;