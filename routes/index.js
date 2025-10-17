const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Homepage
router.get('/', async (req, res) => {
  try {
    // Get featured products
    let featuredProducts = await Product.find({ 
      status: 'available', 
      featured: true 
    });
    featuredProducts.sort((a, b) => b.createdAt - a.createdAt);
    featuredProducts = featuredProducts.slice(0, 8);

    // Get recent products if no featured products
    let recentProducts = await Product.find({ status: 'available' });
    recentProducts.sort((a, b) => b.createdAt - a.createdAt);
    recentProducts = recentProducts.slice(0, 8);

    let products = featuredProducts.length > 0 ? featuredProducts : recentProducts;
    
    // Populate seller info
    for (let product of products) {
      const seller = await User.findById(product.seller);
      if (seller) {
        product.seller = {
          _id: seller._id,
          username: seller.username,
          firstName: seller.firstName,
          lastName: seller.lastName,
          avatar: seller.avatar,
          rating: seller.rating
        };
      }
    }

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

    let allProducts = await Product.find(query);
    allProducts.sort((a, b) => b.createdAt - a.createdAt);
    
    const total = allProducts.length;
    const products = allProducts.slice(skip, skip + limit);
    
    // Populate seller info
    for (let product of products) {
      const seller = await User.findById(product.seller);
      if (seller) {
        product.seller = {
          _id: seller._id,
          username: seller.username,
          firstName: seller.firstName,
          lastName: seller.lastName,
          avatar: seller.avatar,
          rating: seller.rating
        };
      }
    }

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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found' });
    }

    // Populate seller info
    const seller = await User.findById(product.seller);
    if (seller) {
      product.seller = {
        _id: seller._id,
        username: seller.username,
        firstName: seller.firstName,
        lastName: seller.lastName,
        avatar: seller.avatar,
        rating: seller.rating,
        location: seller.location,
        createdAt: seller.createdAt
      };
    }

    // Increment view count
    product.views += 1;
    await product.save();

    // Get related products
    let relatedProducts = await Product.find({
      category: product.category,
      status: 'available'
    }).filter(p => p._id != product._id);
    
    relatedProducts.sort((a, b) => b.createdAt - a.createdAt);
    relatedProducts = relatedProducts.slice(0, 4);
    
    // Populate seller info for related products
    for (let relProduct of relatedProducts) {
      const relSeller = await User.findById(relProduct.seller);
      if (relSeller) {
        relProduct.seller = {
          _id: relSeller._id,
          username: relSeller.username,
          firstName: relSeller.firstName,
          lastName: relSeller.lastName,
          avatar: relSeller.avatar,
          rating: relSeller.rating
        };
      }
    }

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
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    let userProducts = await Product.find({ seller: req.session.userId });
    userProducts.sort((a, b) => b.createdAt - a.createdAt);

    // Get favorite products
    const favoriteProducts = [];
    for (const productId of user.favorites.slice(0, 6)) {
      const favProduct = await Product.findById(productId);
      if (favProduct) {
        favoriteProducts.push(favProduct);
      }
    }

    const stats = {
      totalProducts: userProducts.length,
      activeProducts: userProducts.filter(p => p.status === 'available').length,
      soldProducts: userProducts.filter(p => p.status === 'sold').length,
      totalViews: userProducts.reduce((sum, p) => sum + p.views, 0),
      totalLikes: userProducts.reduce((sum, p) => sum + p.likes.length, 0)
    };

    res.render('dashboard', {
      title: 'My Dashboard',
      user: user.toJSON(),
      products: userProducts.slice(0, 6), // Show latest 6 products
      stats,
      favorites: favoriteProducts
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