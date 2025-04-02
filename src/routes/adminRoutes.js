import express from 'express';
import { getAllUsers, deleteUser } from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [user, admin]
 *                   isEmailVerified:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not an admin)
 */
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Admin cannot delete themselves
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not an admin)
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;
