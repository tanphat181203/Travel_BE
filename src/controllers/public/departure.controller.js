import Departure from '../../models/Departure.js';
import Tour from '../../models/Tour.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getDeparturesByTourId = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;

    const { page, limit, offset } = getPaginationParams(req.query);

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (!tour.availability) {
      return res.status(404).json({ message: 'Tour is not available' });
    }

    const { departures, totalItems } = await Departure.findByTourId(
      tourId,
      limit,
      offset
    );

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const availableDepartures = departures.filter((departure) => {
      const departureDate = new Date(departure.start_date);
      return departure.availability && departureDate >= currentDate;
    });

    const pagination = createPaginationMetadata(
      page,
      limit,
      availableDepartures.length
    );

    return res.status(200).json({
      departures: availableDepartures,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartureById = async (req, res, next) => {
  try {
    const departureId = req.params.departureId;

    const departure = await Departure.findById(departureId);
    if (!departure) {
      return res.status(404).json({ message: 'Departure not found' });
    }

    const tour = await Tour.findById(departure.tour_id);
    if (!tour || !tour.availability) {
      return res.status(404).json({ message: 'Tour is not available' });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const departureDate = new Date(departure.start_date);

    if (!departure.availability || departureDate < currentDate) {
      return res.status(404).json({ message: 'Departure is not available' });
    }

    return res.status(200).json(departure);
  } catch (error) {
    next(error);
  }
};

export const searchDepartures = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const searchParams = { ...req.query, limit, offset };

    if (!searchParams.start_date_from) {
      const today = new Date();
      searchParams.start_date_from = today.toISOString().split('T')[0];
    }

    searchParams.availability = true;

    const { departures, totalItems } = await Departure.search(searchParams);

    if (searchParams.tour_id) {
      const tour = await Tour.findById(searchParams.tour_id);
      if (!tour || !tour.availability) {
        return res.status(404).json({ message: 'Tour is not available' });
      }

      const pagination = createPaginationMetadata(page, limit, totalItems);

      return res.status(200).json({
        departures,
        pagination,
      });
    } else {
      const availableDepartures = [];

      for (const departure of departures) {
        const tour = await Tour.findById(departure.tour_id);
        if (tour && tour.availability) {
          availableDepartures.push(departure);
        }
      }

      const pagination = createPaginationMetadata(
        page,
        limit,
        availableDepartures.length
      );

      return res.status(200).json({
        departures: availableDepartures,
        pagination,
      });
    }
  } catch (error) {
    next(error);
  }
};
