import express from 'express';
import * as invoiceController from '../../controllers/user/invoice.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /user/invoices:
 *   get:
 *     tags:
 *       - User - Invoice Management
 *     summary: Get user invoices
 *     description: Get all invoices for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user invoices
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireUser,
  invoiceController.getUserInvoices
);

/**
 * @swagger
 * /user/invoices/{id}:
 *   get:
 *     tags:
 *       - User - Invoice Management
 *     summary: Get invoice by ID
 *     description: Get a specific invoice by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this invoice
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateJWT,
  requireUser,
  invoiceController.getInvoiceById
);

/**
 * @swagger
 * /user/invoices/booking/{booking_id}:
 *   get:
 *     tags:
 *       - User - Invoice Management
 *     summary: Get invoice by booking ID
 *     description: Get the invoice for a specific booking
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Invoice details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this booking
 *       404:
 *         description: Booking or invoice not found
 *       500:
 *         description: Server error
 */
router.get(
  '/booking/:booking_id',
  authenticateJWT,
  requireUser,
  invoiceController.getInvoiceByBookingId
);

export default router;
