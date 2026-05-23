const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: { message: 'Not authorized, token missing' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and select passwordHash off
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: { message: 'Not authorized, user not found' } });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ error: { message: 'Not authorized, token invalid or expired' } });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: { message: 'Access denied, administrator role required' } });
  }
};

module.exports = {
  protect,
  adminOnly
};
