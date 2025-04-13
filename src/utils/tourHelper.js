import Tour from '../models/Tour.js';

export const checkTourOwnership = async (tourId, sellerId) => {
  const tour = await Tour.findById(tourId);

  if (!tour) {
    return {
      success: false,
      status: 404,
      message: 'Tour not found',
    };
  }

  if (tour.seller_id !== sellerId) {
    return {
      success: false,
      status: 403,
      message: 'Not authorized',
    };
  }

  return { success: true, tour };
};
