import express from 'express';
import * as paymentController from '../../controllers/user/payment.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /user/payments:
 *   post:
 *     tags:
 *       - User - Payment Management
 *     summary: Create a payment for a booking
 *     description: Initiate a payment process for a booking using VNPay
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
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentUrl:
 *                   type: string
 *                   description: URL to redirect the user for payment
 *                 checkout_id:
 *                   type: integer
 *                 transaction_id:
 *                   type: string
 *       400:
 *         description: Invalid input or booking already paid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to pay for this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, requireUser, paymentController.createPayment);

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
router.get('/vnpay-return', paymentController.vnpayReturn);

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
router.get('/vnpay-ipn', paymentController.vnpayIPN);

export default router;
