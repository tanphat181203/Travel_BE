import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import sellerRoutes from './seller.routes.js';

const router = express.Router();

// Mount admin routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sellers', sellerRoutes);

export default router;
