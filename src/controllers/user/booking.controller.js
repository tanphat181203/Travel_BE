import Booking from '../../models/Booking.js';
import Departure from '../../models/Departure.js';
import Tour from '../../models/Tour.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const createBooking = async (req, res) => {
  try {
    const {
      departure_id,
      num_adults,
      num_children_120_140,
      num_children_100_120,
      special_requests,
      promotion_id,
      contact_info,
      passengers,
      order_notes,
    } = req.body;
    const user_id = req.user.id;

    if (!departure_id || !num_adults) {
      return res
        .status(400)
        .json({ message: 'Departure ID and number of adults are required' });
    }

    if (num_adults < 1) {
      return res
        .status(400)
        .json({ message: 'At least one adult is required' });
    }

    if (!contact_info) {
      return res.status(400).json({
        message: 'Contact information is required',
        field: 'contact_info',
      });
    }

    const { fullname, email, phone, address } = contact_info;
    if (!fullname || !email || !phone || !address) {
      return res.status(400).json({
        message:
          'Contact information must include fullname, email, phone, and address',
        field: 'contact_info',
        missing: [
          !fullname ? 'fullname' : null,
          !email ? 'email' : null,
          !phone ? 'phone' : null,
          !address ? 'address' : null,
        ].filter(Boolean),
      });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        message: 'Passenger information is required and must be an array',
        field: 'passengers',
      });
    }

    const adultPassengers = passengers.filter(
      (p) => p.ticket_type === 'adult'
    ).length;
    const children120140Passengers = passengers.filter(
      (p) => p.ticket_type === 'children_120_140'
    ).length;
    const children100120Passengers = passengers.filter(
      (p) => p.ticket_type === 'children_100_120'
    ).length;

    if (adultPassengers !== num_adults) {
      return res.status(400).json({
        message: `Number of adult passengers (${adultPassengers}) does not match number of adult tickets (${num_adults})`,
        field: 'passengers',
      });
    }

    if (children120140Passengers !== (num_children_120_140 || 0)) {
      return res.status(400).json({
        message: `Number of children 120-140cm passengers (${children120140Passengers}) does not match number of children 120-140cm tickets (${
          num_children_120_140 || 0
        })`,
        field: 'passengers',
      });
    }

    if (children100120Passengers !== (num_children_100_120 || 0)) {
      return res.status(400).json({
        message: `Number of children 100-120cm passengers (${children100120Passengers}) does not match number of children 100-120cm tickets (${
          num_children_100_120 || 0
        })`,
        field: 'passengers',
      });
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const { fullname, gender, birthday, ticket_type } = passenger;

      if (!fullname || !gender || !birthday || !ticket_type) {
        return res.status(400).json({
          message: `Passenger at index ${i} is missing required fields`,
          field: 'passengers',
          index: i,
          missing: [
            !fullname ? 'fullname' : null,
            !gender ? 'gender' : null,
            !birthday ? 'birthday' : null,
            !ticket_type ? 'ticket_type' : null,
          ].filter(Boolean),
        });
      }

      if (
        !['adult', 'children_120_140', 'children_100_120', 'baby'].includes(
          ticket_type
        )
      ) {
        return res.status(400).json({
          message: `Invalid ticket_type for passenger at index ${i}. Must be one of: adult, children_120_140, children_100_120, baby`,
          field: 'passengers',
          index: i,
        });
      }
    }

    const defaultOrderNotes = {
      smoking: false,
      vegetarian: false,
      high_floor: false,
      pregnant: false,
      disabled: false,
      invoice_needed: false,
    };

    const processedOrderNotes = order_notes
      ? {
          ...defaultOrderNotes,
          ...order_notes,
        }
      : defaultOrderNotes;

    const departure = await Departure.findById(departure_id);
    if (!departure) {
      return res.status(404).json({ message: 'Departure not found' });
    }

    if (!departure.availability) {
      return res
        .status(400)
        .json({ message: 'This departure is not available for booking' });
    }

    const tour = await Tour.findById(departure.tour_id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    if (!tour.availability) {
      return res
        .status(400)
        .json({ message: 'This tour is not available for booking' });
    }

    const totalParticipants =
      num_adults + (num_children_120_140 || 0) + (num_children_100_120 || 0);

    const { remainingCapacity, currentParticipants, maxParticipants } =
      await Booking.getRemainingCapacity(departure_id);

    if (totalParticipants > remainingCapacity) {
      return res.status(400).json({
        message: `Booking exceeds remaining capacity. Current bookings: ${currentParticipants}, Maximum capacity: ${maxParticipants}, Your booking: ${totalParticipants}, Remaining: ${remainingCapacity}`,
      });
    }

    const priceDetails = await Booking.calculateTotalPrice(
      departure_id,
      num_adults,
      num_children_120_140 || 0,
      num_children_100_120 || 0,
      promotion_id ? true : false,
      promotion_id
    );

    const bookingData = {
      departure_id,
      user_id,
      num_adults,
      num_children_120_140: num_children_120_140 || 0,
      num_children_100_120: num_children_100_120 || 0,
      total_price: priceDetails.discountedPrice,
      original_price: priceDetails.originalPrice,
      discount: priceDetails.discount,
      promotion_id: priceDetails.appliedPromotion
        ? priceDetails.appliedPromotion.promotion_id
        : null,
      booking_status: 'pending',
      special_requests: special_requests || '',
      contact_info,
      passengers,
      order_notes: processedOrderNotes,
    };

    const booking = await Booking.create(bookingData);

    logger.info(
      `User ${user_id} created booking ${booking.booking_id} for departure ${departure_id}`
    );

    const updatedCapacity = await Booking.getRemainingCapacity(departure_id);

    if (updatedCapacity.remainingCapacity <= 0 && departure.availability) {
      await Departure.update(departure_id, { availability: false });
      logger.info(
        `Departure ${departure_id} automatically marked as unavailable due to reaching maximum capacity`
      );
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        ...booking,
        tour_title: tour.title,
        departure_date: departure.start_date,
        departure_location: tour.departure_location,
      },
    });
  } catch (error) {
    logger.error(`Error creating booking: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { page, limit, offset } = getPaginationParams(req.query);

    const { bookings, totalItems } = await Booking.findByUserId(
      user_id,
      limit,
      offset
    );

    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const isReview = await Booking.hasReview(booking.booking_id);
        return { ...booking, isReview };
      })
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${bookings.length} bookings for user ${user_id} (page ${page})`
    );

    res.status(200).json({
      bookings: bookingsWithReviewStatus,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting user bookings: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserConfirmedBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { page, limit, offset } = getPaginationParams(req.query);

    const { bookings, totalItems } = await Booking.findConfirmedByUserId(
      user_id,
      limit,
      offset
    );
    
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const isReview = await Booking.hasReview(booking.booking_id);
        return { ...booking, isReview };
      })
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${bookings.length} confirmed bookings for user ${user_id} (page ${page})`
    );

    res.status(200).json({
      bookings: bookingsWithReviewStatus,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting user confirmed bookings: ${error.message}`);
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

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this booking' });
    }

    const isReview = await Booking.hasReview(booking.booking_id);

    logger.info(`Retrieved booking ${id} for user ${user_id}`);

    res.status(200).json({ booking: { ...booking, isReview } });
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

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to cancel this booking' });
    }

    if (['completed', 'cancelled'].includes(booking.booking_status)) {
      return res.status(400).json({
        message: `Cannot cancel booking with status: ${booking.booking_status}`,
      });
    }

    const updatedBooking = await Booking.updateStatus(id, 'cancelled');

    logger.info(`User ${user_id} cancelled booking ${id}`);

    const departure = await Departure.findById(booking.departure_id);

    if (!departure.availability) {
      const updatedCapacity = await Booking.getRemainingCapacity(
        booking.departure_id
      );

      if (updatedCapacity.remainingCapacity > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const departureDate = new Date(departure.start_date);

        if (departureDate >= currentDate) {
          await Departure.update(booking.departure_id, { availability: true });
          logger.info(
            `Departure ${booking.departure_id} automatically marked as available again after booking cancellation`
          );
        }
      }
    }

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    logger.error(`Error cancelling booking: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
