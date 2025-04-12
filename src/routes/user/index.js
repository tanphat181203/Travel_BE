import express from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';

const router = express.Router();

// Mount user routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;
