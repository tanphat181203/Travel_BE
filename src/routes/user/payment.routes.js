import express from 'express';
import * as paymentController from '../../controllers/user/payment.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /user/payments:
 *   post:
 *     tags:
 *       - User - Payment Management
 *     summary: Create a payment for a booking
 *     description: Initiate a payment process for a booking using VNPay or direct payment to seller
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: integer
 *                 description: ID of the booking to pay for
 *               payment_method:
 *                 type: string
 *                 enum: [vnpay, stripe, direct_to_seller]
 *                 description: Payment method to use (default is vnpay)
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     paymentUrl:
 *                       type: string
 *                       description: URL to redirect the user for payment (only for vnpay)
 *                     checkout_id:
 *                       type: integer
 *                     transaction_id:
 *                       type: string
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     checkout_id:
 *                       type: integer
 *                     payment_status:
 *                       type: string
 *                       enum: [awaiting_seller_confirmation]
 *                     booking_id:
 *                       type: integer
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     paymentUrl:
 *                       type: string
 *                       description: URL to redirect the user to Stripe's hosted checkout page
 *                     checkout_id:
 *                       type: integer
 *                     transaction_id:
 *                       type: string
 *       400:
 *         description: Invalid input, booking already paid, or invalid payment method
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to pay for this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  paymentController.createPayment
);

/**
 * @swagger
 * /user/payments/vnpay-return:
 *   get:
 *     tags:
 *       - User - Payment Management
 *     summary: VNPay return URL
 *     description: Endpoint for VNPay to redirect users after payment
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: VNPay response code
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Transaction reference
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Secure hash for verification
 *     responses:
 *       302:
 *         description: Redirects to success or failure page
 */
router.get('/vnpay-return', requestLogger, paymentController.vnpayReturn);

/**
 * @swagger
 * /user/payments/vnpay-ipn:
 *   get:
 *     tags:
 *       - User - Payment Management
 *     summary: VNPay IPN (Instant Payment Notification)
 *     description: Endpoint for VNPay to send payment notifications
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: VNPay response code
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Transaction reference
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Secure hash for verification
 *     responses:
 *       200:
 *         description: IPN response
 */
router.get('/vnpay-ipn', requestLogger, paymentController.vnpayIPN);

/**
 * @swagger
 * /user/payments/stripe-webhook:
 *   post:
 *     tags:
 *       - User - Payment Management
 *     summary: Stripe webhook endpoint
 *     description: Endpoint for Stripe to send payment notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Error processing webhook
 */
router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

/**
 * @swagger
 * /user/payments/mobile/create:
 *   post:
 *     tags:
 *       - User - Payment Management
 *     summary: Create mobile Stripe payment for tour booking
 *     description: Create payment intent, customer and ephemeral key for Stripe Mobile SDK
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: integer
 *                 description: ID of the booking to pay for
 *     responses:
 *       200:
 *         description: Mobile payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: Payment intent client secret for Stripe Mobile SDK
 *                   example: "pi_xxxxxxxxxxxxxxxx_secret_yyyyyyyyyyyyyy"
 *                 ephemeralKey:
 *                   type: string
 *                   description: Ephemeral key secret for Stripe Mobile SDK
 *                   example: "ek_xxxxxxxxxxxxxxxxxxxxxxx"
 *                 customerId:
 *                   type: string
 *                   description: Stripe customer ID
 *                   example: "cus_xxxxxxxxxxxxxx"
 *                 checkout_id:
 *                   type: integer
 *                   description: Internal checkout record ID
 *                 amount:
 *                   type: number
 *                   description: Payment amount in VND
 *       400:
 *         description: Invalid request or booking not available for payment
 *       403:
 *         description: Unauthorized access to booking
 *       404:
 *         description: Booking or user not found
 *       500:
 *         description: Server error
 */
router.post(
  '/mobile/create',
  authenticateJWT,
  requireUser,
  requestLogger,
  paymentController.createMobilePayment
);

/**
 * @swagger
 * /user/payments/mobile/confirm:
 *   post:
 *     tags:
 *       - User - Payment Management
 *     summary: Confirm mobile Stripe payment
 *     description: Confirm payment completion from mobile app
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent_id
 *             properties:
 *               payment_intent_id:
 *                 type: string
 *                 description: Stripe payment intent ID
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
 *                 payment_status:
 *                   type: string
 *                 booking_status:
 *                   type: string
 *                 booking_id:
 *                   type: integer
 *       400:
 *         description: Payment not successful or invalid request
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Payment intent, checkout, or booking not found
 *       500:
 *         description: Server error
 */
router.post(
  '/mobile/confirm',
  authenticateJWT,
  requireUser,
  requestLogger,
  paymentController.confirmMobilePayment
);

export default router;
