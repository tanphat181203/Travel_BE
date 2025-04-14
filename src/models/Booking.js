import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

class Booking {
  static async create(bookingData) {
    const {
      departure_id,
      user_id,
      num_adults,
      num_children_120_140,
      num_children_100_120,
      total_price,
      booking_status = 'pending',
      special_requests = ''
    } = bookingData;

    const query = `
      INSERT INTO Booking (
        departure_id, user_id, num_adults, num_children_120_140,
        num_children_100_120, total_price, booking_status, special_requests
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      departure_id,
      user_id,
      num_adults,
      num_children_120_140,
      num_children_100_120,
      total_price,
      booking_status,
      special_requests
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`Booking created: bookingId=${result.rows[0].booking_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating booking: ${error.message}`);
      throw error;
    }
  }

  static async findById(bookingId) {
    const query = `
      SELECT b.*, d.start_date, d.tour_id, t.title as tour_title, t.departure_location
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.booking_id = $1
    `;
    
    try {
      const result = await pool.query(query, [bookingId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding booking by ID: ${error.message}`);
      throw error;
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT b.*, d.start_date, d.tour_id, t.title as tour_title, t.departure_location
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding bookings by user ID: ${error.message}`);
      throw error;
    }
  }

  static async updateStatus(bookingId, status) {
    const query = `
      UPDATE Booking
      SET booking_status = $1
      WHERE booking_id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [status, bookingId]);
      logger.info(`Booking status updated: bookingId=${bookingId}, status=${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating booking status: ${error.message}`);
      throw error;
    }
  }

  static async delete(bookingId) {
    // Check if there's a checkout record for this booking
    const checkoutQuery = 'SELECT COUNT(*) FROM Checkout WHERE booking_id = $1';
    const checkoutResult = await pool.query(checkoutQuery, [bookingId]);
    const checkoutCount = parseInt(checkoutResult.rows[0].count);
    
    if (checkoutCount > 0) {
      throw new Error('Cannot delete booking with existing checkout records');
    }
    
    // Check if there's an invoice record for this booking
    const invoiceQuery = 'SELECT COUNT(*) FROM Invoice WHERE booking_id = $1';
    const invoiceResult = await pool.query(invoiceQuery, [bookingId]);
    const invoiceCount = parseInt(invoiceResult.rows[0].count);
    
    if (invoiceCount > 0) {
      throw new Error('Cannot delete booking with existing invoice records');
    }
    
    const query = 'DELETE FROM Booking WHERE booking_id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [bookingId]);
      logger.info(`Booking deleted: bookingId=${bookingId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting booking: ${error.message}`);
      throw error;
    }
  }

  static async calculateTotalPrice(departureId, numAdults, numChildren120140, numChildren100120) {
    const query = `
      SELECT price_adult, price_child_120_140, price_child_100_120
      FROM Departure
      WHERE departure_id = $1
    `;
    
    try {
      const result = await pool.query(query, [departureId]);
      
      if (result.rows.length === 0) {
        throw new Error('Departure not found');
      }
      
      const { price_adult, price_child_120_140, price_child_100_120 } = result.rows[0];
      
      const totalPrice = 
        (numAdults * price_adult) + 
        (numChildren120140 * price_child_120_140) + 
        (numChildren100120 * price_child_100_120);
      
      return parseFloat(totalPrice.toFixed(2));
    } catch (error) {
      logger.error(`Error calculating total price: ${error.message}`);
      throw error;
    }
  }
}

export default Booking;
