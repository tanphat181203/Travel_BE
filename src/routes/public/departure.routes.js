import express from 'express';
import * as departureController from '../../controllers/public/departure.controller.js';

const router = express.Router();

/**
 * @swagger
 * /public/tours/{tourId}/departures:
 *   get:
 *     tags:
 *       - Public Departures
 *     summary: Get available tour departures
 *     description: Get all available departures for a specific tour with future dates
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: List of available departures for the tour
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
 *       404:
 *         description: Tour not found or not available
 *       500:
 *         description: Server error
 */
router.get('/tours/:tourId/departures', departureController.getDeparturesByTourId);

/**
 * @swagger
 * /public/departures/{departureId}:
 *   get:
 *     tags:
 *       - Public Departures
 *     summary: Get departure by ID
 *     description: Get a specific available departure by ID with future date
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
 *       404:
 *         description: Departure not found, not available, or associated tour not available
 *       500:
 *         description: Server error
 */
router.get('/departures/:departureId', departureController.getDepartureById);

/**
 * @swagger
 * /public/departures:
 *   get:
 *     tags:
 *       - Public Departures
 *     summary: Search departures
 *     description: Search for available departures with future dates
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
 *         description: Filter by start date (from). Defaults to today if not provided.
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (to)
 *     responses:
 *       200:
 *         description: List of matching available departures
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
 *       404:
 *         description: Tour not found or not available (when tour_id is provided)
 *       500:
 *         description: Server error
 */
router.get('/departures', departureController.searchDepartures);

export default router;
