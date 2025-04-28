import express from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import tourRoutes from './tour.routes.js';
import departureRoutes from './departure.routes.js';
import bookingRoutes from './booking.routes.js';
import invoiceRoutes from './invoice.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reviewRoutes from './review.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/', departureRoutes);

export default router;
