import Booking from '../../models/Booking.js';
import Departure from '../../models/Departure.js';
import Tour from '../../models/Tour.js';
import logger from '../../utils/logger.js';

export const createBooking = async (req, res) => {
  try {
    const { departure_id, num_adults, num_children_120_140, num_children_100_120, special_requests } = req.body;
    const user_id = req.user.id;

    // Validate input
    if (!departure_id || !num_adults) {
      return res.status(400).json({ message: 'Departure ID and number of adults are required' });
    }

    if (num_adults < 1) {
      return res.status(400).json({ message: 'At least one adult is required' });
    }

    // Check if departure exists and is available
    const departure = await Departure.findById(departure_id);
    if (!departure) {
      return res.status(404).json({ message: 'Departure not found' });
    }

    if (!departure.availability) {
      return res.status(400).json({ message: 'This departure is not available for booking' });
    }

    // Get tour information
    const tour = await Tour.findById(departure.tour_id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (!tour.availability) {
      return res.status(400).json({ message: 'This tour is not available for booking' });
    }

    // Calculate total participants
    const totalParticipants = num_adults + 
                             (num_children_120_140 || 0) + 
                             (num_children_100_120 || 0);

    // Check if there's enough capacity
    if (totalParticipants > tour.max_participants) {
      return res.status(400).json({ 
        message: `Booking exceeds maximum capacity of ${tour.max_participants} participants` 
      });
    }

    // Calculate total price
    const total_price = await Booking.calculateTotalPrice(
      departure_id, 
      num_adults, 
      num_children_120_140 || 0, 
      num_children_100_120 || 0
    );

    // Create booking
    const bookingData = {
      departure_id,
      user_id,
      num_adults,
      num_children_120_140: num_children_120_140 || 0,
      num_children_100_120: num_children_100_120 || 0,
      total_price,
      booking_status: 'pending',
      special_requests: special_requests || ''
    };

    const booking = await Booking.create(bookingData);
    
    logger.info(`User ${user_id} created booking ${booking.booking_id} for departure ${departure_id}`);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        ...booking,
        tour_title: tour.title,
        departure_date: departure.start_date,
        departure_location: tour.departure_location
      }
    });
  } catch (error) {
    logger.error(`Error creating booking: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.id;
    const bookings = await Booking.findByUserId(user_id);
    
    logger.info(`Retrieved ${bookings.length} bookings for user ${user_id}`);
    
    res.status(200).json({ bookings });
  } catch (error) {
    logger.error(`Error getting user bookings: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the booking belongs to the user
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }
    
    logger.info(`Retrieved booking ${id} for user ${user_id}`);
    
    res.status(200).json({ booking });
  } catch (error) {
    logger.error(`Error getting booking by ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the booking belongs to the user
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    // Check if the booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(400).json({ 
        message: `Cannot cancel booking with status: ${booking.booking_status}` 
      });
    }
    
    // Update booking status to cancelled
    const updatedBooking = await Booking.updateStatus(id, 'cancelled');
    
    logger.info(`User ${user_id} cancelled booking ${id}`);
    
    res.status(200).json({ 
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    logger.error(`Error cancelling booking: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
