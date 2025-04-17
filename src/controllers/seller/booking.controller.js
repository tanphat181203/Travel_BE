import Booking from '../../models/Booking.js';
import Checkout from '../../models/Checkout.js';
import Invoice from '../../models/Invoice.js';
import { pool } from '../../config/db.js';
import logger from '../../utils/logger.js';

const checkBookingOwnership = async (bookingId, sellerId) => {
  try {
    const query = `
      SELECT b.booking_id, t.seller_id
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.booking_id = $1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return { success: false, status: 404, message: 'Booking not found' };
    }

    if (result.rows[0].seller_id !== sellerId) {
      return {
        success: false,
        status: 403,
        message: 'Not authorized to access this booking',
      };
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error checking booking ownership: ${error.message}`);
    return {
      success: false,
      status: 500,
      message: 'Server error checking booking ownership',
    };
  }
};

export const getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.userId;

    const {
      status,
      payment_status,
      tour_id,
      departure_id,
      start_date_from,
      start_date_to,
      booking_date_from,
      booking_date_to,
    } = req.query;

    let query = `
      SELECT
        b.booking_id,
        b.departure_id,
        b.user_id,
        b.num_adults,
        b.num_children_120_140,
        b.num_children_100_120,
        b.total_price,
        b.booking_status,
        b.booking_date,
        d.start_date,
        t.tour_id,
        t.title as tour_title,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        c.payment_method,
        c.payment_status,
        c.checkout_id
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      LEFT JOIN Checkout c ON b.booking_id = c.booking_id AND
                             (c.payment_status = 'pending' OR
                              c.payment_status = 'awaiting_seller_confirmation' OR
                              c.payment_status = 'completed')
      WHERE t.seller_id = $1
    `;

    const queryParams = [sellerId];
    let paramCount = 2;

    if (status) {
      query += ` AND b.booking_status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (payment_status) {
      query += ` AND (c.payment_status = $${paramCount} OR (c.payment_status IS NULL AND $${paramCount} = 'none'))`;
      queryParams.push(payment_status);
      paramCount++;
    }

    if (tour_id) {
      query += ` AND t.tour_id = $${paramCount}`;
      queryParams.push(tour_id);
      paramCount++;
    }

    if (departure_id) {
      query += ` AND d.departure_id = $${paramCount}`;
      queryParams.push(departure_id);
      paramCount++;
    }

    if (start_date_from) {
      query += ` AND d.start_date >= $${paramCount}`;
      queryParams.push(start_date_from);
      paramCount++;
    }

    if (start_date_to) {
      query += ` AND d.start_date <= $${paramCount}`;
      queryParams.push(start_date_to);
      paramCount++;
    }

    if (booking_date_from) {
      query += ` AND b.booking_date >= $${paramCount}`;
      queryParams.push(booking_date_from);
      paramCount++;
    }

    if (booking_date_to) {
      query += ` AND b.booking_date <= $${paramCount}`;
      queryParams.push(booking_date_to);
      paramCount++;
    }

    query += ` ORDER BY b.booking_date DESC`;

    const result = await pool.query(query, queryParams);

    logger.info(
      `Retrieved ${result.rows.length} bookings for seller ${sellerId}`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    logger.error(`Error getting seller bookings: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await checkBookingOwnership(bookingId, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const query = `
      SELECT
        b.*,
        d.start_date,
        d.tour_id,
        t.title as tour_title,
        t.departure_location,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        c.checkout_id,
        c.payment_method,
        c.payment_status,
        c.payment_date as payment_date,
        c.transaction_id,
        i.invoice_id
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      LEFT JOIN Checkout c ON b.booking_id = c.booking_id AND
                             (c.payment_status = 'pending' OR
                              c.payment_status = 'awaiting_seller_confirmation' OR
                              c.payment_status = 'completed')
      LEFT JOIN Invoice i ON b.booking_id = i.booking_id
      WHERE b.booking_id = $1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    logger.info(`Retrieved details for booking ${bookingId}`);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error(`Error getting booking details: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await checkBookingOwnership(bookingId, sellerId);
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
      // If no direct_to_seller checkout exists, create one
      const checkoutData = {
        booking_id: bookingId,
        payment_method: 'direct_to_seller',
        amount: booking.total_price,
        payment_status: 'awaiting_seller_confirmation',
      };

      checkout = await Checkout.create(checkoutData);
    }

    // Update checkout status to completed
    await Checkout.updateStatus(checkout.checkout_id, 'completed');

    // Update booking status to confirmed
    await Booking.updateStatus(bookingId, 'confirmed');

    // Create invoice if it doesn't exist
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
          confirmed_by: sellerId,
        }),
      };

      await Invoice.create(invoiceData);
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

    const invoices = await Invoice.findBySellerId(sellerId);

    logger.info(`Retrieved ${invoices.length} invoices for seller ${sellerId}`);

    res.status(200).json(invoices);
  } catch (error) {
    logger.error(`Error getting seller invoices: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
