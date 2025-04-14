import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      name: decoded.name,
      status: decoded.status,
    };
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

export const requireSeller = (req, res, next) => {
  if (req.role !== 'seller') {
    return res
      .status(403)
      .json({ message: 'Access denied. Seller privileges required.' });
  }
  next();
};

export const requireUser = (req, res, next) => {
  if (req.role !== 'user') {
    return res
      .status(403)
      .json({ message: 'Access denied. User privileges required.' });
  }
  next();
};
