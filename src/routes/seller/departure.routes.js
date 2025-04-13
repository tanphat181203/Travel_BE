import express from 'express';
import * as departureController from '../../controllers/seller/departure.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /seller/tours/{tourId}/departures:
 *   post:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Create tour departure
 *     description: Create a new departure for a tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_date
 *               - price_adult
 *               - price_child_120_140
 *               - price_child_100_120
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-25"
 *                 description: Departure date (YYYY-MM-DD)
 *               price_adult:
 *                 type: number
 *                 format: float
 *                 example: 1200.00
 *                 description: Price for adults
 *               price_child_120_140:
 *                 type: number
 *                 format: float
 *                 example: 800.00
 *                 description: Price for children 120-140cm
 *               price_child_100_120:
 *                 type: number
 *                 format: float
 *                 example: 600.00
 *                 description: Price for children 100-120cm
 *               availability:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the departure is available for booking
 *               description:
 *                 type: string
 *                 description: Additional information about the departure
 *     responses:
 *       201:
 *         description: Departure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departure_id:
 *                   type: integer
 *                 tour_id:
 *                   type: integer
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 price_adult:
 *                   type: number
 *                   format: float
 *                 price_child_120_140:
 *                   type: number
 *                   format: float
 *                 price_child_100_120:
 *                   type: number
 *                   format: float
 *                 availability:
 *                   type: boolean
 *                 description:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to create departures for this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:tourId/departures',
  authenticateJWT,
  requireSeller,
  departureController.createDeparture
);

/**
 * @swagger
 * /seller/tours/{tourId}/departures:
 *   get:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Get tour departures
 *     description: Get all departures for a specific tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: List of departures for the tour
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   departure_id:
 *                     type: integer
 *                   tour_id:
 *                     type: integer
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   price_adult:
 *                     type: number
 *                     format: float
 *                   price_child_120_140:
 *                     type: number
 *                     format: float
 *                   price_child_100_120:
 *                     type: number
 *                     format: float
 *                   availability:
 *                     type: boolean
 *                   description:
 *                     type: string
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to view departures for this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:tourId/departures',
  authenticateJWT,
  requireSeller,
  departureController.getDeparturesByTourId
);

/**
 * @swagger
 * /seller/departures:
 *   get:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Search departures
 *     description: Search for departures with filters (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tour_id
 *         schema:
 *           type: integer
 *         description: Filter by tour ID
 *       - in: query
 *         name: start_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (from)
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (to)
 *       - in: query
 *         name: availability
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *     responses:
 *       200:
 *         description: List of matching departures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   departure_id:
 *                     type: integer
 *                   tour_id:
 *                     type: integer
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   price_adult:
 *                     type: number
 *                     format: float
 *                   price_child_120_140:
 *                     type: number
 *                     format: float
 *                   price_child_100_120:
 *                     type: number
 *                     format: float
 *                   availability:
 *                     type: boolean
 *                   description:
 *                     type: string
 *       401:
 *         description: Unauthorized - not logged in
 *       404:
 *         description: No tours found for this seller
 *       500:
 *         description: Server error
 */
router.get(
  '/departures',
  authenticateJWT,
  requireSeller,
  departureController.searchDepartures
);

/**
 * @swagger
 * /seller/departures/{departureId}:
 *   get:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Get departure by ID
 *     description: Get a specific departure by ID (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Departure ID
 *     responses:
 *       200:
 *         description: Departure details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departure_id:
 *                   type: integer
 *                 tour_id:
 *                   type: integer
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 price_adult:
 *                   type: number
 *                   format: float
 *                 price_child_120_140:
 *                   type: number
 *                   format: float
 *                 price_child_100_120:
 *                   type: number
 *                   format: float
 *                 availability:
 *                   type: boolean
 *                 description:
 *                   type: string
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to view this departure
 *       404:
 *         description: Departure not found
 *       500:
 *         description: Server error
 */
router.get(
  '/departures/:departureId',
  authenticateJWT,
  requireSeller,
  departureController.getDepartureById
);

/**
 * @swagger
 * /seller/departures/{departureId}:
 *   put:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Update departure
 *     description: Update an existing departure (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Departure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-25"
 *                 description: Departure date (YYYY-MM-DD)
 *               price_adult:
 *                 type: number
 *                 format: float
 *                 example: 1200.00
 *                 description: Price for adults
 *               price_child_120_140:
 *                 type: number
 *                 format: float
 *                 example: 800.00
 *                 description: Price for children 120-140cm
 *               price_child_100_120:
 *                 type: number
 *                 format: float
 *                 example: 600.00
 *                 description: Price for children 100-120cm
 *               availability:
 *                 type: boolean
 *                 description: Whether the departure is available for booking
 *               description:
 *                 type: string
 *                 description: Additional information about the departure
 *     responses:
 *       200:
 *         description: Departure updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departure_id:
 *                   type: integer
 *                 tour_id:
 *                   type: integer
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 price_adult:
 *                   type: number
 *                   format: float
 *                 price_child_120_140:
 *                   type: number
 *                   format: float
 *                 price_child_100_120:
 *                   type: number
 *                   format: float
 *                 availability:
 *                   type: boolean
 *                 description:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to update this departure
 *       404:
 *         description: Departure not found
 *       500:
 *         description: Server error
 */
router.put(
  '/departures/:departureId',
  authenticateJWT,
  requireSeller,
  departureController.updateDeparture
);

/**
 * @swagger
 * /seller/departures/{departureId}:
 *   delete:
 *     tags:
 *       - Seller - Departure Management
 *     summary: Delete departure
 *     description: Delete a departure (seller access only). Cannot delete departures with existing bookings.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Departure ID
 *     responses:
 *       200:
 *         description: Departure deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Departure deleted successfully
 *       400:
 *         description: Cannot delete departure with existing bookings
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to delete this departure
 *       404:
 *         description: Departure not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/departures/:departureId',
  authenticateJWT,
  requireSeller,
  departureController.deleteDeparture
);

export default router;
