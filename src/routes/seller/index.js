import express from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import tourRoutes from './tour.routes.js';

const router = express.Router();

// Mount seller routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/tours', tourRoutes);

export default router;
