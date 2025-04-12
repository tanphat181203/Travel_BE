import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Middleware to authenticate JWT tokens
 * Extracts the JWT token from Authorization header
 * Verifies the token and adds user data to the request object
 */
export const authenticateJWT = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user data to request object
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (req.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * Middleware to check if user has seller role
 */
export const requireSeller = (req, res, next) => {
  if (req.role !== 'seller') {
    return res
      .status(403)
      .json({ message: 'Access denied. Seller privileges required.' });
  }
  next();
};

/**
 * Middleware to check if user has user role
 */
export const requireUser = (req, res, next) => {
  if (req.role !== 'user') {
    return res
      .status(403)
      .json({ message: 'Access denied. User privileges required.' });
  }
  next();
};
