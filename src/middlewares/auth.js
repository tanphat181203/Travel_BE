import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import SellerSubscription from '../models/SellerSubscription.js';
import logger from '../utils/logger.js';

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

    if (decoded.status === 'suspended') {
      return res.status(403).json({ 
        message: 'Access denied. Your account has been suspended.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

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

export const optionalAuthenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        id: decoded.userId,
        role: decoded.role,
        name: decoded.name,
        status: decoded.status,
      };
      req.userId = decoded.userId;
      req.role = decoded.role;
    } catch (tokenError) {
      logger.debug(`Optional auth failed: ${tokenError.message}`);
    }
    
    next();
  } catch (error) {
    logger.error(`Error in optional authentication: ${error.message}`);
    next();
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

export const requireSeller = async (req, res, next) => {
  try {
    if (req.role !== 'seller') {
      return res
        .status(403)
        .json({ message: 'Access denied. Seller privileges required.' });
    }

    const skipSubscriptionCheck = [
      '/api/seller/auth',
      '/api/seller/subscriptions',
      '/api/seller/profile',
    ];

    const shouldSkip = skipSubscriptionCheck.some((path) =>
      req.originalUrl.startsWith(path)
    );

    if (shouldSkip) {
      return next();
    }

    const activeSubscription =
      await SellerSubscription.findActiveSubscriptionBySellerId(req.userId);

    if (!activeSubscription) {
      logger.warn(
        `Seller ${req.userId} attempted to access ${req.originalUrl} without an active subscription`
      );
      return res.status(403).json({
        message:
          'Subscription required. Please purchase a subscription to access this feature.',
        code: 'SUBSCRIPTION_REQUIRED',
        hasActiveSubscription: false,
      });
    }

    req.subscription = activeSubscription;

    next();
  } catch (error) {
    logger.error(`Error in requireSeller middleware: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const requireUser = (req, res, next) => {
  if (req.role !== 'user') {
    return res
      .status(403)
      .json({ message: 'Access denied. User privileges required.' });
  }
  next();
};

export const checkSellerSubscription = async (req, res, next) => {
  try {
    if (req.role !== 'seller') {
      return res
        .status(403)
        .json({ message: 'Access denied. Seller privileges required.' });
    }

    const activeSubscription =
      await SellerSubscription.findActiveSubscriptionBySellerId(req.userId);

    req.hasActiveSubscription = !!activeSubscription;
    if (activeSubscription) {
      req.subscription = activeSubscription;
    }

    next();
  } catch (error) {
    logger.error(
      `Error in checkSellerSubscription middleware: ${error.message}`
    );
    return res.status(500).json({ message: 'Internal server error' });
  }
};
