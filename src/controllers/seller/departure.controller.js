import Departure from '../../models/Departure.js';
import Tour from '../../models/Tour.js';
import {
  checkTourOwnership,
  checkDepartureOwnership,
} from '../../utils/tourHelper.js';
import logger from '../../utils/logger.js';

export const createDeparture = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;
    const sellerId = req.userId;

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
    }

    const {
      start_date,
      price_adult,
      price_child_120_140,
      price_child_100_120,
    } = req.body;

    if (
      !start_date ||
      !price_adult ||
      !price_child_120_140 ||
      !price_child_100_120
    ) {
      return res.status(400).json({
        message:
          'Missing required fields: start_date, price_adult, price_child_120_140, price_child_100_120',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date)) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const departureDate = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departureDate < today) {
      return res.status(400).json({
        message: 'Departure date must be in the future',
      });
    }

    const dateExists = await Departure.checkDateExists(tourId, start_date);
    if (dateExists) {
      return res.status(400).json({
        message: 'A departure with this date already exists for this tour',
      });
    }

    if (
      price_adult <= 0 ||
      price_child_120_140 <= 0 ||
      price_child_100_120 <= 0
    ) {
      return res.status(400).json({
        message: 'Prices must be positive numbers',
      });
    }

    const departureData = {
      tour_id: tourId,
      start_date,
      price_adult,
      price_child_120_140,
      price_child_100_120,
      availability:
        req.body.availability !== undefined ? req.body.availability : true,
      description: req.body.description || null,
    };

    const newDeparture = await Departure.create(departureData);

    if (!tourCheck.tour.availability) {
      await Tour.update(tourId, { availability: true });
      logger.info(
        `Tour ${tourId} automatically marked as available after adding a new departure`
      );
    }

    return res.status(201).json(newDeparture);
  } catch (error) {
    next(error);
  }
};

export const getDeparturesByTourId = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;
    const sellerId = req.userId;

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
    }

    const departures = await Departure.findByTourId(tourId);
    return res.status(200).json(departures);
  } catch (error) {
    next(error);
  }
};

export const getDepartureById = async (req, res, next) => {
  try {
    const departureId = req.params.departureId;
    const sellerId = req.userId;

    const departureCheck = await checkDepartureOwnership(departureId, sellerId);
    if (!departureCheck.success) {
      return res
        .status(departureCheck.status)
        .json({ message: departureCheck.message });
    }

    return res.status(200).json(departureCheck.departure);
  } catch (error) {
    next(error);
  }
};

export const updateDeparture = async (req, res, next) => {
  try {
    const departureId = req.params.departureId;
    const sellerId = req.userId;

    const departureCheck = await checkDepartureOwnership(departureId, sellerId);
    if (!departureCheck.success) {
      return res
        .status(departureCheck.status)
        .json({ message: departureCheck.message });
    }

    if (req.body.start_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(req.body.start_date)) {
        return res.status(400).json({
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const departureDate = new Date(req.body.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (departureDate < today) {
        return res.status(400).json({
          message: 'Departure date must be in the future',
        });
      }

      const tourId = departureCheck.tour.tour_id;
      const dateExists = await Departure.checkDateExists(
        tourId,
        req.body.start_date,
        departureId
      );
      if (dateExists) {
        return res.status(400).json({
          message: 'A departure with this date already exists for this tour',
        });
      }
    }

    if (req.body.price_adult && req.body.price_adult <= 0) {
      return res.status(400).json({
        message: 'Adult price must be a positive number',
      });
    }

    if (req.body.price_child_120_140 && req.body.price_child_120_140 <= 0) {
      return res.status(400).json({
        message: 'Child price (120-140cm) must be a positive number',
      });
    }

    if (req.body.price_child_100_120 && req.body.price_child_100_120 <= 0) {
      return res.status(400).json({
        message: 'Child price (100-120cm) must be a positive number',
      });
    }

    const updatedDeparture = await Departure.update(departureId, req.body);

    if (req.body.availability === true && !departureCheck.tour.availability) {
      const tourId = departureCheck.tour.tour_id;
      await Tour.update(tourId, { availability: true });
      logger.info(
        `Tour ${tourId} automatically marked as available after updating departure ${departureId}`
      );
    }

    return res.status(200).json(updatedDeparture);
  } catch (error) {
    next(error);
  }
};

export const deleteDeparture = async (req, res, next) => {
  try {
    const departureId = req.params.departureId;
    const sellerId = req.userId;

    const departureCheck = await checkDepartureOwnership(departureId, sellerId);
    if (!departureCheck.success) {
      return res
        .status(departureCheck.status)
        .json({ message: departureCheck.message });
    }

    try {
      await Departure.delete(departureId);

      const tourId = departureCheck.tour.tour_id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const formattedDate = today.toISOString().split('T')[0];

      const futureDeparturesQuery = `
        SELECT COUNT(*) FROM Departure
        WHERE tour_id = $1
        AND start_date >= $2
        AND availability = true
      `;

      const { pool } = await import('../../config/db.js');
      const futureDeparturesResult = await pool.query(futureDeparturesQuery, [
        tourId,
        formattedDate,
      ]);
      const futureDeparturesCount = parseInt(
        futureDeparturesResult.rows[0].count
      );

      if (futureDeparturesCount === 0 && departureCheck.tour.availability) {
        await Tour.update(tourId, { availability: false });
        logger.info(
          `Tour ${tourId} automatically marked as unavailable after deleting its last future departure`
        );
      }

      return res
        .status(200)
        .json({ message: 'Departure deleted successfully' });
    } catch (deleteError) {
      if (
        deleteError.message.includes(
          'Cannot delete departure with existing bookings'
        )
      ) {
        return res.status(400).json({
          message:
            'Cannot delete departure with existing bookings. Consider marking it as unavailable instead.',
        });
      }
      throw deleteError;
    }
  } catch (error) {
    next(error);
  }
};

export const searchDepartures = async (req, res, next) => {
  try {
    const sellerId = req.userId;
    const searchParams = req.query;

    if (searchParams.tour_id) {
      const tourCheck = await checkTourOwnership(
        searchParams.tour_id,
        sellerId
      );
      if (!tourCheck.success) {
        return res
          .status(tourCheck.status)
          .json({ message: tourCheck.message });
      }
    } else {
      const Tour = (await import('../../models/Tour.js')).default;
      const sellerTours = await Tour.findBySellerId(sellerId);

      if (sellerTours.length === 0) {
        return res
          .status(404)
          .json({ message: 'No tours found for this seller' });
      }

      const tourIds = sellerTours.map((tour) => tour.tour_id);

      const allDepartures = [];
      for (const tourId of tourIds) {
        const departures = await Departure.findByTourId(tourId);
        allDepartures.push(...departures);
      }

      return res.status(200).json(allDepartures);
    }

    const departures = await Departure.search(searchParams);
    return res.status(200).json(departures);
  } catch (error) {
    next(error);
  }
};
