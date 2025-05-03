import express from 'express';
import * as subscriptionController from '../../controllers/seller/subscription.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /seller/subscriptions/packages:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Get all subscription packages
 *     description: Retrieve a list of all available subscription packages
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter packages by status
 *     responses:
 *       200:
 *         description: List of subscription packages
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/packages',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.getSubscriptionPackages
);

/**
 * @swagger
 * /seller/subscriptions/packages/{id}:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Get subscription package by ID
 *     description: Retrieve a specific subscription package by its ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription package ID
 *     responses:
 *       200:
 *         description: Subscription package details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription package not found
 *       500:
 *         description: Server error
 */
router.get(
  '/packages/:id',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.getSubscriptionPackageById
);

/**
 * @swagger
 * /seller/subscriptions:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Get seller's subscriptions
 *     description: Retrieve a list of all subscriptions for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of seller's subscriptions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.getSellerSubscriptions
);

/**
 * @swagger
 * /seller/subscriptions/active:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Get seller's active subscription
 *     description: Retrieve the active subscription for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 *       500:
 *         description: Server error
 */
router.get(
  '/active',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.getActiveSubscription
);

/**
 * @swagger
 * /seller/subscriptions/payment:
 *   post:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Create a subscription payment
 *     description: Initiate a payment process for a subscription package
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *             properties:
 *               package_id:
 *                 type: integer
 *                 description: ID of the subscription package to purchase
 *               payment_method:
 *                 type: string
 *                 enum: [vnpay, stripe]
 *                 default: vnpay
 *                 description: Payment method to use
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
 *                 subscription_id:
 *                   type: integer
 *                 invoice_id:
 *                   type: integer
 *                 transaction_id:
 *                   type: string
 *       400:
 *         description: Invalid input or package not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription package not found
 *       500:
 *         description: Server error
 */
router.post(
  '/payment',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.createSubscriptionPayment
);

/**
 * @swagger
 * /seller/subscriptions/vnpay-return:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: VNPay return URL for subscription payments
 *     description: Endpoint for VNPay to redirect sellers after subscription payment
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
router.get('/vnpay-return', requestLogger, subscriptionController.vnpayReturn);

/**
 * @swagger
 * /seller/subscriptions/vnpay-ipn:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: VNPay IPN for subscription payments
 *     description: Endpoint for VNPay to send subscription payment notifications
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
router.get('/vnpay-ipn', requestLogger, subscriptionController.vnpayIPN);

/**
 * @swagger
 * /seller/subscriptions/invoices:
 *   get:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Get seller's subscription invoices
 *     description: Retrieve a list of all subscription invoices for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of seller's subscription invoices
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/invoices',
  authenticateJWT,
  requireSeller,
  requestLogger,
  subscriptionController.getSubscriptionInvoices
);

/**
 * @swagger
 * /seller/subscriptions/stripe-webhook:
 *   post:
 *     tags:
 *       - Seller - Subscription Management
 *     summary: Stripe webhook endpoint for subscription payments
 *     description: Endpoint for Stripe to send subscription payment notifications
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
// Special route for Stripe webhooks - needs raw body for signature verification
router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Add logging middleware for debugging
    logger.info(
      `Received Stripe webhook request to /api/seller/subscriptions/stripe-webhook`
    );
    logger.info(`Content-Type: ${req.headers['content-type']}`);
    logger.info(
      `Stripe-Signature: ${
        req.headers['stripe-signature'] ? 'Present' : 'Missing'
      }`
    );

    // Check if the body is a Buffer (raw) as expected
    if (Buffer.isBuffer(req.body)) {
      logger.info(`Request body is a Buffer of length: ${req.body.length}`);
    } else {
      logger.warn(`Request body is NOT a Buffer: ${typeof req.body}`);
    }

    next();
  },
  subscriptionController.stripeWebhook
);

export default router;
