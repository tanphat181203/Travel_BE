import express from 'express';
import tourRoutes from './tour.routes.js';
import departureRoutes from './departure.routes.js';
import reviewRoutes from './review.routes.js';
import promotionRoutes from './promotion.routes.js';
import sellerRoutes from './seller.routes.js';

const router = express.Router();

router.use('/tours', tourRoutes);
router.use('/reviews', reviewRoutes);
router.use('/promotions', promotionRoutes);
router.use('/sellers', sellerRoutes);
router.use('/', departureRoutes);

export default router;
