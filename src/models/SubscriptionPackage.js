import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class SubscriptionPackage {
  static async create(packageData) {
    const { package_name, description, price, duration_days, status = 'active' } = packageData;

    const query = `
      INSERT INTO SubscriptionPackage (
        package_name, description, price, duration_days, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [package_name, description, price, duration_days, status];

    try {
      const result = await pool.query(query, values);
      logger.info(`Subscription package created: packageId=${result.rows[0].package_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating subscription package: ${error.message}`);
      throw error;
    }
  }

  static async findById(packageId) {
    const query = `
      SELECT * FROM SubscriptionPackage
      WHERE package_id = $1
    `;

    try {
      const result = await pool.query(query, [packageId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding subscription package by ID: ${error.message}`);
      throw error;
    }
  }

  static async findAll(filters = {}, limit, offset) {
    let baseQuery = `
      SELECT * FROM SubscriptionPackage
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (filters.status) {
      baseQuery += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    const countQuery = baseQuery.replace('SELECT *', 'SELECT COUNT(*)');
    
    baseQuery += ` ORDER BY price ASC`;

    try {
      const countResult = await pool.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      let paginatedQuery;
      if (queryParams.length > 0) {
        paginatedQuery = `${baseQuery} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const result = await pool.query(paginatedQuery, [...queryParams, limit, offset]);
        return {
          packages: result.rows,
          totalItems
        };
      } else {
        paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
        const result = await pool.query(paginatedQuery);
        return {
          packages: result.rows,
          totalItems
        };
      }
    } catch (error) {
      logger.error(`Error finding subscription packages: ${error.message}`);
      throw error;
    }
  }

  static async update(packageId, updateData) {
    const allowedFields = ['package_name', 'description', 'price', 'duration_days', 'status'];

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE SubscriptionPackage
      SET ${setClause}
      WHERE package_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [packageId, ...values]);
      logger.info(`Subscription package updated: packageId=${packageId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating subscription package: ${error.message}`);
      throw error;
    }
  }

  static async delete(packageId) {
    // Check if there are any subscriptions using this package
    const checkQuery = 'SELECT COUNT(*) FROM SellerSubscription WHERE package_id = $1';
    const checkResult = await pool.query(checkQuery, [packageId]);
    const subscriptionCount = parseInt(checkResult.rows[0].count);

    if (subscriptionCount > 0) {
      throw new Error('Cannot delete package with existing subscriptions');
    }

    const query = `
      DELETE FROM SubscriptionPackage
      WHERE package_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [packageId]);
      logger.info(`Subscription package deleted: packageId=${packageId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting subscription package: ${error.message}`);
      throw error;
    }
  }
}

export default SubscriptionPackage;
