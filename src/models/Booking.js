import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

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
      special_requests = '',
      original_price = null,
      discount = null,
      promotion_id = null,
      contact_info = null,
      passengers = null,
      order_notes = {
        smoking: false,
        vegetarian: false,
        high_floor: false,
        pregnant: false,
        disabled: false,
        invoice_needed: false,
      },
    } = bookingData;

    const query = `
      INSERT INTO Booking (
        departure_id, user_id, num_adults, num_children_120_140,
        num_children_100_120, total_price, booking_status, special_requests,
        original_price, discount, promotion_id, contact_info, passengers, order_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
      special_requests,
      original_price,
      discount,
      promotion_id,
      contact_info ? JSON.stringify(contact_info) : null,
      passengers ? JSON.stringify(passengers) : null,
      JSON.stringify(order_notes),
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

  static async findByUserId(userId, limit, offset) {
    const baseQuery = `
      SELECT b.*, d.start_date, d.tour_id, t.title as tour_title, t.departure_location
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM Booking b
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
      return { bookings: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding bookings by user ID: ${error.message}`);
      throw error;
    }
  }

  static async findConfirmedByUserId(userId, limit, offset) {
    const baseQuery = `
      SELECT b.*, d.start_date, d.tour_id, t.title as tour_title, t.departure_location
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1 AND b.booking_status = 'confirmed'
      ORDER BY b.booking_date DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE b.user_id = $1 AND b.booking_status = 'confirmed'
    `;

    try {
      const countResult = await pool.query(countQuery, [userId]);
      const totalItems = parseInt(countResult.rows[0].count);

      let query = baseQuery;
      if (limit !== undefined && offset !== undefined) {
        query = addPaginationToQuery(query, limit, offset);
      }

      const result = await pool.query(query, [userId]);
      return { bookings: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding confirmed bookings by user ID: ${error.message}`);
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
      logger.info(
        `Booking status updated: bookingId=${bookingId}, status=${status}`
      );
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

  static async calculateTotalPrice(
    departureId,
    numAdults,
    numChildren120140,
    numChildren100120,
    applyPromotion = true,
    promotionId = null
  ) {
    const query = `
      SELECT d.price_adult, d.price_child_120_140, d.price_child_100_120, d.tour_id
      FROM Departure d
      WHERE d.departure_id = $1
    `;

    try {
      const result = await pool.query(query, [departureId]);

      if (result.rows.length === 0) {
        throw new Error('Departure not found');
      }

      const { price_adult, price_child_120_140, price_child_100_120, tour_id } =
        result.rows[0];

      const basePrice =
        numAdults * price_adult +
        numChildren120140 * price_child_120_140 +
        numChildren100120 * price_child_100_120;

      if (!applyPromotion || !promotionId) {
        return {
          originalPrice: parseFloat(basePrice.toFixed(2)),
          discountedPrice: parseFloat(basePrice.toFixed(2)),
          discount: 0,
          appliedPromotion: null,
        };
      }

      const { default: Promotion } = await import('./Promotion.js');

      const priceDetails = await Promotion.calculateDiscount(
        tour_id,
        basePrice,
        promotionId
      );

      const originalPrice = parseFloat(priceDetails.originalPrice);
      const discountedPrice = parseFloat(priceDetails.discountedPrice);
      const discount = parseFloat(priceDetails.discount || 0);

      return {
        originalPrice: parseFloat(originalPrice.toFixed(2)),
        discountedPrice: parseFloat(discountedPrice.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        appliedPromotion: priceDetails.appliedPromotion,
      };
    } catch (error) {
      logger.error(`Error calculating total price: ${error.message}`);
      throw error;
    }
  }

  static async checkOwnership(bookingId, sellerId) {
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

  static async findBySellerId(sellerId, filters = {}, limit, offset) {
    const {
      status,
      payment_status,
      tour_id,
      departure_id,
      start_date_from,
      start_date_to,
      booking_date_from,
      booking_date_to,
    } = filters;

    let baseQuery = `
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
        b.contact_info,
        b.passengers,
        b.order_notes,
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

    let countQuery = `
      SELECT COUNT(*)
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
      const condition = ` AND b.booking_status = $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(status);
      paramCount++;
    }

    if (payment_status) {
      const condition = ` AND (c.payment_status = $${paramCount} OR (c.payment_status IS NULL AND $${paramCount} = 'none'))`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(payment_status);
      paramCount++;
    }

    if (tour_id) {
      const condition = ` AND t.tour_id = $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(tour_id);
      paramCount++;
    }

    if (departure_id) {
      const condition = ` AND d.departure_id = $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(departure_id);
      paramCount++;
    }

    if (start_date_from) {
      const condition = ` AND d.start_date >= $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(start_date_from);
      paramCount++;
    }

    if (start_date_to) {
      const condition = ` AND d.start_date <= $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(start_date_to);
      paramCount++;
    }

    if (booking_date_from) {
      const condition = ` AND b.booking_date >= $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(booking_date_from);
      paramCount++;
    }

    if (booking_date_to) {
      const condition = ` AND b.booking_date <= $${paramCount}`;
      baseQuery += condition;
      countQuery += condition;
      queryParams.push(booking_date_to);
      paramCount++;
    }

    baseQuery += ` ORDER BY b.booking_date DESC`;

    try {
      const countResult = await pool.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      const query = addPaginationToQuery(baseQuery, limit, offset);
      const result = await pool.query(query, queryParams);

      return { bookings: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding bookings by seller ID: ${error.message}`);
      throw error;
    }
  }

  static async findDetailedById(bookingId) {
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

    try {
      const result = await pool.query(query, [bookingId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding detailed booking by ID: ${error.message}`);
      throw error;
    }
  }
  static async getCurrentParticipantsCount(departureId) {
    const query = `
      SELECT
        SUM(num_adults + num_children_120_140 + num_children_100_120) as total_participants
      FROM Booking
      WHERE departure_id = $1
      AND booking_status NOT IN ('cancelled')
    `;

    try {
      const result = await pool.query(query, [departureId]);
      const totalParticipants =
        parseInt(result.rows[0].total_participants) || 0;
      logger.info(
        `Current participants count for departure ${departureId}: ${totalParticipants}`
      );
      return totalParticipants;
    } catch (error) {
      logger.error(
        `Error calculating current participants count: ${error.message}`
      );
      throw error;
    }
  }

  static async hasUserBookedTour(userId, tourId) {
    const query = `
      SELECT COUNT(*)
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      WHERE b.user_id = $1
      AND d.tour_id = $2
      AND b.booking_status = 'confirmed'
    `;

    try {
      const result = await pool.query(query, [userId, tourId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error(`Error checking if user has booked tour: ${error.message}`);
      throw error;
    }
  }

  static async getRemainingCapacity(departureId) {
    try {
      const tourQuery = `
        SELECT t.max_participants
        FROM Tour t
        JOIN Departure d ON t.tour_id = d.tour_id
        WHERE d.departure_id = $1
      `;

      const tourResult = await pool.query(tourQuery, [departureId]);

      if (tourResult.rows.length === 0) {
        throw new Error('Tour not found for this departure');
      }

      const maxParticipants = tourResult.rows[0].max_participants;
      const currentParticipants = await this.getCurrentParticipantsCount(
        departureId
      );

      const remainingCapacity = maxParticipants - currentParticipants;
      logger.info(
        `Remaining capacity for departure ${departureId}: ${remainingCapacity}`
      );

      return {
        maxParticipants,
        currentParticipants,
        remainingCapacity,
      };
    } catch (error) {
      logger.error(`Error calculating remaining capacity: ${error.message}`);
      throw error;
    }
  }

  static async getStatsBySellerId(sellerId) {
    try {
      const client = await pool.connect();

      try {
        const bookingStatsQuery = `
          SELECT
            COUNT(*) as total_bookings,
            COUNT(*) FILTER (WHERE b.booking_status = 'pending') as pending_bookings,
            COUNT(*) FILTER (WHERE b.booking_status = 'confirmed') as confirmed_bookings,
            COUNT(*) FILTER (WHERE b.booking_status = 'cancelled') as cancelled_bookings,
            SUM(b.total_price) FILTER (WHERE b.booking_status = 'confirmed') as total_revenue
          FROM Booking b
          JOIN Departure d ON b.departure_id = d.departure_id
          JOIN Tour t ON d.tour_id = t.tour_id
          WHERE t.seller_id = $1
        `;
        const bookingStatsResult = await client.query(bookingStatsQuery, [
          sellerId,
        ]);

        const recentStatsQuery = `
          SELECT
            COUNT(*) as recent_bookings,
            SUM(b.total_price) as recent_revenue
          FROM Booking b
          JOIN Departure d ON b.departure_id = d.departure_id
          JOIN Tour t ON d.tour_id = t.tour_id
          WHERE t.seller_id = $1
          AND b.booking_date >= NOW() - INTERVAL '30 days'
        `;
        const recentStatsResult = await client.query(recentStatsQuery, [
          sellerId,
        ]);

        return {
          total_bookings:
            parseInt(bookingStatsResult.rows[0].total_bookings) || 0,
          pending_bookings:
            parseInt(bookingStatsResult.rows[0].pending_bookings) || 0,
          confirmed_bookings:
            parseInt(bookingStatsResult.rows[0].confirmed_bookings) || 0,
          cancelled_bookings:
            parseInt(bookingStatsResult.rows[0].cancelled_bookings) || 0,
          total_revenue:
            parseFloat(bookingStatsResult.rows[0].total_revenue) || 0,
          recent_bookings:
            parseInt(recentStatsResult.rows[0].recent_bookings) || 0,
          recent_revenue:
            parseFloat(recentStatsResult.rows[0].recent_revenue) || 0,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(
        `Error getting booking stats for seller ${sellerId}:`,
        error
      );
      throw error;
    }
  }

  static async getRecentBySellerId(sellerId, limit = 5) {
    const query = `
      SELECT b.*, d.start_date, t.title as tour_title, u.name as user_name
      FROM Booking b
      JOIN Departure d ON b.departure_id = d.departure_id
      JOIN Tour t ON d.tour_id = t.tour_id
      JOIN Users u ON b.user_id = u.id
      WHERE t.seller_id = $1
      ORDER BY b.booking_date DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [sellerId, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting recent bookings by seller ID: ${error.message}`);
      throw error;
    }
  }

  static async hasReview(bookingId) {
    const query = `
      SELECT COUNT(*) as count
      FROM Review
      WHERE booking_id = $1
    `;

    try {
      const result = await pool.query(query, [bookingId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error(`Error checking if booking has review: ${error.message}`);
      throw error;
    }
  }
}

export default Booking;
