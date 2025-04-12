/**
 * Global error handling middleware
 * Captures errors thrown in routes and controllers
 * Returns appropriate error responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Custom error handling based on error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors || err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized: Invalid or missing authentication token',
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      message: 'Forbidden: You do not have permission to access this resource',
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      message: err.message || 'Resource not found',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // In production, don't send detailed error information
  const errorResponse = {
    message: message,
  };

  // In development, include the stack trace
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  return res.status(statusCode).json(errorResponse);
};

export default errorHandler;
