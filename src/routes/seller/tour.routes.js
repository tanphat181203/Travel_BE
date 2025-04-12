import express from 'express';
import * as tourController from '../../controllers/seller/tour.controller.js';
import { authenticateJWT } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /seller/tours:
 *   post:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Create tour
 *     description: Create a new tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *               - departure_location
 *               - description
 *               - destination
 *               - region
 *               - itinerary
 *               - max_participants
 *             properties:
 *               title:
 *                 type: string
 *               duration:
 *                 type: string
 *                 description: Duration of the tour
 *               departure_location:
 *                 type: string
 *               description:
 *                 type: string
 *               destination:
 *                 type: array
 *                 items:
 *                   type: string
 *               region:
 *                 type: integer
 *                 description: Region ID
 *               max_participants:
 *                 type: integer
 *                 description: Maximum number of participants
 *               availability:
 *                 type: boolean
 *                 default: true
 *               itinerary:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - day_number
 *                     - title
 *                   properties:
 *                     day_number:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Tour created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Seller must be verified to create tours
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, tourController.createTour);

/**
 * @swagger
 * /seller/tours:
 *   get:
 *     tags:
 *       - Seller - Tour Management
 *     summary: List Seller - Tour Management
 *     description: Get all tours for the authenticated seller
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of tours
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
 *                   max_participants:
 *                     type: integer
 *                   availability:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get('/', authenticateJWT, tourController.getToursBySellerId);

/**
 * @swagger
 * /seller/tours/search:
 *   get:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Search Seller Tours
 *     description: Search tours for the authenticated seller
 *     security:
 *       - BearerAuth: []
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
 *         description: List of matching tours
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
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get('/search', authenticateJWT, tourController.searchTours);

/**
 * @swagger
 * /seller/tours/{id}:
 *   put:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Update tour
 *     description: Update an existing tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *               duration:
 *                 type: string
 *               departure_location:
 *                 type: string
 *               description:
 *                 type: string
 *               destination:
 *                 type: array
 *                 items:
 *                   type: string
 *               region:
 *                 type: integer
 *               max_participants:
 *                 type: integer
 *               availability:
 *                 type: boolean
 *               itinerary:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day_number:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Tour updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to update this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateJWT, tourController.updateTour);

/**
 * @swagger
 * /seller/tours/{id}:
 *   delete:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Delete tour
 *     description: Delete a tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tour deleted successfully
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to delete this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, tourController.deleteTour);

export default router;
