import express from 'express';
import * as sellerController from '../../controllers/public/seller.controller.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /public/sellers:
 *   get:
 *     tags:
 *       - Public Sellers
 *     summary: Get all active sellers
 *     description: Retrieve a list of all active sellers
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
 *         description: A list of active sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sellers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *                         nullable: true
 *                       phone_number:
 *                         type: string
 *                         nullable: true
 *                       address:
 *                         type: string
 *                         nullable: true
 *                       seller_description:
 *                         type: string
 *                         nullable: true
 *                         description: Detailed description of the seller and their services
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total_items:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/', requestLogger, sellerController.getAllSellers);

/**
 * @swagger
 * /public/sellers/{id}:
 *   get:
 *     tags:
 *       - Public Sellers
 *     summary: Get seller information by ID
 *     description: Retrieve detailed information of a specific seller by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The seller ID
 *     responses:
 *       200:
 *         description: Seller information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seller:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                     address:
 *                       type: string
 *                       nullable: true
 *                     seller_description:
 *                       type: string
 *                       nullable: true
 *                       description: Detailed description of the seller and their services
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Seller not found
 *       400:
 *         description: Invalid seller ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid seller ID
 *       500:
 *         description: Server error
 */
router.get('/:id', requestLogger, sellerController.getSellerById);

export default router; 