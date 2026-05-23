const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Helper to sign JWT and set httpOnly cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: { message: 'User already exists with this email' } });
    }

    // Set role to 'user' by default unless explicit admin registration (handled securely)
    // In production, we'd restrict role creation, but we support admin role setup here.
    const userRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook hashes this
      role: userRole
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
