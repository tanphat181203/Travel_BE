import Tour from '../../models/Tour.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getTourById = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;

    const tour = await Tour.findById(tourId);

    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    delete tour.embedding;

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
