import Tour from '../../models/Tour.js';

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
    const searchParams = req.query;
    const tours = await Tour.search(searchParams);

    if (tours.length === 0) {
      return res.status(404).json({ message: 'No tours found' });
    }

    tours.forEach((tour) => {
      delete tour.embedding;
    });

    return res.status(200).json(tours);
  } catch (error) {
    next(error);
  }
};

export const semanticSearch = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const tours = await Tour.semanticSearch(query);
    tours.forEach((tour) => {
      delete tour.embedding;
    });

    return res.status(200).json(tours);
  } catch (error) {
    next(error);
  }
};
