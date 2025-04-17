import Tour from '../../models/Tour.js';
import { generateEmbedding } from '../../utils/embeddingHelper.js';
import { uploadToFirebase } from '../../utils/uploadHandler.js';
import { checkTourOwnership } from '../../utils/tourHelper.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

// Tour controllers
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

    const { page, limit, offset } = getPaginationParams(req.query);

    const { tours, totalItems } = await Tour.findBySellerId(
      seller_id,
      limit,
      offset
    );

    const sanitizedTours = tours.map((tour) => {
      delete tour.embedding;
      return tour;
    });

    const pagination = createPaginationMetadata(page, limit, totalItems);

    return res.status(200).json({
      tours: sanitizedTours,
      pagination,
    });
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
        console.error(`Error updating embedding for tour ${id}:`, error);
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

    const { page, limit, offset } = getPaginationParams(req.query);

    const searchParams = { ...req.query, seller_id, limit, offset };

    const { tours, totalItems } = await Tour.search(searchParams);

    if (tours.length === 0 && page === 1) {
      return res.status(404).json({ message: 'No tours found' });
    }

    const sanitizedTours = tours.map((tour) => {
      delete tour.embedding;
      return tour;
    });

    const pagination = createPaginationMetadata(page, limit, totalItems);

    return res.status(200).json({
      tours: sanitizedTours,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Tour image controllers
export const uploadTourImages = async (req, res, next) => {
  try {
    const tourId = req.params.id;
    const sellerId = req.userId;

    const tour = await checkTourOwnership(tourId, sellerId);
    if (!tour.success) {
      return res.status(tour.status).json({ message: tour.message });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToFirebase(file, `tours/${tourId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    const savedImages = await Tour.addImages(tourId, imageUrls);

    res.status(201).json(savedImages);
  } catch (error) {
    next(error);
  }
};

export const setCoverImage = async (req, res, next) => {
  try {
    const { id: tourId, imageId } = req.params;
    const sellerId = req.userId;

    const tour = await checkTourOwnership(tourId, sellerId);
    if (!tour.success) {
      return res.status(tour.status).json({ message: tour.message });
    }

    const updatedImage = await Tour.setCoverImage(tourId, imageId);
    if (!updatedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.status(200).json(updatedImage);
  } catch (error) {
    next(error);
  }
};

export const deleteTourImage = async (req, res, next) => {
  try {
    const { id: tourId, imageId } = req.params;
    const sellerId = req.userId;

    const tour = await checkTourOwnership(tourId, sellerId);
    if (!tour.success) {
      return res.status(tour.status).json({ message: tour.message });
    }

    await Tour.deleteImage(tourId, imageId);

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadAndSetCoverImage = async (req, res, next) => {
  try {
    const tourId = req.params.id;
    const sellerId = req.userId;

    const tour = await checkTourOwnership(tourId, sellerId);
    if (!tour.success) {
      return res.status(tour.status).json({ message: tour.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const imageUrl = await uploadToFirebase(req.file, `tours/${tourId}`);

    const savedImage = await Tour.addCoverImage(tourId, imageUrl);

    res.status(201).json(savedImage);
  } catch (error) {
    next(error);
  }
};
