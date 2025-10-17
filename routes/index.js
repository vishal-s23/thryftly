const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Homepage
router.get('/', async (req, res) => {
  try {
    // Get featured products
    const featuredProducts = await Product.find({ 
      status: 'available', 
      featured: true 
    })
    .populate('seller', 'username firstName lastName avatar rating')
    .limit(8)
    .sort({ createdAt: -1 });

    // Get recent products if no featured products
    const recentProducts = await Product.find({ status: 'available' })
      .populate('seller', 'username firstName lastName avatar rating')
      .limit(8)
      .sort({ createdAt: -1 });

    const products = featuredProducts.length > 0 ? featuredProducts : recentProducts;

    res.render('index', { 
      title: 'Thriftly - Sustainable Fashion Marketplace',
      products,
      user: req.session.userId ? await User.findById(req.session.userId) : null
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('index', { 
      title: 'Thriftly - Sustainable Fashion Marketplace',
      products: [],
      user: null
    });
  }
});

// Marketplace page
router.get('/marketplace', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    let query = { status: 'available' };
    
    // Apply filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.size) query.size = req.query.size;
    if (req.query.condition) query.condition = req.query.condition;
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const products = await Product.find(query)
      .populate('seller', 'username firstName lastName avatar rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.render('marketplace', {
      title: 'Browse All Items',
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      query: req.query,
      user: req.session.userId ? await User.findById(req.session.userId) : null
    });
  } catch (error) {
    console.error('Error loading marketplace:', error);
    res.render('marketplace', {
      title: 'Browse All Items',
      products: [],
      totalPages: 1,
      currentPage: 1,
      query: {},
      user: null
    });
  }
});

// Product detail page
router.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username firstName lastName avatar rating location createdAt');

    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found' });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'available'
    })
    .populate('seller', 'username firstName lastName avatar rating')
    .limit(4)
    .sort({ createdAt: -1 });

    res.render('product-detail', {
      title: product.title,
      product,
      relatedProducts,
      user: req.session.userId ? await User.findById(req.session.userId) : null
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(404).render('404', { title: 'Product Not Found' });
  }
});

// Dashboard (protected route)
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .populate('favorites', 'title price images category status');

    const userProducts = await Product.find({ seller: req.session.userId })
      .sort({ createdAt: -1 });

    const stats = {
      totalProducts: userProducts.length,
      activeProducts: userProducts.filter(p => p.status === 'available').length,
      soldProducts: userProducts.filter(p => p.status === 'sold').length,
      totalViews: userProducts.reduce((sum, p) => sum + p.views, 0),
      totalLikes: userProducts.reduce((sum, p) => sum + p.likes.length, 0)
    };

    res.render('dashboard', {
      title: 'My Dashboard',
      user,
      products: userProducts.slice(0, 6), // Show latest 6 products
      stats,
      favorites: user.favorites.slice(0, 6) // Show latest 6 favorites
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('dashboard', {
      title: 'My Dashboard',
      user: null,
      products: [],
      stats: {},
      favorites: []
    });
  }
});

// Sell page
router.get('/sell', requireAuth, (req, res) => {
  res.render('sell', { 
    title: 'List Your Item',
    user: req.session.userId
  });
});

// About page
router.get('/about', async (req, res) => {
  res.render('about', { 
    title: 'About Thriftly',
    user: req.session.userId ? await User.findById(req.session.userId) : null
  });
});

// Contact page
router.get('/contact', async (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    user: req.session.userId ? await User.findById(req.session.userId) : null
  });
});

module.exports = router;