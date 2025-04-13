import express from 'express';
import tourRoutes from './tour.routes.js';
import departureRoutes from './departure.routes.js';

const router = express.Router();

router.use('/tours', tourRoutes);
router.use('/', departureRoutes);

export default router;
