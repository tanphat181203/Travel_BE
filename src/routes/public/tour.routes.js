import express from 'express';
import * as tourController from '../../controllers/public/tour.controller.js';
import requestLogger from './../../middlewares/requestLogger.js';

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
router.get('/departure-locations', requestLogger, tourController.getDepartureLocations);

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
router.get('/:tourId', requestLogger, tourController.getTourById);

export default router;
