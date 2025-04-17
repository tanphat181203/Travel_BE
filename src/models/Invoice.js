import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class Invoice {
  static async create(invoiceData) {
    const { booking_id, amount_due, details = '' } = invoiceData;

    const query = `
      INSERT INTO Invoice (
        booking_id, amount_due, details
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [booking_id, amount_due, details];

    try {
      const result = await pool.query(query, values);
      logger.info(`Invoice created: invoiceId=${result.rows[0].invoice_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating invoice: ${error.message}`);
      throw error;
    }
  }

  static async findById(invoiceId) {
    const query = `
      SELECT i.*, b.user_id, b.departure_id, b.num_adults, b.num_children_120_140, b.num_children_100_120,
             d.start_date, d.tour_id, d.price_adult, d.price_child_120_140, d.price_child_100_120,
             t.title as tour_title, t.departure_location, t.seller_id, t.duration,
             u.name as user_name, u.email as user_email, u.phone_number as user_phone, u.address as user_address,
             s.name as seller_name, s.email as seller_email, s.phone_number as seller_phone, s.address as seller_address, s.avatar_url as seller_avatar_url
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      JOIN Users s ON t.seller_id = s.id
      WHERE i.invoice_id = $1
    `;

    try {
      const result = await pool.query(query, [invoiceId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding invoice by ID: ${error.message}`);
      throw error;
    }
  }

  static async findByBookingId(bookingId) {
    const query = `
      SELECT i.*, b.user_id, b.departure_id, b.num_adults, b.num_children_120_140, b.num_children_100_120,
             d.start_date, d.tour_id, d.price_adult, d.price_child_120_140, d.price_child_100_120,
             t.title as tour_title, t.departure_location, t.seller_id, t.duration,
             u.name as user_name, u.email as user_email, u.phone_number as user_phone, u.address as user_address,
             s.name as seller_name, s.email as seller_email, s.phone_number as seller_phone, s.address as seller_address, s.avatar_url as seller_avatar_url
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      JOIN Users s ON t.seller_id = s.id
      WHERE i.booking_id = $1
      ORDER BY i.date_issued DESC
    `;

    try {
      const result = await pool.query(query, [bookingId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding invoice by booking ID: ${error.message}`);
      throw error;
    }
  }

  static async findByUserId(userId, limit, offset) {
    const baseQuery = `
      SELECT i.*, b.booking_status, d.start_date, t.title as tour_title, t.seller_id, t.duration,
             s.name as seller_name, s.avatar_url as seller_avatar_url
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users s ON t.seller_id = s.id
      WHERE b.user_id = $1
      ORDER BY i.date_issued DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1
    `;

    try {
      const countResult = await pool.query(countQuery, [userId]);
      const totalItems = parseInt(countResult.rows[0].count);

      let query = baseQuery;
      if (limit !== undefined && offset !== undefined) {
        query = addPaginationToQuery(query, limit, offset);
      }

      const result = await pool.query(query, [userId]);
      return { invoices: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding invoices by user ID: ${error.message}`);
      throw error;
    }
  }

  static async findBySellerId(sellerId, limit, offset) {
    const baseQuery = `
      SELECT i.*, b.booking_status, b.user_id, d.start_date, t.title as tour_title, t.duration,
             u.name as user_name, u.email as user_email,
             s.name as seller_name, s.avatar_url as seller_avatar_url
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      JOIN Users s ON t.seller_id = s.id
      WHERE t.seller_id = $1
      ORDER BY i.date_issued DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE t.seller_id = $1
    `;

    try {
      const countResult = await pool.query(countQuery, [sellerId]);
      const totalItems = parseInt(countResult.rows[0].count);

      let query = baseQuery;
      if (limit !== undefined && offset !== undefined) {
        query = addPaginationToQuery(query, limit, offset);
      }

      const result = await pool.query(query, [sellerId]);
      return { invoices: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding invoices by seller ID: ${error.message}`);
      throw error;
    }
  }

  static async update(invoiceId, updateData) {
    const allowedFields = ['amount_due', 'details'];

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE Invoice
      SET ${setClause}
      WHERE invoice_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [invoiceId, ...values]);
      logger.info(`Invoice updated: invoiceId=${invoiceId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating invoice: ${error.message}`);
      throw error;
    }
  }

  static async checkOwnership(invoiceId, sellerId) {
    try {
      const query = `
        SELECT i.invoice_id, t.seller_id
        FROM Invoice i
        JOIN Booking b ON i.booking_id = b.booking_id
        JOIN Departure d ON b.departure_id = d.departure_id
        JOIN Tour t ON d.tour_id = t.tour_id
        WHERE i.invoice_id = $1
      `;

      const result = await pool.query(query, [invoiceId]);

      if (result.rows.length === 0) {
        return { success: false, status: 404, message: 'Invoice not found' };
      }

      if (result.rows[0].seller_id !== sellerId) {
        return {
          success: false,
          status: 403,
          message: 'Not authorized to access this invoice',
        };
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error checking invoice ownership: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: 'Server error checking invoice ownership',
      };
    }
  }

  static async checkBookingOwnership(bookingId, sellerId) {
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
  }
}

export default Invoice;
