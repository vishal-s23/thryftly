const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's products
    const productQuery = await Product.find({ seller: req.params.id });
    const products = productQuery.sort({ createdAt: -1 });

    res.json({
      user: user.toJSON(),
      products,
      productCount: products.length
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      location: req.body.location,
      phone: req.body.phone
    };

    // Remove undefined fields and update user
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user's favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get favorite products
    const favoriteProducts = [];
    for (const productId of user.favorites) {
      const product = await Product.findById(productId);
      if (product) {
        favoriteProducts.push(product);
      }
    }

    res.json(favoriteProducts);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
});

// Get user's products
router.get('/my-products', authenticateToken, async (req, res) => {
  try {
    const productQuery = await Product.find({ seller: req.user._id });
    const products = productQuery.sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Error fetching user products' });
  }
});

module.exports = router;