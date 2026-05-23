const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { validateAddToCart } = require('../middleware/validation');

// Helper to populate cart items with product details
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

// @desc    Add or merge item in cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, validateAddToCart, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // 1. Fetch product and verify existence
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    // 2. Fetch or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // 3. Check if product already exists in cart
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
    let targetQuantity = quantity;
    if (itemIndex > -1) {
      targetQuantity += cart.items[itemIndex].quantity;
    }

    // 4. Stock validation check
    if (targetQuantity > product.stock) {
      return res.status(400).json({ error: { message: 'Insufficient stock' } });
    }

    // 5. Update or insert item
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQuantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    
    // 6. Return populated cart
    const populatedCart = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart
// @access  Private
router.put('/', protect, validateAddToCart, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // 1. Fetch product and verify existence
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    // 2. Stock validation check
    if (quantity > product.stock) {
      return res.status(400).json({ error: { message: 'Insufficient stock' } });
    }

    // 3. Fetch user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: { message: 'Cart not found' } });
    }

    // 4. Update quantity
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: { message: 'Product not found in cart' } });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // 5. Return populated cart
    const populatedCart = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove specific item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: { message: 'Cart not found' } });
    }

    // Filter out the product
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ error: { message: 'Product not found in cart' } });
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
