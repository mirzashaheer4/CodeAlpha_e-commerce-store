const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.id || req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, stock, imageUrl, category } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !imageUrl || !category) {
      return res.status(400).json({ error: { message: 'Please provide all required product details' } });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      imageUrl,
      category
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, description, price, stock, imageUrl, category } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, stock, imageUrl, category },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
