import Tour from '../models/Tour.js';
import Departure from '../models/Departure.js';

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

export const checkDepartureOwnership = async (departureId, sellerId) => {
  const departure = await Departure.findById(departureId);

  if (!departure) {
    return {
      success: false,
      status: 404,
      message: 'Departure not found',
    };
  }

  // Get the tour to check if the seller owns it
  const tour = await Tour.findById(departure.tour_id);

  if (!tour) {
    return {
      success: false,
      status: 404,
      message: 'Associated tour not found',
    };
  }

  if (tour.seller_id !== sellerId) {
    return {
      success: false,
      status: 403,
      message: 'Not authorized to manage this departure',
    };
  }

  return { success: true, departure, tour };
};
