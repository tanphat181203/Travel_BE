import Tour from '../../models/Tour.js';
import { generateEmbedding } from '../../utils/embeddingHelper.js';

export const createTour = async (req, res, next) => {
  try {
    const seller_id = req.userId;

    const itinerary = req.body.itinerary;
    if (!Array.isArray(itinerary)) {
      return res.status(400).json({
        message: 'Itinerary must be an array of day objects',
      });
    }

    for (const day of itinerary) {
      if (!day.day_number || !day.title) {
        return res.status(400).json({
          message: 'Each itinerary day must have day_number and title',
        });
      }
    }

    const tourData = {
      ...req.body,
      seller_id,
    };

    const newTour = await Tour.create(tourData);

    (async () => {
      try {
        const embedding = await generateEmbedding(tourData);
        await Tour.updateEmbedding(newTour.tour_id, embedding);
        console.log(`Embedding created for tour_id = ${newTour.tour_id}`);
      } catch (error) {
        console.error(
          `Error updating embedding for tour ${newTour.tour_id}:`,
          error
        );
      }
    })();

    return res.status(201).json(newTour);
  } catch (error) {
    next(error);
  }
};

export const getToursBySellerId = async (req, res, next) => {
  try {
    const seller_id = req.userId;
    const tours = await Tour.findBySellerId(seller_id);

    const sanitizedTours = tours.map((tour) => {
      delete tour.embedding;
      return tour;
    });

    return res.status(200).json(sanitizedTours);
  } catch (error) {
    next(error);
  }
};

export const updateTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller_id = req.userId;

    const existingTour = await Tour.findById(id);
    if (!existingTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (existingTour.seller_id !== seller_id) {
      return res.status(403).json({
        message: 'You are not authorized to update this tour',
      });
    }

    if (req.body.itinerary) {
      if (!Array.isArray(req.body.itinerary)) {
        return res.status(400).json({
          message: 'Itinerary must be an array of day objects',
        });
      }

      for (const day of req.body.itinerary) {
        if (!day.day_number || !day.title) {
          return res.status(400).json({
            message: 'Each itinerary day must have day_number and title',
          });
        }
      }
    }

    const updatedTour = await Tour.update(id, req.body);
    delete updatedTour.embedding;

    (async () => {
      try {
        const tourData = await Tour.findById(id);
        const embedding = await generateEmbedding(tourData);
        await Tour.updateEmbedding(id, embedding);
        console.log(`Embedding updated for tour_id = ${id}`);
      } catch (error) {
        console.error(
          `Error updating embedding for tour ${id}:`,
          error
        );
      }
    })();

    return res.status(200).json(updatedTour);
  } catch (error) {
    next(error);
  }
};

export const deleteTour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller_id = req.userId;

    const existingTour = await Tour.findById(id);
    if (!existingTour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (existingTour.seller_id !== seller_id) {
      return res.status(403).json({
        message: 'You are not authorized to delete this tour',
      });
    }

    await Tour.delete(id);

    return res.status(200).json({
      message: 'Tour deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchTours = async (req, res, next) => {
  try {
    const seller_id = req.userId;
    const searchParams = req.query;
    const tours = await Tour.search({ ...searchParams, seller_id });

    if (tours.length === 0) {
      return res.status(404).json({ message: 'No tours found' });
    }

    const sanitizedTours = tours.map((tour) => {
      delete tour.embedding;
      return tour;
    });

    return res.status(200).json(sanitizedTours);
  } catch (error) {
    next(error);
  }
};
