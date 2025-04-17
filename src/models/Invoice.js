import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

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
             d.start_date, d.tour_id, t.title as tour_title, t.departure_location,
             u.name as user_name, u.email as user_email
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
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
      SELECT * FROM Invoice
      WHERE booking_id = $1
      ORDER BY date_issued DESC
    `;

    try {
      const result = await pool.query(query, [bookingId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding invoice by booking ID: ${error.message}`);
      throw error;
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT i.*, b.booking_status, d.start_date, t.title as tour_title
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1
      ORDER BY i.date_issued DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding invoices by user ID: ${error.message}`);
      throw error;
    }
  }

  static async findBySellerId(sellerId) {
    const query = `
      SELECT i.*, b.booking_status, b.user_id, d.start_date, t.title as tour_title, u.name as user_name, u.email as user_email
      FROM Invoice i
      JOIN Booking b ON i.booking_id = b.booking_id
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      WHERE t.seller_id = $1
      ORDER BY i.date_issued DESC
    `;

    try {
      const result = await pool.query(query, [sellerId]);
      return result.rows;
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
}

export default Invoice;
