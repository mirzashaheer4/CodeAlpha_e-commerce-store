const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(422).json({ error: { message: 'Name is required' } });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(422).json({ error: { message: 'A valid email is required' } });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(422).json({ error: { message: 'Password must be at least 8 characters long' } });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(422).json({ error: { message: 'Email is required' } });
  }
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(422).json({ error: { message: 'Password is required' } });
  }
  next();
};

const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!productId || !objectIdRegex.test(productId)) {
    return res.status(422).json({ error: { message: 'Valid productId is required' } });
  }
  if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(422).json({ error: { message: 'Quantity must be an integer greater than or equal to 1' } });
  }
  next();
};

const validateCheckout = (req, res, next) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return res.status(422).json({ error: { message: 'Shipping address object is required' } });
  }
  const { street, city, zip, country } = shippingAddress;
  if (!street || typeof street !== 'string' || street.trim() === '') {
    return res.status(422).json({ error: { message: 'Shipping street is required' } });
  }
  if (!city || typeof city !== 'string' || city.trim() === '') {
    return res.status(422).json({ error: { message: 'Shipping city is required' } });
  }
  if (!zip || typeof zip !== 'string' || zip.trim() === '') {
    return res.status(422).json({ error: { message: 'Shipping zip is required' } });
  }
  if (!country || typeof country !== 'string' || country.trim() === '') {
    return res.status(422).json({ error: { message: 'Shipping country is required' } });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateAddToCart,
  validateCheckout
};
