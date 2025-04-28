import express from 'express';
import * as reviewController from '../../controllers/public/review.controller.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /public/reviews/tours/{tourId}:
 *   get:
 *     tags:
 *       - Public - Reviews
 *     summary: Get reviews for a tour
 *     description: Get all reviews for a specific tour
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of reviews for the tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/tours/:tourId',
  requestLogger,
  reviewController.getTourReviews
);

export default router;
