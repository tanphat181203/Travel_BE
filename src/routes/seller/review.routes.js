import express from 'express';
import * as reviewController from '../../controllers/seller/review.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /seller/reviews:
 *   get:
 *     tags:
 *       - Seller - Review Management
 *     summary: Get all reviews for seller's tours
 *     description: Get all reviews for all tours owned by the seller
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of reviews for seller's tours
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
  reviewController.getAllSellerReviews
);

/**
 * @swagger
 * /seller/reviews/tours/{tourId}:
 *   get:
 *     tags:
 *       - Seller - Review Management
 *     summary: Get reviews for a specific tour
 *     description: Get all reviews for a specific tour owned by the seller
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access reviews for this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/tours/:tourId',
  authenticateJWT,
  requireSeller,
  requestLogger,
  reviewController.getTourReviews
);

/**
 * @swagger
 * /seller/reviews/{reviewId}:
 *   get:
 *     tags:
 *       - Seller - Review Management
 *     summary: Get review by ID
 *     description: Get a specific review by ID for a tour owned by the seller
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to access this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:reviewId',
  authenticateJWT,
  requireSeller,
  requestLogger,
  reviewController.getReviewById
);

export default router;
