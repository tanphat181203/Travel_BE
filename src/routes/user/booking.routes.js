import express from 'express';
import * as bookingController from '../../controllers/user/booking.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /user/bookings:
 *   post:
 *     tags:
 *       - User - Booking Management
 *     summary: Create a new booking
 *     description: Create a new booking for a tour departure. Optionally specify a promotion ID to apply a specific promotion.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departure_id
 *               - num_adults
 *               - contact_info
 *               - passengers
 *             properties:
 *               departure_id:
 *                 type: integer
 *                 description: ID of the departure to book
 *               num_adults:
 *                 type: integer
 *                 description: Number of adults
 *                 minimum: 1
 *               num_children_120_140:
 *                 type: integer
 *                 description: Number of children between 120-140cm
 *                 default: 0
 *               num_children_100_120:
 *                 type: integer
 *                 description: Number of children between 100-120cm
 *                 default: 0
 *               special_requests:
 *                 type: string
 *                 description: Special requests for the booking
 *               promotion_id:
 *                 type: integer
 *                 description: Optional ID of a specific promotion to apply to the booking. If not provided, no promotion will be applied.
 *               contact_info:
 *                 type: object
 *                 required:
 *                   - fullname
 *                   - email
 *                   - phone
 *                   - address
 *                 description: Contact information of the person making the booking
 *                 properties:
 *                   fullname:
 *                     type: string
 *                     description: Full name of the contact person
 *                   email:
 *                     type: string
 *                     description: Email address of the contact person
 *                   phone:
 *                     type: string
 *                     description: Phone number of the contact person
 *                   address:
 *                     type: string
 *                     description: Address of the contact person
 *               passengers:
 *                 type: array
 *                 description: List of passengers for the booking
 *                 items:
 *                   type: object
 *                   required:
 *                     - fullname
 *                     - gender
 *                     - birthday
 *                     - ticket_type
 *                   properties:
 *                     fullname:
 *                       type: string
 *                       description: Full name of the passenger
 *                     gender:
 *                       type: string
 *                       description: Gender of the passenger
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       description: Birthday of the passenger (YYYY-MM-DD)
 *                     ticket_type:
 *                       type: string
 *                       enum: [adult, children_120_140, children_100_120, baby]
 *                       description: Type of ticket for the passenger
 *               order_notes:
 *                 type: object
 *                 description: Special notes for the order
 *                 properties:
 *                   smoking:
 *                     type: boolean
 *                     default: false
 *                     description: Whether smoking is preferred
 *                   vegetarian:
 *                     type: boolean
 *                     default: false
 *                     description: Whether vegetarian food is required
 *                   high_floor:
 *                     type: boolean
 *                     default: false
 *                     description: Whether a high floor is preferred
 *                   pregnant:
 *                     type: boolean
 *                     default: false
 *                     description: Whether the booking includes a pregnant person
 *                   disabled:
 *                     type: boolean
 *                     default: false
 *                     description: Whether the booking includes a disabled person
 *                   invoice_needed:
 *                     type: boolean
 *                     default: false
 *                     description: Whether an invoice is needed
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or booking not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Departure or tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  bookingController.createBooking
);

/**
 * @swagger
 * /user/bookings:
 *   get:
 *     tags:
 *       - User - Booking Management
 *     summary: Get user bookings
 *     description: Get all bookings for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  bookingController.getUserBookings
);

/**
 * @swagger
 * /user/bookings/confirmed:
 *   get:
 *     tags:
 *       - User - Booking Management
 *     summary: Get user confirmed bookings
 *     description: Get only confirmed bookings for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user confirmed bookings
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/confirmed',
  authenticateJWT,
  requireUser,
  requestLogger,
  bookingController.getUserConfirmedBookings
);

/**
 * @swagger
 * /user/bookings/{id}:
 *   get:
 *     tags:
 *       - User - Booking Management
 *     summary: Get booking by ID
 *     description: Get a specific booking by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateJWT,
  requireUser,
  requestLogger,
  bookingController.getBookingById
);

/**
 * @swagger
 * /user/bookings/{id}/cancel:
 *   put:
 *     tags:
 *       - User - Booking Management
 *     summary: Cancel booking
 *     description: Cancel a booking by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/cancel',
  authenticateJWT,
  requireUser,
  requestLogger,
  bookingController.cancelBooking
);

export default router;
