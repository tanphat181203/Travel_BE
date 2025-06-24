import express from 'express';
import * as invoiceController from '../../controllers/seller/invoice.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /seller/invoices:
 *   get:
 *     tags:
 *       - Seller - Invoice Management
 *     summary: Get seller invoices
 *     description: Get all invoices for the authenticated seller's tours
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller invoices
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
  invoiceController.getSellerInvoices
);

/**
 * @swagger
 * /seller/invoices/{id}:
 *   get:
 *     tags:
 *       - Seller - Invoice Management
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
  requireSeller,
  requestLogger,
  invoiceController.getInvoiceById
);

/**
 * @swagger
 * /seller/invoices/{id}/html:
 *   get:
 *     tags:
 *       - Seller - Invoice Management
 *     summary: View invoice HTML by ID
 *     description: Generate and display an HTML invoice by ID
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
 *         description: HTML invoice
 *         content:
 *           text/html:
 *             schema:
 *               type: string
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
  '/:id/html',
  authenticateJWT,
  requireSeller,
  requestLogger,
  invoiceController.viewInvoiceHtml
);

/**
 * @swagger
 * /seller/invoices/booking/{booking_id}/html:
 *   get:
 *     tags:
 *       - Seller - Invoice Management
 *     summary: View invoice HTML by booking ID
 *     description: Generate and display an HTML invoice for a specific booking
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
 *         description: HTML invoice
 *         content:
 *           text/html:
 *             schema:
 *               type: string
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
  '/booking/:booking_id/html',
  authenticateJWT,
  requireSeller,
  requestLogger,
  invoiceController.viewInvoiceHtmlByBookingId
);

/**
 * @swagger
 * /seller/invoices/{id}/send-email:
 *   post:
 *     tags:
 *       - Seller - Invoice Management
 *     summary: Send invoice via email
 *     description: Send an invoice as PDF attachment to the user's email
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
 *         description: Email sent successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this invoice
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error sending email
 */
router.post(
  '/:id/send-email',
  authenticateJWT,
  requireSeller,
  requestLogger,
  invoiceController.sendInvoiceByEmail
);

export default router;
