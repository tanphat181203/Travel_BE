import express from 'express';
import adminRoutes from './admin/index.js';
import sellerRoutes from './seller/index.js';
import userRoutes from './user/index.js';
import publicRoutes from './public/index.js';

const router = express.Router();

// Mount all routes
router.use('/admin', adminRoutes);
router.use('/seller', sellerRoutes);
router.use('/user', userRoutes);
router.use('/public', publicRoutes);

export default router;
