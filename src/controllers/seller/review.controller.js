import Review from '../../models/Review.js';
import Tour from '../../models/Tour.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getTourReviews = async (req, res) => {
  try {
    const { tourId } = req.params;
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (tour.seller_id !== sellerId) {
      return res.status(403).json({
        message: 'Not authorized to access reviews for this tour',
      });
    }

    const { reviews, totalItems } = await Review.findByTourId(
      tourId,
      limit,
      offset
    );
    const pagination = createPaginationMetadata(page, limit, totalItems);

    const averageRating = await Review.getTourAverageRating(tourId);

    logger.info(`Retrieved ${reviews.length} reviews for tour ${tourId}`);

    return res.status(200).json({
      reviews,
      averageRating,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting tour reviews: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Review.checkTourOwnership(reviewId, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const review = await Review.findById(reviewId);
    logger.info(`Retrieved review ${reviewId} for seller ${sellerId}`);

    return res.status(200).json(review);
  } catch (error) {
    logger.error(`Error getting review by ID: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const getAllSellerReviews = async (req, res) => {
  try {
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { tours } = await Tour.findBySellerId(sellerId);

    if (tours.length === 0) {
      return res.status(200).json({
        reviews: [],
        pagination: createPaginationMetadata(1, limit, 0),
      });
    }

    const tourIds = tours.map((tour) => tour.tour_id);

    const { reviews, totalItems } = await Review.findBySellerTours(
      tourIds,
      limit,
      offset
    );
    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(`Retrieved ${reviews.length} reviews for seller ${sellerId}`);

    return res.status(200).json({
      reviews,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting all seller reviews: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};
