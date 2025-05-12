import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class Promotion {
  static async create(promotionData) {
    const {
      seller_id,
      name,
      description,
      type = 'percent',
      discount,
      start_date,
      end_date,
      status = 'active',
    } = promotionData;

    const query = `
      INSERT INTO Promotion (
        seller_id, name, description, type, discount, start_date, end_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      seller_id,
      name,
      description,
      type,
      discount,
      start_date,
      end_date,
      status,
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(
        `Promotion created: promotionId=${result.rows[0].promotion_id}`
      );
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating promotion: ${error.message}`);
      throw error;
    }
  }

  static async findById(promotionId) {
    const query = `
      SELECT * FROM Promotion
      WHERE promotion_id = $1
    `;

    try {
      const result = await pool.query(query, [promotionId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding promotion by ID: ${error.message}`);
      throw error;
    }
  }

  static async findAll(params = {}, limit = 10, offset = 0) {
    try {
      let query = `
        SELECT * FROM Promotion
        WHERE 1=1
      `;

      const values = [];
      let valueIndex = 1;

      if (params.seller_id) {
        query += ` AND seller_id = $${valueIndex}`;
        values.push(params.seller_id);
        valueIndex++;
      }

      if (params.status) {
        query += ` AND status = $${valueIndex}`;
        values.push(params.status);
        valueIndex++;
      }

      if (params.current_date) {
        query += ` AND start_date <= $${valueIndex} AND end_date >= $${valueIndex}`;
        values.push(params.current_date);
        valueIndex++;
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, values);
      const totalItems = parseInt(countResult.rows[0].count);

      query += ` ORDER BY start_date ASC`;

      query = addPaginationToQuery(query, limit, offset);

      const result = await pool.query(query, values);

      return {
        promotions: result.rows,
        totalItems,
      };
    } catch (error) {
      logger.error(`Error finding promotions: ${error.message}`);
      throw error;
    }
  }

  static async update(promotionId, updateData) {
    const allowedFields = [
      'name',
      'description',
      'type',
      'discount',
      'start_date',
      'end_date',
      'status',
    ];

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE Promotion
      SET ${setClause}
      WHERE promotion_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [promotionId, ...values]);
      logger.info(`Promotion updated: promotionId=${promotionId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating promotion: ${error.message}`);
      throw error;
    }
  }

  static async delete(promotionId) {
    try {
      const query = 'DELETE FROM Promotion WHERE promotion_id = $1 RETURNING *';
      const result = await pool.query(query, [promotionId]);

      logger.info(`Promotion deleted: promotionId=${promotionId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting promotion: ${error.message}`);
      throw error;
    }
  }

  static async findByTourId(tourId) {
    const query = `
      SELECT p.*
      FROM Promotion p
      JOIN Tour_Promotion tp ON p.promotion_id = tp.promotion_id
      WHERE tp.tour_id = $1
      ORDER BY p.start_date ASC
    `;

    try {
      const result = await pool.query(query, [tourId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding promotions by tour ID: ${error.message}`);
      throw error;
    }
  }

  static async findActiveBySellerId(sellerId, currentDate = new Date()) {
    const query = `
      SELECT * FROM Promotion
      WHERE seller_id = $1
      AND status = 'active'
      AND start_date <= $2
      AND end_date >= $2
      ORDER BY start_date ASC
    `;

    try {
      const result = await pool.query(query, [sellerId, currentDate]);
      return result.rows;
    } catch (error) {
      logger.error(
        `Error finding active promotions by seller ID: ${error.message}`
      );
      throw error;
    }
  }

  static async checkOwnership(promotionId, sellerId) {
    try {
      const query = `
        SELECT promotion_id, seller_id
        FROM Promotion
        WHERE promotion_id = $1
      `;

      const result = await pool.query(query, [promotionId]);

      if (result.rows.length === 0) {
        return { success: false, status: 404, message: 'Promotion not found' };
      }

      if (result.rows[0].seller_id !== sellerId) {
        return {
          success: false,
          status: 403,
          message: 'Not authorized to access this promotion',
        };
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error checking promotion ownership: ${error.message}`);
      return {
        success: false,
        status: 500,
        message: 'Server error checking promotion ownership',
      };
    }
  }

  static async applyToTour(promotionId, tourId) {
    const checkQuery = `
      SELECT COUNT(*) FROM Tour_Promotion
      WHERE tour_id = $1 AND promotion_id = $2
    `;

    const checkResult = await pool.query(checkQuery, [tourId, promotionId]);
    const exists = parseInt(checkResult.rows[0].count) > 0;

    if (exists) {
      return {
        success: true,
        message: 'Promotion already applied to this tour',
      };
    }

    const query = `
      INSERT INTO Tour_Promotion (tour_id, promotion_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [tourId, promotionId]);
      logger.info(`Promotion ${promotionId} applied to tour ${tourId}`);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error(`Error applying promotion to tour: ${error.message}`);
      throw error;
    }
  }

  static async removeFromTour(promotionId, tourId) {
    const query = `
      DELETE FROM Tour_Promotion
      WHERE tour_id = $1 AND promotion_id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [tourId, promotionId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Promotion not applied to this tour',
        };
      }

      logger.info(`Promotion ${promotionId} removed from tour ${tourId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error removing promotion from tour: ${error.message}`);
      throw error;
    }
  }

  static async getActivePromotionsForTour(tourId, currentDate = new Date()) {
    const query = `
      SELECT p.*
      FROM Promotion p
      JOIN Tour_Promotion tp ON p.promotion_id = tp.promotion_id
      WHERE tp.tour_id = $1
      AND p.status = 'active'
      AND p.start_date <= $2
      AND p.end_date >= $2
      ORDER BY p.discount DESC
    `;

    try {
      const result = await pool.query(query, [tourId, currentDate]);
      return result.rows;
    } catch (error) {
      logger.error(
        `Error finding active promotions for tour: ${error.message}`
      );
      throw error;
    }
  }

  static async calculateDiscount(tourId, price, promotionId = null) {
    try {
      const currentDate = new Date();
      let appliedPromotion = null;

      if (promotionId) {
        const query = `
          SELECT p.*
          FROM Promotion p
          JOIN Tour_Promotion tp ON p.promotion_id = tp.promotion_id
          WHERE tp.tour_id = $1
          AND p.promotion_id = $2
          AND p.status = 'active'
          AND p.start_date <= $3
          AND p.end_date >= $3
        `;

        const result = await pool.query(query, [
          tourId,
          promotionId,
          currentDate,
        ]);

        if (result.rows.length > 0) {
          appliedPromotion = result.rows[0];
        }
      }

      if (!appliedPromotion) {
        return {
          originalPrice: price,
          discountedPrice: price,
          discount: 0,
          appliedPromotion: null,
        };
      }

      let discountAmount = 0;

      if (appliedPromotion.type === 'percent') {
        discountAmount = (price * parseFloat(appliedPromotion.discount)) / 100;
      } else if (appliedPromotion.type === 'fixed') {
        discountAmount = parseFloat(appliedPromotion.discount);
      }

      const discountedPrice = price - discountAmount;

      return {
        originalPrice: price,
        discountedPrice: Math.max(0, discountedPrice),
        discount: discountAmount,
        appliedPromotion: appliedPromotion,
      };
    } catch (error) {
      logger.error(`Error calculating discount: ${error.message}`);
      throw error;
    }
  }

  static async isPromotionInUse(promotionId) {
    try {
      const tourPromotionQuery = `
        SELECT COUNT(*) FROM Tour_Promotion
        WHERE promotion_id = $1
      `;
      const tourPromotionResult = await pool.query(tourPromotionQuery, [
        promotionId,
      ]);
      const tourPromotionCount = parseInt(tourPromotionResult.rows[0].count);

      if (tourPromotionCount > 0) {
        return { inUse: true, reason: 'promotion_applied_to_tour' };
      }

      const bookingQuery = `
        SELECT COUNT(*) FROM Booking
        WHERE promotion_id = $1
        AND booking_status NOT IN ('cancelled')
      `;
      const bookingResult = await pool.query(bookingQuery, [promotionId]);
      const bookingCount = parseInt(bookingResult.rows[0].count);

      if (bookingCount > 0) {
        return { inUse: true, reason: 'promotion_used_in_booking' };
      }

      return { inUse: false };
    } catch (error) {
      logger.error(`Error checking if promotion is in use: ${error.message}`);
      throw error;
    }
  }

  static async applyToMultipleTours(promotionId, tourIds) {
    try {
      const checkQuery = `
        SELECT tour_id FROM Tour_Promotion
        WHERE promotion_id = $1 AND tour_id = ANY($2::int[])
      `;

      const checkResult = await pool.query(checkQuery, [promotionId, tourIds]);
      const existingTourIds = checkResult.rows.map((row) => row.tour_id);

      const newTourIds = tourIds.filter(
        (id) => !existingTourIds.includes(parseInt(id))
      );

      if (newTourIds.length === 0) {
        return {
          success: true,
          message: 'No new tours to apply promotion to',
          appliedCount: 0,
          alreadyAppliedCount: existingTourIds.length,
        };
      }

      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      newTourIds.forEach((tourId) => {
        values.push(tourId, promotionId);
        placeholders.push(`($${paramIndex}, $${paramIndex + 1})`);
        paramIndex += 2;
      });

      const insertQuery = `
        INSERT INTO Tour_Promotion (tour_id, promotion_id)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await pool.query(insertQuery, values);

      logger.info(
        `Promotion ${promotionId} applied to ${result.rowCount} tours`
      );
      return {
        success: true,
        message: `Promotion applied to ${result.rowCount} tours successfully`,
        appliedCount: result.rowCount,
        alreadyAppliedCount: existingTourIds.length,
      };
    } catch (error) {
      logger.error(
        `Error applying promotion to multiple tours: ${error.message}`
      );
      throw error;
    }
  }

  static async removeFromMultipleTours(promotionId, tourIds) {
    try {
      const checkQuery = `
        SELECT tour_id FROM Tour_Promotion
        WHERE promotion_id = $1 AND tour_id = ANY($2::int[])
      `;

      const checkResult = await pool.query(checkQuery, [promotionId, tourIds]);
      const existingTourIds = checkResult.rows.map((row) => row.tour_id);

      if (existingTourIds.length === 0) {
        return {
          success: true,
          message: 'Promotion not applied to any of the specified tours',
          removedCount: 0,
          notAppliedCount: tourIds.length,
        };
      }

      const deleteQuery = `
        DELETE FROM Tour_Promotion
        WHERE promotion_id = $1 AND tour_id = ANY($2::int[])
        RETURNING tour_id
      `;

      const result = await pool.query(deleteQuery, [
        promotionId,
        existingTourIds,
      ]);

      logger.info(
        `Promotion ${promotionId} removed from ${result.rowCount} tours`
      );
      return {
        success: true,
        message: `Promotion removed from ${result.rowCount} tours successfully`,
        removedCount: result.rowCount,
        notAppliedCount: tourIds.length - existingTourIds.length,
      };
    } catch (error) {
      logger.error(
        `Error removing promotion from multiple tours: ${error.message}`
      );
      throw error;
    }
  }
}

export default Promotion;
