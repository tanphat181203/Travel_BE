import Tour from '../../models/Tour.js';
import Departure from '../../models/Departure.js';
import TourService from '../../services/tour.service.js';
import { trackTourView } from '../../services/history.service.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';
import { formatDateToLocal } from '../../utils/dateFormatter.js';

export const getTourById = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;

    const tour = await Tour.findById(tourId);

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    delete tour.embedding;

    const { departures } = await Departure.findAvailableByTourId(tourId);

    const formattedDepartures = departures.map((departure) => ({
      ...departure,
      start_date: formatDateToLocal(departure.start_date),
    }));

    tour.departures = formattedDepartures;
    
    if (req.userId && req.user.role == 'user' && req.user.status == 'active') {
      trackTourView(req.userId, tourId).catch(error => {
        console.error('Error tracking tour view:', error);
      });
    }

    return res.status(200).json(tour);
  } catch (error) {
    next(error);
  }
};

export const searchTours = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const searchParams = { ...req.query, limit, offset };

    const { tours, totalItems } = await Tour.search(searchParams);

    if (tours.length === 0 && page === 1) {
      return res.status(404).json({ message: 'No tours found' });
    }

    tours.forEach((tour) => {
      delete tour.embedding;
    });

    const pagination = createPaginationMetadata(page, limit, totalItems);

    return res.status(200).json({
      tours,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const semanticSearch = async (req, res, next) => {
  try {
    const { query } = req.body;

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const { tours, totalItems } = await Tour.semanticSearch(
      query,
      limit,
      offset
    );

    if (tours.length === 0 && page === 1) {
      return res
        .status(404)
        .json({ message: 'No tours found matching your query' });
    }

    tours.forEach((tour) => {
      delete tour.embedding;
    });

    const pagination = createPaginationMetadata(page, limit, totalItems);

    return res.status(200).json({
      tours,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartureLocations = async (req, res, next) => {
  try {
    const locations = await Tour.getDepartureLocations();
    res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
};

export const getLocations = async (req, res, next) => {
  try {
    const locations = await Tour.getLocations();
    res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
};

export const getSearchRanges = async (req, res, next) => {
  try {
    const ranges = {
      duration_ranges: TourService.getDurationRanges(),
      people_ranges: TourService.getPeopleRanges(),
    };
    res.status(200).json(ranges);
  } catch (error) {
    next(error);
  }
};
