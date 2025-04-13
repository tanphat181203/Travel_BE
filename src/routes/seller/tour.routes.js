import express from 'express';
import * as tourController from '../../controllers/seller/tour.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import { upload } from '../../utils/uploadHandler.js';

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
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       image_id:
 *                         type: integer
 *                       tour_id:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *                       is_cover:
 *                         type: boolean
 *                       upload_date:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Seller must be verified to create tours
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, requireSeller, tourController.createTour);

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
 *         description: List of seller's tours
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
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         image_id:
 *                           type: integer
 *                         tour_id:
 *                           type: integer
 *                         image_url:
 *                           type: string
 *                         is_cover:
 *                           type: boolean
 *                         upload_date:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireSeller,
  tourController.getToursBySellerId
);

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
 *         description: List of matching tours for the seller
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
 *                   images:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         image_id:
 *                           type: integer
 *                         tour_id:
 *                           type: integer
 *                         image_url:
 *                           type: string
 *                         is_cover:
 *                           type: boolean
 *                         upload_date:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized - not logged in
 *       404:
 *         description: No tours found
 *       500:
 *         description: Server error
 */
router.get(
  '/search',
  authenticateJWT,
  requireSeller,
  tourController.searchTours
);

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
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       image_id:
 *                         type: integer
 *                       tour_id:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *                       is_cover:
 *                         type: boolean
 *                       upload_date:
 *                         type: string
 *                         format: date-time
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
router.put('/:id', authenticateJWT, requireSeller, tourController.updateTour);

/**
 * @swagger
 * /seller/tours/{id}:
 *   delete:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Delete tour
 *     description: Delete a tour and all its associated images from Firebase Storage (seller access only)
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
 *                   example: Tour deleted successfully with all associated images
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to delete this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireSeller,
  tourController.deleteTour
);

/**
 * @swagger
 * /seller/tours/{id}/images:
 *   post:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Upload tour images
 *     description: Upload multiple images for a tour (seller access only)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload (max 10)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   image_id:
 *                     type: integer
 *                   tour_id:
 *                     type: integer
 *                   image_url:
 *                     type: string
 *                   is_cover:
 *                     type: boolean
 *                   upload_date:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Invalid input or file upload failed
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to upload images for this tour
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/images',
  authenticateJWT,
  requireSeller,
  upload.array('images', 10),
  tourController.uploadTourImages
);

/**
 * @swagger
 * /seller/tours/{id}/cover-image/{imageId}:
 *   put:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Set tour cover image
 *     description: Set an image as the cover image for a tour (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Cover image set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image_id:
 *                   type: integer
 *                 tour_id:
 *                   type: integer
 *                 image_url:
 *                   type: string
 *                 is_cover:
 *                   type: boolean
 *                   enum: [true]
 *                 upload_date:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to modify this tour
 *       404:
 *         description: Tour or image not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/cover-image/:imageId',
  authenticateJWT,
  requireSeller,
  tourController.setCoverImage
);

/**
 * @swagger
 * /seller/tours/{id}/images/{imageId}:
 *   delete:
 *     tags:
 *       - Seller - Tour Management
 *     summary: Delete tour image
 *     description: Delete an image from a tour and remove it from Firebase Storage (seller access only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tour ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully from database and Firebase Storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image deleted successfully
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Not authorized to modify this tour
 *       404:
 *         description: Tour or image not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/images/:imageId',
  authenticateJWT,
  requireSeller,
  tourController.deleteTourImage
);

export default router;
