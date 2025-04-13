import Departure from '../../models/Departure.js';
import Tour from '../../models/Tour.js';

export const getDeparturesByTourId = async (req, res, next) => {
  try {
    const tourId = req.params.tourId;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (!tour.availability) {
      return res.status(404).json({ message: 'Tour is not available' });
    }

    const departures = await Departure.findByTourId(tourId);
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const availableDepartures = departures.filter(departure => {
      const departureDate = new Date(departure.start_date);
      return departure.availability && departureDate >= currentDate;
    });

    return res.status(200).json(availableDepartures);
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
    const searchParams = req.query;
    
    if (!searchParams.start_date_from) {
      const today = new Date();
      searchParams.start_date_from = today.toISOString().split('T')[0];
    }
    
    searchParams.availability = true;
    
    const departures = await Departure.search(searchParams);
    
    if (searchParams.tour_id) {
      const tour = await Tour.findById(searchParams.tour_id);
      if (!tour || !tour.availability) {
        return res.status(404).json({ message: 'Tour is not available' });
      }
    } else {
      const availableDepartures = [];
      
      for (const departure of departures) {
        const tour = await Tour.findById(departure.tour_id);
        if (tour && tour.availability) {
          availableDepartures.push(departure);
        }
      }
      
      return res.status(200).json(availableDepartures);
    }
    
    return res.status(200).json(departures);
  } catch (error) {
    next(error);
  }
};
