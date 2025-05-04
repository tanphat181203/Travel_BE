import express from 'express';
import * as promotionController from '../../controllers/public/promotion.controller.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /public/promotions/tours/{tourId}:
 *   get:
 *     tags:
 *       - Public - Promotion
 *     summary: Get active promotions for a tour
 *     description: Retrieve all active promotions for a specific tour
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: List of active promotions for the tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/tours/:tourId',
  requestLogger,
  promotionController.getActivePromotionsForTour
);

/**
 * @swagger
 * /public/promotions/tours/{tourId}/calculate:
 *   get:
 *     tags:
 *       - Public - Promotion
 *     summary: Calculate discount for a tour
 *     description: Calculate the discount for a given price based on active promotions for a tour. Optionally specify a promotion ID to calculate discount with a specific promotion.
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *       - in: query
 *         name: price
 *         required: true
 *         schema:
 *           type: number
 *         description: Original price to calculate discount for
 *       - in: query
 *         name: promotion_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Specific promotion ID to use for calculation. If not provided, no promotion will be applied.
 *     responses:
 *       200:
 *         description: Discount calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalPrice:
 *                   type: number
 *                 discountedPrice:
 *                   type: number
 *                 discount:
 *                   type: number
 *                 appliedPromotion:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     promotion_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     discount:
 *                       type: number
 *       400:
 *         description: Invalid price parameter
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.get(
  '/tours/:tourId/calculate',
  requestLogger,
  promotionController.calculateDiscountForTour
);

export default router;
