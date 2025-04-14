import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

class Checkout {
  static async create(checkoutData) {
    const {
      booking_id,
      payment_method,
      amount,
      payment_status = 'pending',
      transaction_id = null
    } = checkoutData;

    const query = `
      INSERT INTO Checkout (
        booking_id, payment_method, amount, payment_status, transaction_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      booking_id,
      payment_method,
      amount,
      payment_status,
      transaction_id
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`Checkout created: checkoutId=${result.rows[0].checkout_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating checkout: ${error.message}`);
      throw error;
    }
  }

  static async findById(checkoutId) {
    const query = `
      SELECT c.*, b.user_id, b.departure_id, b.total_price as booking_total_price
      FROM Checkout c
      JOIN Booking b ON c.booking_id = b.booking_id
      WHERE c.checkout_id = $1
    `;
    
    try {
      const result = await pool.query(query, [checkoutId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding checkout by ID: ${error.message}`);
      throw error;
    }
  }

  static async findByBookingId(bookingId) {
    const query = `
      SELECT * FROM Checkout
      WHERE booking_id = $1
      ORDER BY payment_date DESC
    `;
    
    try {
      const result = await pool.query(query, [bookingId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding checkout by booking ID: ${error.message}`);
      throw error;
    }
  }

  static async updateStatus(checkoutId, status, transactionId = null) {
    let query;
    let values;
    
    if (transactionId) {
      query = `
        UPDATE Checkout
        SET payment_status = $1, transaction_id = $2
        WHERE checkout_id = $3
        RETURNING *
      `;
      values = [status, transactionId, checkoutId];
    } else {
      query = `
        UPDATE Checkout
        SET payment_status = $1
        WHERE checkout_id = $2
        RETURNING *
      `;
      values = [status, checkoutId];
    }
    
    try {
      const result = await pool.query(query, values);
      logger.info(`Checkout status updated: checkoutId=${checkoutId}, status=${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating checkout status: ${error.message}`);
      throw error;
    }
  }

  static async findByTransactionId(transactionId) {
    const query = `
      SELECT * FROM Checkout
      WHERE transaction_id = $1
    `;
    
    try {
      const result = await pool.query(query, [transactionId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding checkout by transaction ID: ${error.message}`);
      throw error;
    }
  }
}

export default Checkout;
