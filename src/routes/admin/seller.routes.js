import express from 'express';
import * as sellerController from '../../controllers/admin/seller.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /admin/sellers:
 *   get:
 *     tags:
 *       - Admin - Seller Management
 *     summary: List all sellers
 *     description: Retrieve a list of all sellers (admin access only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   avatar_url:
 *                     type: string
 *                     nullable: true
 *                   phone_number:
 *                     type: string
 *                     nullable: true
 *                   address:
 *                     type: string
 *                     nullable: true
 *                   status:
 *                     type: string
 *                     description: Account status (pending_verification, active, suspended)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  sellerController.listSellers
);

/**
 * @swagger
 * /admin/sellers/{id}:
 *   get:
 *     tags:
 *       - Admin - Seller Management
 *     summary: Get seller by ID
 *     description: Retrieve seller details by ID (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 avatar_url:
 *                   type: string
 *                   nullable: true
 *                 phone_number:
 *                   type: string
 *                   nullable: true
 *                 address:
 *                   type: string
 *                   nullable: true
 *                 status:
 *                   type: string
 *                   description: Account status (pending_verification, active, suspended)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  sellerController.getSellerById
);

/**
 * @swagger
 * /admin/sellers/{id}:
 *   delete:
 *     tags:
 *       - Admin - Seller Management
 *     summary: Delete seller
 *     description: Delete a seller and their avatar from Firebase Storage (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  sellerController.deleteSeller
);

export default router;
