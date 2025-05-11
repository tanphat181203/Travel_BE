import Review from '../../models/Review.js';
import Tour from '../../models/Tour.js';
import Booking from '../../models/Booking.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const createReview = async (req, res) => {
  try {
    const { tour_id, departure_id, ratings, comment } = req.body;
    const user_id = req.userId;

    if (!tour_id || !departure_id) {
      return res.status(400).json({
        message: 'Tour ID and departure ID are required',
      });
    }

    const requiredRatings = [
      'Services',
      'Quality',
      'Guides',
      'Safety',
      'Foods',
      'Hotels',
    ];
    const missingRatings = requiredRatings.filter(
      (field) => !ratings || ratings[field] === undefined
    );

    if (missingRatings.length > 0) {
      return res.status(400).json({
        message: `Missing required ratings: ${missingRatings.join(', ')}`,
      });
    }

    for (const key in ratings) {
      const rating = parseInt(ratings[key]);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          message: `Invalid rating value for ${key}. Must be between 1 and 5.`,
        });
      }
    }

    const tour = await Tour.findById(tour_id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Check if the user can review this departure
    const reviewCheck = await Review.canUserReviewDeparture(
      user_id,
      departure_id
    );
    if (!reviewCheck.canReview) {
      return res.status(403).json({
        message: reviewCheck.message,
        code: reviewCheck.code,
      });
    }

    const reviewData = {
      tour_id,
      user_id,
      booking_id: reviewCheck.bookingId,
      departure_id,
      ratings,
      comment,
    };

    const newReview = await Review.create(reviewData);
    logger.info(
      `User ${user_id} created review for tour ${tour_id}, departure ${departure_id}`
    );

    return res.status(201).json(newReview);
  } catch (error) {
    logger.error(`Error creating review: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const user_id = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { reviews, totalItems } = await Review.findByUserId(
      user_id,
      limit,
      offset
    );
    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(`Retrieved ${reviews.length} reviews for user ${user_id}`);

    return res.status(200).json({
      reviews,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting user reviews: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.userId;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user_id !== user_id) {
      return res.status(403).json({
        message: 'Not authorized to access this review',
      });
    }

    logger.info(`Retrieved review ${reviewId} for user ${user_id}`);

    return res.status(200).json(review);
  } catch (error) {
    logger.error(`Error getting review by ID: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.userId;
    const { ratings, comment } = req.body;

    const ownershipCheck = await Review.checkOwnership(reviewId, user_id);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    if (ratings) {
      const requiredRatings = [
        'Services',
        'Quality',
        'Guides',
        'Safety',
        'Foods',
        'Hotels',
      ];
      const missingRatings = requiredRatings.filter((field) => !ratings[field]);

      if (missingRatings.length > 0) {
        return res.status(400).json({
          message: `Missing required ratings: ${missingRatings.join(', ')}`,
        });
      }

      for (const key in ratings) {
        const rating = parseInt(ratings[key]);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({
            message: `Invalid rating value for ${key}. Must be between 1 and 5.`,
          });
        }
      }
    }

    const updateData = {};
    if (ratings) updateData.ratings = ratings;
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await Review.update(reviewId, updateData);
    logger.info(`User ${user_id} updated review ${reviewId}`);

    return res.status(200).json(updatedReview);
  } catch (error) {
    logger.error(`Error updating review: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.userId;

    const ownershipCheck = await Review.checkOwnership(reviewId, user_id);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    await Review.delete(reviewId);
    logger.info(`User ${user_id} deleted review ${reviewId}`);

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting review: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const createSimpleReview = async (req, res) => {
  try {
    const { tour_id, ratings, comment } = req.body;
    const user_id = req.userId;

    if (!tour_id) {
      return res.status(400).json({
        message: 'Tour ID is required',
      });
    }

    const requiredRatings = [
      'Services',
      'Quality',
      'Guides',
      'Safety',
      'Foods',
      'Hotels',
    ];
    const missingRatings = requiredRatings.filter(
      (field) => !ratings || ratings[field] === undefined
    );

    if (missingRatings.length > 0) {
      return res.status(400).json({
        message: `Missing required ratings: ${missingRatings.join(', ')}`,
      });
    }

    for (const key in ratings) {
      const rating = parseInt(ratings[key]);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          message: `Invalid rating value for ${key}. Must be between 1 and 5.`,
        });
      }
    }

    const tour = await Tour.findById(tour_id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const departureCheck = await Review.findLatestDepartureForUserAndTour(
      user_id,
      tour_id
    );
    
    if (!departureCheck.found) {
      return res.status(403).json({
        message: departureCheck.message,
        code: departureCheck.code,
      });
    }

    const reviewData = {
      tour_id,
      user_id,
      booking_id: departureCheck.bookingId,
      departure_id: departureCheck.departureId,
      ratings,
      comment,
    };

    const newReview = await Review.create(reviewData);
    logger.info(
      `User ${user_id} created review for tour ${tour_id}, departure ${departureCheck.departureId}`
    );

    return res.status(201).json(newReview);
  } catch (error) {
    logger.error(`Error creating simple review: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};
