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
    const { page, limit, offset } = getPaginationParams(req.query);

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const { reviews, totalItems } = await Review.findByTourId(tourId, limit, offset);
    const pagination = createPaginationMetadata(page, limit, totalItems);

    const averageRating = await Review.getTourAverageRating(tourId);

    logger.info(`Retrieved ${reviews.length} public reviews for tour ${tourId}`);

    return res.status(200).json({
      reviews,
      averageRating,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting public tour reviews: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
