import express from 'express';
import * as bookingController from '../../controllers/seller/booking.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /seller/bookings:
 *   get:
 *     tags:
 *       - Seller - Booking Management
 *     summary: Get bookings for seller's tours
 *     description: Get all bookings for tours owned by the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by booking status (pending, confirmed, cancelled)
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *         description: Filter by payment status (pending, awaiting_seller_confirmation, completed, none)
 *       - in: query
 *         name: tour_id
 *         schema:
 *           type: integer
 *         description: Filter by tour ID
 *       - in: query
 *         name: departure_id
 *         schema:
 *           type: integer
 *         description: Filter by departure ID
 *       - in: query
 *         name: start_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by departure start date (from)
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by departure start date (to)
 *       - in: query
 *         name: booking_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date (from)
 *       - in: query
 *         name: booking_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date (to)
 *     responses:
 *       200:
 *         description: List of bookings for seller's tours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   booking_id:
 *                     type: integer
 *                   departure_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   num_adults:
 *                     type: integer
 *                   num_children_120_140:
 *                     type: integer
 *                   num_children_100_120:
 *                     type: integer
 *                   total_price:
 *                     type: number
 *                     format: float
 *                   booking_status:
 *                     type: string
 *                   booking_date:
 *                     type: string
 *                     format: date-time
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   tour_id:
 *                     type: integer
 *                   tour_title:
 *                     type: string
 *                   user_name:
 *                     type: string
 *                   user_email:
 *                     type: string
 *                   user_phone:
 *                     type: string
 *                   payment_method:
 *                     type: string
 *                   payment_status:
 *                     type: string
 *                   checkout_id:
 *                     type: integer
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireSeller,
  bookingController.getSellerBookings
);

/**
 * @swagger
 * /seller/bookings/invoices:
 *   get:
 *     tags:
 *       - Seller - Booking Management
 *     summary: Get invoices for seller's tours
 *     description: Get all invoices for bookings of tours owned by the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices for seller's tours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   invoice_id:
 *                     type: integer
 *                   booking_id:
 *                     type: integer
 *                   amount_due:
 *                     type: number
 *                     format: float
 *                   date_issued:
 *                     type: string
 *                     format: date-time
 *                   details:
 *                     type: string
 *                   booking_status:
 *                     type: string
 *                   user_id:
 *                     type: integer
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   tour_title:
 *                     type: string
 *                   user_name:
 *                     type: string
 *                   user_email:
 *                     type: string
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get(
  '/invoices',
  authenticateJWT,
  requireSeller,
  bookingController.getSellerInvoices
);

/**
 * @swagger
 * /seller/bookings/{bookingId}:
 *   get:
 *     tags:
 *       - Seller - Booking Management
 *     summary: Get booking details
 *     description: Get detailed information about a specific booking for a seller's tour
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Detailed booking information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking_id:
 *                   type: integer
 *                 departure_id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 num_adults:
 *                   type: integer
 *                 num_children_120_140:
 *                   type: integer
 *                 num_children_100_120:
 *                   type: integer
 *                 total_price:
 *                   type: number
 *                   format: float
 *                 booking_status:
 *                   type: string
 *                 special_requests:
 *                   type: string
 *                 booking_date:
 *                   type: string
 *                   format: date-time
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 tour_id:
 *                   type: integer
 *                 tour_title:
 *                   type: string
 *                 departure_location:
 *                   type: string
 *                 user_name:
 *                   type: string
 *                 user_email:
 *                   type: string
 *                 user_phone:
 *                   type: string
 *                 checkout_id:
 *                   type: integer
 *                 payment_method:
 *                   type: string
 *                 payment_status:
 *                   type: string
 *                 payment_date:
 *                   type: string
 *                   format: date-time
 *                 transaction_id:
 *                   type: string
 *                 invoice_id:
 *                   type: integer
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to access this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:bookingId',
  authenticateJWT,
  requireSeller,
  bookingController.getBookingById
);

/**
 * @swagger
 * /seller/bookings/{bookingId}/confirm-payment:
 *   post:
 *     tags:
 *       - Seller - Booking Management
 *     summary: Confirm direct payment
 *     description: Confirm that a direct payment has been received for a booking
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 booking_id:
 *                   type: integer
 *                 booking_status:
 *                   type: string
 *                 payment_status:
 *                   type: string
 *       400:
 *         description: Cannot confirm payment for this booking
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to confirm payment for this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:bookingId/confirm-payment',
  authenticateJWT,
  requireSeller,
  bookingController.confirmPayment
);

export default router;
