const errorHandler = (err, req, res, next) => {
  // Create a copy of err
  let error = { ...err };
  error.message = err.message;

  // Log error for debug
  console.error('Error handler caught:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: {
        message: `Resource not found with id of ${err.value}`,
        status: 404
      }
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      error: {
        message: 'Duplicate field value entered',
        status: 400
      }
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(422).json({
      error: {
        message,
        status: 422
      }
    });
  }

  res.status(err.statusCode || 500).json({
    error: {
      message: error.message || 'Server Error',
      status: err.statusCode || 500
    }
  });
};

module.exports = errorHandler;
