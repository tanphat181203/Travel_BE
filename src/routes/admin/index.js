import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import sellerRoutes from './seller.routes.js';
import cronRoutes from './cron.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sellers', sellerRoutes);
router.use('/cron', cronRoutes);

export default router;
