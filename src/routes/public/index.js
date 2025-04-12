import express from 'express';
import tourRoutes from './tour.routes.js';

const router = express.Router();

// Mount public routes
router.use('/tours', tourRoutes);

export default router;
