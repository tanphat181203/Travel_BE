import express from 'express';
import * as subscriptionController from '../../controllers/admin/subscription.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /admin/subscriptions/packages:
 *   get:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Get all subscription packages
 *     description: Retrieve a list of all subscription packages (admin access only)
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
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/packages',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.getAllSubscriptionPackages
);

/**
 * @swagger
 * /admin/subscriptions/packages:
 *   post:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Create a new subscription package
 *     description: Create a new subscription package (admin access only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_name
 *               - price
 *               - duration_days
 *             properties:
 *               package_name:
 *                 type: string
 *                 description: Name of the subscription package
 *               description:
 *                 type: string
 *                 description: Description of the package
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price of the package
 *               duration_days:
 *                 type: integer
 *                 description: Duration of the package in days
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: Status of the package
 *     responses:
 *       201:
 *         description: Subscription package created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/packages',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.createSubscriptionPackage
);

/**
 * @swagger
 * /admin/subscriptions/packages/{id}:
 *   put:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Update a subscription package
 *     description: Update an existing subscription package (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               package_name:
 *                 type: string
 *                 description: Name of the subscription package
 *               description:
 *                 type: string
 *                 description: Description of the package
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price of the package
 *               duration_days:
 *                 type: integer
 *                 description: Duration of the package in days
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Status of the package
 *     responses:
 *       200:
 *         description: Subscription package updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized - admin access required
 *       404:
 *         description: Subscription package not found
 *       500:
 *         description: Server error
 */
router.put(
  '/packages/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.updateSubscriptionPackage
);

/**
 * @swagger
 * /admin/subscriptions/packages/{id}:
 *   delete:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Delete a subscription package
 *     description: Delete a subscription package (admin access only)
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
 *         description: Subscription package deleted successfully
 *       400:
 *         description: Cannot delete package with existing subscriptions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized - admin access required
 *       404:
 *         description: Subscription package not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/packages/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.deleteSubscriptionPackage
);

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Get all seller subscriptions
 *     description: Retrieve a list of all seller subscriptions (admin access only)
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
 *         description: List of seller subscriptions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.getAllSellerSubscriptions
);

/**
 * @swagger
 * /admin/subscriptions/update-expired:
 *   post:
 *     tags:
 *       - Admin - Subscription Management
 *     summary: Update expired subscriptions
 *     description: Manually trigger the update of expired subscriptions (admin access only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Expired subscriptions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully updated 3 expired subscriptions
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 updatedSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subscription_id:
 *                         type: integer
 *                       seller_id:
 *                         type: integer
 *                       seller_email:
 *                         type: string
 *                       seller_name:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/update-expired',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  subscriptionController.triggerExpiredSubscriptionsUpdate
);

export default router;
