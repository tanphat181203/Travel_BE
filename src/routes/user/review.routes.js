import express from 'express';
import * as reviewController from '../../controllers/user/review.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /user/reviews:
 *   post:
 *     tags:
 *       - User - Review Management
 *     summary: Create a new review
 *     description: Create a new review for a tour departure. User must have booked the specific departure and the departure date must have passed.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tour_id
 *               - departure_id
 *               - ratings
 *             properties:
 *               tour_id:
 *                 type: integer
 *                 description: ID of the tour
 *               departure_id:
 *                 type: integer
 *                 description: ID of the specific departure that was booked
 *               ratings:
 *                 type: object
 *                 required:
 *                   - Services
 *                   - Quality
 *                   - Guides
 *                   - Safety
 *                   - Foods
 *                   - Hotels
 *                 properties:
 *                   Services:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Quality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Guides:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Safety:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Foods:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Hotels:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Forbidden - user hasn't booked this departure or departure date hasn't passed yet
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  reviewController.createReview
);

/**
 * @swagger
 * /user/reviews/simple:
 *   post:
 *     tags:
 *       - User - Review Management
 *     summary: Create a new review with just tour_id
 *     description: Create a new review for a tour using just the tour ID. The system will automatically find the latest eligible departure (completed and not yet reviewed) for the user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tour_id
 *               - ratings
 *             properties:
 *               tour_id:
 *                 type: integer
 *                 description: ID of the tour
 *               ratings:
 *                 type: object
 *                 required:
 *                   - Services
 *                   - Quality
 *                   - Guides
 *                   - Safety
 *                   - Foods
 *                   - Hotels
 *                 properties:
 *                   Services:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Quality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Guides:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Safety:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Foods:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Hotels:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Forbidden - user hasn't booked this tour or no eligible departures found
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/simple',
  authenticateJWT,
  requireUser,
  requestLogger,
  reviewController.createSimpleReview
);

/**
 * @swagger
 * /user/reviews:
 *   get:
 *     tags:
 *       - User - Review Management
 *     summary: Get user reviews
 *     description: Get all reviews created by the authenticated user
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
 *         description: List of user reviews
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  reviewController.getUserReviews
);

/**
 * @swagger
 * /user/reviews/{reviewId}:
 *   get:
 *     tags:
 *       - User - Review Management
 *     summary: Get review by ID
 *     description: Get a specific review by ID
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
  requireUser,
  requestLogger,
  reviewController.getReviewById
);

/**
 * @swagger
 * /user/reviews/{reviewId}:
 *   put:
 *     tags:
 *       - User - Review Management
 *     summary: Update review
 *     description: Update an existing review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ratings:
 *                 type: object
 *                 properties:
 *                   Services:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Quality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Guides:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Safety:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Foods:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   Hotels:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to update this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:reviewId',
  authenticateJWT,
  requireUser,
  requestLogger,
  reviewController.updateReview
);

/**
 * @swagger
 * /user/reviews/{reviewId}:
 *   delete:
 *     tags:
 *       - User - Review Management
 *     summary: Delete review
 *     description: Delete an existing review
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
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:reviewId',
  authenticateJWT,
  requireUser,
  requestLogger,
  reviewController.deleteReview
);

export default router;
