import express from 'express';
import * as tourController from '../../controllers/public/tour.controller.js';
import requestLogger from './../../middlewares/requestLogger.js';
import { optionalAuthenticateJWT } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /public/tours/search:
 *   get:
 *     tags:
 *       - Public Tours
 *     summary: Search tours
 *     description: Search for tours based on various criteria
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination
 *       - in: query
 *         name: availability
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price for tour (based on adult price)
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price for tour (based on adult price)
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *         description: Duration (e.g., "4", "4 ngày 3 đêm") - Legacy parameter, consider using duration_range instead
 *       - in: query
 *         name: duration_range
 *         schema:
 *           type: string
 *           enum: ['1-3 ngày', '3-5 ngày', '5-7 ngày', '7+ ngày']
 *         description: Predefined duration range
 *       - in: query
 *         name: min_duration
 *         schema:
 *           type: integer
 *         description: Minimum duration in days
 *       - in: query
 *         name: max_duration
 *         schema:
 *           type: integer
 *         description: Maximum duration in days
 *       - in: query
 *         name: num_people
 *         schema:
 *           type: integer
 *         description: Minimum number of people the tour should accommodate - Legacy parameter, consider using people_range instead
 *       - in: query
 *         name: people_range
 *         schema:
 *           type: string
 *           enum: ['1 người', '2 người', '3-5 người', '5+ người']
 *         description: Predefined people range
 *       - in: query
 *         name: min_people
 *         schema:
 *           type: integer
 *         description: Minimum number of people
 *       - in: query
 *         name: max_people
 *         schema:
 *           type: integer
 *         description: Maximum number of people
 *       - in: query
 *         name: departure_location
 *         schema:
 *           type: string
 *         description: Filter by departure location
 *       - in: query
 *         name: departure_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Exact departure date (YYYY-MM-DD)
 *       - in: query
 *         name: nearby_days
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of days to search around exact date
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tour_id:
 *                     type: integer
 *                   seller_id:
 *                     type: integer
 *                   seller_name:
 *                     type: string
 *                   title:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   departure_location:
 *                     type: string
 *                   description:
 *                     type: string
 *                   destination:
 *                     type: array
 *                     items:
 *                       type: string
 *                   region:
 *                     type: integer
 *                   itinerary:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         day_number:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                   max_participants:
 *                     type: integer
 *                   availability:
 *                     type: boolean
 *       404:
 *         description: No tours found
 *       500:
 *         description: Server error
 */
router.get('/search', requestLogger, tourController.searchTours);

/**
 * @swagger
 * /public/tours/semantic-search:
 *   post:
 *     tags:
 *       - Public Tours
 *     summary: Semantic search for tours
 *     description: Search for tours using natural language queries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tour_id:
 *                     type: integer
 *                   seller_id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   departure_location:
 *                     type: string
 *                   description:
 *                     type: string
 *                   destination:
 *                     type: array
 *                     items:
 *                       type: string
 *                   region:
 *                     type: integer
 *                   itinerary:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         day_number:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                   max_participants:
 *                     type: integer
 *                   availability:
 *                     type: boolean
 *       400:
 *         description: Query is required
 *       500:
 *         description: Server error
 */
router.post('/semantic-search', requestLogger, tourController.semanticSearch);

/**
 * @swagger
 * /public/tours/departure-locations:
 *   get:
 *     tags:
 *       - Public Tours
 *     summary: Get departure locations
 *     description: Get a list of unique departure locations for all tours
 *     responses:
 *       200:
 *         description: List of departure locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Server error
 */
router.get(
  '/departure-locations',
  requestLogger,
  tourController.getDepartureLocations
);

/**
 * @swagger
 * /public/tours/locations:
 *   get:
 *     tags:
 *       - Public Tours
 *     summary: Get all locations
 *     description: Get lists of departure locations and destinations for all tours
 *     responses:
 *       200:
 *         description: Lists of locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departure_locations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/locations', requestLogger, tourController.getLocations);

/**
 * @swagger
 * /public/tours/search-ranges:
 *   get:
 *     tags:
 *       - Public Tours
 *     summary: Get predefined search ranges
 *     description: Get predefined ranges for duration and number of people
 *     responses:
 *       200:
 *         description: Predefined search ranges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 duration_ranges:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['1-3 ngày', '3-5 ngày', '5-7 ngày', '7+ ngày']
 *                 people_ranges:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['1 người', '2 người', '3-5 người', '5+ người']
 *       500:
 *         description: Server error
 */
router.get('/search-ranges', requestLogger, tourController.getSearchRanges);

/**
 * @swagger
 * /public/tours/{tourId}:
 *   get:
 *     tags:
 *       - Public Tours
 *     summary: Get tour details
 *     description: Get detailed information about a specific tour
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tour_id:
 *                   type: integer
 *                 seller_id:
 *                   type: integer
 *                 seller_name:
 *                   type: string
 *                 title:
 *                   type: string
 *                 duration:
 *                   type: string
 *                 departure_location:
 *                   type: string
 *                 description:
 *                   type: string
 *                 destination:
 *                   type: array
 *                   items:
 *                     type: string
 *                 region:
 *                   type: integer
 *                 itinerary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day_number:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                 max_participants:
 *                   type: integer
 *                 availability:
 *                   type: boolean
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get('/:tourId', optionalAuthenticateJWT, requestLogger, tourController.getTourById);

export default router;
