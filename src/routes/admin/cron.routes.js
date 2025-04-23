import express from 'express';
import * as cronController from '../../controllers/admin/cron.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /admin/cron/update-overdue-departures:
 *   post:
 *     tags:
 *       - Admin - System Management
 *     summary: Update overdue departures
 *     description: Manually trigger the update of overdue departures to unavailable (admin access only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue departures updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully updated 5 overdue departures to unavailable
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 updatedDepartures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       departure_id:
 *                         type: integer
 *                       tour_id:
 *                         type: integer
 *                       start_date:
 *                         type: string
 *                         format: date
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/update-overdue-departures',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  cronController.triggerOverdueDeparturesUpdate
);

/**
 * @swagger
 * /admin/cron/update-tours-without-departures:
 *   post:
 *     tags:
 *       - Admin - System Management
 *     summary: Update tours without future departures
 *     description: Manually trigger the update of tours without future departures to unavailable (admin access only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tours without future departures updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully updated 3 tours without future departures to unavailable
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 updatedTours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tour_id:
 *                         type: integer
 *                       title:
 *                         type: string
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized - admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/update-tours-without-departures',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  cronController.triggerToursWithoutDeparturesUpdate
);

export default router;
