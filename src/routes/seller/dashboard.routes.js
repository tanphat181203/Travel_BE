import express from 'express';
import * as dashboardController from '../../controllers/seller/dashboard.controller.js';
import { authenticateJWT, requireSeller, checkSellerSubscription } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /seller/dashboard:
 *   get:
 *     tags:
 *       - Seller - Dashboard
 *     summary: Get seller dashboard statistics
 *     description: Retrieve dashboard statistics for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasActiveSubscription:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     package_name:
 *                       type: string
 *                     expiry_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                 tourStats:
 *                   type: object
 *                 bookingStats:
 *                   type: object
 *                 recentBookings:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireSeller,
  checkSellerSubscription,
  requestLogger,
  dashboardController.getDashboardStats
);

/**
 * @swagger
 * /seller/dashboard/subscription-status:
 *   get:
 *     tags:
 *       - Seller - Dashboard
 *     summary: Get seller subscription status
 *     description: Retrieve subscription status for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasActiveSubscription:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     subscription_id:
 *                       type: integer
 *                     package_id:
 *                       type: integer
 *                     package_name:
 *                       type: string
 *                     purchase_date:
 *                       type: string
 *                       format: date-time
 *                     expiry_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     price:
 *                       type: number
 *                     duration_days:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/subscription-status',
  authenticateJWT,
  requireSeller,
  checkSellerSubscription,
  requestLogger,
  dashboardController.getSubscriptionStatus
);

export default router;
