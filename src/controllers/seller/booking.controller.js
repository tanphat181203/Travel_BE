import Booking from '../../models/Booking.js';
import Checkout from '../../models/Checkout.js';
import Invoice from '../../models/Invoice.js';
import { trackTourBooking } from '../../services/history.service.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.userId;

    const { page, limit, offset } = getPaginationParams(req.query);

    const filters = {
      status: req.query.status,
      payment_status: req.query.payment_status,
      tour_id: req.query.tour_id,
      departure_id: req.query.departure_id,
      start_date_from: req.query.start_date_from,
      start_date_to: req.query.start_date_to,
      booking_date_from: req.query.booking_date_from,
      booking_date_to: req.query.booking_date_to,
    };

    const { bookings, totalItems } = await Booking.findBySellerId(
      sellerId,
      filters,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${bookings.length} bookings for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      bookings,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting seller bookings: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Booking.checkOwnership(bookingId, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const booking = await Booking.findDetailedById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    logger.info(`Retrieved details for booking ${bookingId}`);

    res.status(200).json(booking);
  } catch (error) {
    logger.error(`Error getting booking details: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Booking.checkOwnership(bookingId, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.booking_status !== 'pending') {
      return res.status(400).json({
        message: `Cannot confirm payment for booking with status: ${booking.booking_status}`,
      });
    }

    const checkouts = await Checkout.findByBookingId(bookingId);
    let checkout = checkouts.find(
      (c) =>
        c.payment_method === 'direct_to_seller' &&
        c.payment_status === 'awaiting_seller_confirmation'
    );

    if (!checkout) {
      const checkoutData = {
        booking_id: bookingId,
        payment_method: 'direct_to_seller',
        amount: booking.total_price,
        payment_status: 'awaiting_seller_confirmation',
      };

      checkout = await Checkout.create(checkoutData);
    }

    await Checkout.updateStatus(checkout.checkout_id, 'completed');

    await Booking.updateStatus(bookingId, 'confirmed');

    const existingInvoice = await Invoice.findByBookingId(bookingId);

    if (!existingInvoice) {
      const invoiceData = {
        booking_id: bookingId,
        amount_due: checkout.amount,
        details: JSON.stringify({
          payment_method: 'direct_to_seller',
          payment_date: new Date().toISOString(),
          tour_title: booking.tour_title,
          departure_date: booking.start_date,
          num_adults: booking.num_adults,
          num_children_120_140: booking.num_children_120_140,
          num_children_100_120: booking.num_children_100_120,
          original_price: booking.original_price,
          discount: booking.discount,
          promotion_id: booking.promotion_id,
          confirmed_by: sellerId,
          contact_info: booking.contact_info,
          passengers: booking.passengers,
          order_notes: booking.order_notes,
        }),
      };

      await Invoice.create(invoiceData);
    }

    if (booking.user_id && booking.tour_id) {
      trackTourBooking(booking.user_id, booking.tour_id).catch(error => {
        logger.error(`Error tracking tour booking: ${error.message}`);
      });
    }

    logger.info(
      `Seller ${sellerId} confirmed payment for booking ${bookingId}`
    );

    res.status(200).json({
      message: 'Payment confirmed successfully',
      booking_id: bookingId,
      booking_status: 'confirmed',
      payment_status: 'completed',
    });
  } catch (error) {
    logger.error(`Error confirming payment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSellerInvoices = async (req, res) => {
  try {
    const sellerId = req.userId;

    const { page, limit, offset } = getPaginationParams(req.query);

    const { invoices, totalItems } = await Invoice.findBySellerId(
      sellerId,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${invoices.length} invoices for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      invoices,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting seller invoices: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
