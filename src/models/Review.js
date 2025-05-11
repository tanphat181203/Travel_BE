import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class Review {
  static async create(reviewData) {
    const {
      tour_id,
      user_id,
      booking_id,
      departure_id,
      ratings,
      comment = '',
    } = reviewData;

    const query = `
      INSERT INTO Review (
        tour_id, user_id, booking_id, departure_id, ratings, comment
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING *
    `;

    const values = [
      tour_id,
      user_id,
      booking_id,
      departure_id,
      JSON.stringify(ratings),
      comment,
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`Review created: reviewId=${result.rows[0].review_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating review: ${error.message}`);
      throw error;
    }
  }

  static async findById(reviewId) {
    const query = `
      SELECT r.*, u.name as user_name, u.avatar_url as user_avatar,
             t.title as tour_title, d.start_date as departure_date
      FROM Review r
      JOIN Users u ON r.user_id = u.id
      JOIN Tour t ON r.tour_id = t.tour_id
      JOIN Departure d ON r.departure_id = d.departure_id
      WHERE r.review_id = $1
    `;

    try {
      const result = await pool.query(query, [reviewId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error finding review by ID: ${error.message}`);
      throw error;
    }
  }

  static async findByTourId(tourId, limit, offset) {
    const countQuery = 'SELECT COUNT(*) FROM Review WHERE tour_id = $1';
    const countResult = await pool.query(countQuery, [tourId]);
    const totalItems = parseInt(countResult.rows[0].count);

    let query = `
      SELECT r.*, u.name as user_name, u.avatar_url as user_avatar,
             d.start_date as departure_date
      FROM Review r
      JOIN Users u ON r.user_id = u.id
      JOIN Departure d ON r.departure_id = d.departure_id
      WHERE r.tour_id = $1
      ORDER BY r.timestamp DESC
    `;

    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    try {
      const result = await pool.query(query, [tourId]);
      return { reviews: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding reviews by tour ID: ${error.message}`);
      throw error;
    }
  }

  static async findByUserId(userId, limit, offset) {
    const countQuery = 'SELECT COUNT(*) FROM Review WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [userId]);
    const totalItems = parseInt(countResult.rows[0].count);

    let query = `
      SELECT r.*, t.title as tour_title, d.start_date as departure_date
      FROM Review r
      JOIN Tour t ON r.tour_id = t.tour_id
      JOIN Departure d ON r.departure_id = d.departure_id
      WHERE r.user_id = $1
      ORDER BY r.timestamp DESC
    `;

    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    try {
      const result = await pool.query(query, [userId]);
      return { reviews: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding reviews by user ID: ${error.message}`);
      throw error;
    }
  }

  static async update(reviewId, updateData) {
    const allowedFields = ['ratings', 'comment'];

    if (updateData.ratings) {
      updateData.ratings = JSON.stringify(updateData.ratings);
    }

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => {
        if (key === 'ratings') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE Review
      SET ${setClause}
      WHERE review_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [reviewId, ...values]);
      logger.info(`Review updated: reviewId=${reviewId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating review: ${error.message}`);
      throw error;
    }
  }

  static async delete(reviewId) {
    const query = 'DELETE FROM Review WHERE review_id = $1 RETURNING *';

    try {
      const result = await pool.query(query, [reviewId]);
      logger.info(`Review deleted: reviewId=${reviewId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting review: ${error.message}`);
      throw error;
    }
  }

  static async checkOwnership(reviewId, userId) {
    try {
      const query = `
        SELECT review_id, user_id
        FROM Review
        WHERE review_id = $1
      `;

      const result = await pool.query(query, [reviewId]);

      if (result.rows.length === 0) {
        return { success: false, status: 404, message: 'Review not found' };
      }

      if (result.rows[0].user_id !== userId) {
        return {
          success: false,
          status: 403,
          message: 'Not authorized to access this review',
        };
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error checking review ownership: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: 'Server error checking review ownership',
      };
    }
  }

  static async checkTourOwnership(reviewId, sellerId) {
    try {
      const query = `
        SELECT r.review_id, t.seller_id
        FROM Review r
        JOIN Tour t ON r.tour_id = t.tour_id
        WHERE r.review_id = $1
      `;

      const result = await pool.query(query, [reviewId]);

      if (result.rows.length === 0) {
        return { success: false, status: 404, message: 'Review not found' };
      }

      if (result.rows[0].seller_id !== sellerId) {
        return {
          success: false,
          status: 403,
          message: 'Not authorized to access this review',
        };
      }

      return { success: true };
    } catch (error) {
      logger.error(
        `Error checking tour ownership for review: ${error.message}`
      );
      return {
        success: false,
        status: 500,
        message: 'Server error checking tour ownership',
      };
    }
  }

  static async getTourAverageRating(tourId) {
    const query = `
      SELECT
        AVG(average_rating) as overall_rating,
        AVG((ratings->>'Services')::INTEGER) as services_rating,
        AVG((ratings->>'Quality')::INTEGER) as quality_rating,
        AVG((ratings->>'Guides')::INTEGER) as guides_rating,
        AVG((ratings->>'Safety')::INTEGER) as safety_rating,
        AVG((ratings->>'Foods')::INTEGER) as foods_rating,
        AVG((ratings->>'Hotels')::INTEGER) as hotels_rating,
        COUNT(*) as review_count
      FROM Review
      WHERE tour_id = $1
    `;

    try {
      const result = await pool.query(query, [tourId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error getting tour average rating: ${error.message}`);
      throw error;
    }
  }

  static async findBySellerTours(tourIds, limit, offset) {
    try {
      const countQuery = `
        SELECT COUNT(*)
        FROM Review
        WHERE tour_id = ANY($1::int[])
      `;
      const countResult = await pool.query(countQuery, [tourIds]);
      const totalItems = parseInt(countResult.rows[0].count);

      let query = `
        SELECT r.*, u.name as user_name, u.avatar_url as user_avatar,
               t.title as tour_title, d.start_date as departure_date
        FROM Review r
        JOIN Users u ON r.user_id = u.id
        JOIN Tour t ON r.tour_id = t.tour_id
        JOIN Departure d ON r.departure_id = d.departure_id
        WHERE r.tour_id = ANY($1::int[])
        ORDER BY r.timestamp DESC
      `;

      if (limit !== undefined && offset !== undefined) {
        query = addPaginationToQuery(query, limit, offset);
      }

      const result = await pool.query(query, [tourIds]);
      return { reviews: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error finding reviews by seller tours: ${error.message}`);
      throw error;
    }
  }

  static async canUserReviewDeparture(userId, departureId) {
    try {
      // Check if the user has booked this specific departure
      const bookingQuery = `
        SELECT b.booking_id, d.start_date, CURRENT_DATE as today
        FROM Booking b
        JOIN Departure d ON b.departure_id = d.departure_id
        WHERE b.user_id = $1
        AND b.departure_id = $2
        AND b.booking_status = 'confirmed'
      `;

      const bookingResult = await pool.query(bookingQuery, [
        userId,
        departureId,
      ]);

      if (bookingResult.rows.length === 0) {
        return {
          canReview: false,
          message: 'You must book this tour departure before leaving a review',
          code: 'BOOKING_REQUIRED',
        };
      }

      // Check if the departure date has passed
      const booking = bookingResult.rows[0];
      const startDate = new Date(booking.start_date);
      const today = new Date(booking.today);

      if (startDate > today) {
        return {
          canReview: false,
          message: 'You can only review a tour after its departure date',
          code: 'BEFORE_DEPARTURE_DATE',
        };
      }

      // Check if the user has already reviewed this booking
      const reviewQuery = `
        SELECT review_id
        FROM Review
        WHERE user_id = $1
        AND booking_id = $2
      `;

      const reviewResult = await pool.query(reviewQuery, [
        userId,
        booking.booking_id,
      ]);

      if (reviewResult.rows.length > 0) {
        return {
          canReview: false,
          message: 'You have already reviewed this booking',
          code: 'ALREADY_REVIEWED',
        };
      }

      return {
        canReview: true,
        bookingId: booking.booking_id,
      };
    } catch (error) {
      logger.error(
        `Error checking if user can review departure: ${error.message}`
      );
      throw error;
    }
  }

  static async findLatestDepartureForUserAndTour(userId, tourId) {
    try {
      const query = `
        SELECT b.booking_id, b.departure_id, d.start_date, CURRENT_DATE as today
        FROM Booking b
        JOIN Departure d ON b.departure_id = d.departure_id
        WHERE b.user_id = $1
        AND d.tour_id = $2
        AND b.booking_status = 'confirmed'
        AND d.start_date <= CURRENT_DATE
        ORDER BY d.start_date DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId, tourId]);
      
      if (result.rows.length === 0) {
        return { 
          found: false, 
          message: 'No eligible bookings found for this tour',
          code: 'NO_ELIGIBLE_BOOKINGS'
        };
      }
      
      const booking = result.rows[0];
      const reviewQuery = `
        SELECT review_id
        FROM Review
        WHERE user_id = $1
        AND booking_id = $2
      `;

      const reviewResult = await pool.query(reviewQuery, [
        userId,
        booking.booking_id,
      ]);

      if (reviewResult.rows.length > 0) {
        return {
          found: false,
          message: 'You have already reviewed this booking',
          code: 'ALREADY_REVIEWED',
        };
      }

      return {
        found: true,
        departureId: booking.departure_id,
        bookingId: booking.booking_id
      };
    } catch (error) {
      logger.error(
        `Error finding latest departure for user and tour: ${error.message}`
      );
      throw error;
    }
  }
}

export default Review;
