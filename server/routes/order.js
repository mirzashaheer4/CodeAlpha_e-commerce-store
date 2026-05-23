const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { validateCheckout } = require('../middleware/validation');

// @desc    Create a new order from cart
// @route   POST /api/orders
// @access  Private
router.post('/', protect, validateCheckout, async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user.id;

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: { message: 'Cannot place order: Cart is empty' } });
    }

    // 2. Validate stock for all items and calculate total price
    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        return res.status(404).json({ error: { message: 'One or more products in your cart no longer exist' } });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          error: { message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` }
        });
      }

      // Add to snapshot items (preserves historical price)
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      totalPrice += product.price * item.quantity;
    }

    // 3. Deduct stock from products
    for (const item of cart.items) {
      const product = item.productId;
      product.stock -= item.quantity;
      await product.save();
    }

    // 4. Create the order document
    const order = await Order.create({
      userId,
      items: orderItems,
      totalPrice,
      shippingAddress,
      status: 'pending'
    });

    // 5. Clear the user's cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all orders of authenticated user
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
});

// @desc    Get specific order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Allow owner or admin to view
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Not authorized to view this order' } });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
