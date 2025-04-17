import express from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import tourRoutes from './tour.routes.js';
import departureRoutes from './departure.routes.js';
import bookingRoutes from './booking.routes.js';
import invoiceRoutes from './invoice.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/', departureRoutes);

export default router;
