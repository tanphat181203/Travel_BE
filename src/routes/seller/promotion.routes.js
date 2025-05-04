import express from 'express';
import * as promotionController from '../../controllers/seller/promotion.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /seller/promotions:
 *   post:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Create a new promotion
 *     description: Create a new promotion for tours
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - discount
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the promotion
 *               description:
 *                 type: string
 *                 description: Description of the promotion
 *               type:
 *                 type: string
 *                 enum: [percent, fixed]
 *                 default: percent
 *                 description: Type of discount (percent or fixed amount)
 *               discount:
 *                 type: number
 *                 format: float
 *                 description: Discount value (percentage or fixed amount)
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date of the promotion (YYYY-MM-DD)
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date of the promotion (YYYY-MM-DD)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: Status of the promotion
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.createPromotion
);

/**
 * @swagger
 * /seller/promotions:
 *   get:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Get all promotions
 *     description: Retrieve all promotions created by the seller
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *         description: If true, only returns promotions that are currently active (within date range)
 *     responses:
 *       200:
 *         description: List of promotions
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
  promotionController.getPromotions
);

/**
 * @swagger
 * /seller/promotions/{id}:
 *   get:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Get promotion by ID
 *     description: Retrieve a specific promotion by its ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.getPromotionById
);

/**
 * @swagger
 * /seller/promotions/{id}:
 *   put:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Update a promotion
 *     description: Update an existing promotion
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the promotion
 *               description:
 *                 type: string
 *                 description: Description of the promotion
 *               type:
 *                 type: string
 *                 enum: [percent, fixed]
 *                 description: Type of discount (percent or fixed amount)
 *               discount:
 *                 type: number
 *                 format: float
 *                 description: Discount value (percentage or fixed amount)
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date of the promotion (YYYY-MM-DD)
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date of the promotion (YYYY-MM-DD)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Status of the promotion
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *       400:
 *         description: Invalid input data or promotion is in use (cannot modify discount or type)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.updatePromotion
);

/**
 * @swagger
 * /seller/promotions/{id}:
 *   delete:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Delete a promotion
 *     description: Delete an existing promotion
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 *       400:
 *         description: Cannot delete - promotion is in use (applied to tours or used in bookings)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.deletePromotion
);

/**
 * @swagger
 * /seller/promotions/{promotionId}/tours/{tourId}:
 *   post:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Apply promotion to tour
 *     description: Apply a promotion to a specific tour
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Promotion applied to tour successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion or tour
 *       404:
 *         description: Promotion or tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:promotionId/tours/:tourId',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.applyPromotionToTour
);

/**
 * @swagger
 * /seller/promotions/{promotionId}/tours:
 *   post:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Apply promotion to multiple tours
 *     description: Apply a promotion to multiple tours at once
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tourIds
 *             properties:
 *               tourIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of tour IDs to apply the promotion to
 *     responses:
 *       200:
 *         description: Promotion applied to tours successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appliedCount:
 *                   type: integer
 *                   description: Number of tours the promotion was newly applied to
 *                 alreadyAppliedCount:
 *                   type: integer
 *                   description: Number of tours that already had this promotion
 *                 invalidTours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tourId:
 *                         type: integer
 *                       reason:
 *                         type: string
 *       400:
 *         description: Invalid request - missing or invalid tourIds
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:promotionId/tours',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.applyPromotionToMultipleTours
);

/**
 * @swagger
 * /seller/promotions/{promotionId}/tours/{tourId}:
 *   delete:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Remove promotion from tour
 *     description: Remove a promotion from a specific tour
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Promotion removed from tour successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion or tour
 *       404:
 *         description: Promotion or tour not found, or promotion not applied to this tour
 *       500:
 *         description: Server error
 */
router.delete(
  '/:promotionId/tours/:tourId',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.removePromotionFromTour
);

/**
 * @swagger
 * /seller/promotions/{promotionId}/tours:
 *   delete:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Remove promotion from multiple tours
 *     description: Remove a promotion from multiple tours at once
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tourIds
 *             properties:
 *               tourIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of tour IDs to remove the promotion from
 *     responses:
 *       200:
 *         description: Promotion removed from tours successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 removedCount:
 *                   type: integer
 *                   description: Number of tours the promotion was removed from
 *                 notAppliedCount:
 *                   type: integer
 *                   description: Number of tours that didn't have this promotion
 *                 invalidTours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tourId:
 *                         type: integer
 *                       reason:
 *                         type: string
 *       400:
 *         description: Invalid request - missing or invalid tourIds
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this promotion
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:promotionId/tours',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.removePromotionFromMultipleTours
);

/**
 * @swagger
 * /seller/promotions/tours/{tourId}:
 *   get:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Get promotions for tour
 *     description: Get all promotions applied to a specific tour
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
 *         description: List of promotions applied to the tour
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this tour
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
  promotionController.getPromotionsForTour
);

/**
 * @swagger
 * /seller/promotions/tours/{tourId}/active:
 *   get:
 *     tags:
 *       - Seller - Promotion Management
 *     summary: Get active promotions for tour
 *     description: Get all currently active promotions applied to a specific tour
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
 *         description: List of active promotions applied to the tour
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner of this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/tours/:tourId/active',
  authenticateJWT,
  requireSeller,
  requestLogger,
  promotionController.getActivePromotionsForTour
);

export default router;
