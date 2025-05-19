import History from '../models/History.js';
import logger from '../utils/logger.js';

export const trackTourView = async (userId, tourId) => {
  try {
    if (!userId) {
      logger.debug('Skipping tour view tracking for unauthenticated user');
      return null;
    }

    const hasRecentView = await History.hasRecentView(userId, tourId);
    if (hasRecentView) {
      logger.debug(`User ${userId} already viewed tour ${tourId} recently, skipping`);
      return null;
    }

    return await History.create({
      user_id: userId,
      tour_id: tourId,
      action_type: 'view'
    });
  } catch (error) {
    logger.error(`Error tracking tour view: ${error.message}`);
    return null;
  }
};

export const trackTourBooking = async (userId, tourId) => {
  try {
    if (!userId) {
      logger.debug('Skipping tour booking tracking for unauthenticated user');
      return null;
    }

    return await History.create({
      user_id: userId,
      tour_id: tourId,
      action_type: 'booking'
    });
  } catch (error) {
    logger.error(`Error tracking tour booking: ${error.message}`);
    return null;
  }
}; 