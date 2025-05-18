import express from 'express';
import * as userController from '../../controllers/admin/user.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: List all users
 *     description: Retrieve a list of all users (admin access only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
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
 *                   role:
 *                     type: string
 *                     enum: [user, seller, admin]
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
  userController.listUsers
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: Get user by ID
 *     description: Retrieve user details by ID (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
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
 *                 role:
 *                   type: string
 *                   enum: [user, seller, admin]
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
 *                 total_confirmed_bookings:
 *                   type: integer
 *                   description: Total number of confirmed bookings by the user
 *                 total_reviews:
 *                   type: integer
 *                   description: Total number of reviews submitted by the user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  userController.getUserById
);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     tags:
 *       - Admin - User Management
 *     summary: Update user status and contact information
 *     description: Update user status, phone number, and address (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending_verification, active, suspended]
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  userController.updateUser
);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin - User Management
 *     summary: Delete user
 *     description: Delete a user and their avatar from Firebase Storage (admin access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  userController.deleteUser
);

export default router;
