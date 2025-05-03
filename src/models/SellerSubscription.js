import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class SellerSubscription {
  static async create(subscriptionData) {
    const {
      seller_id,
      package_id,
      expiry_date,
      status = 'pending',
      payment_method,
    } = subscriptionData;

    const query = `
      INSERT INTO SellerSubscription (
        seller_id, package_id, expiry_date, status, payment_method
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [seller_id, package_id, expiry_date, status, payment_method];

    try {
      const result = await pool.query(query, values);
      logger.info(
        `Seller subscription created: subscriptionId=${result.rows[0].subscription_id}`
      );
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating seller subscription: ${error.message}`);
      throw error;
    }
  }

  static async findById(subscriptionId) {
    const query = `
      SELECT ss.*, sp.package_name, sp.price, sp.duration_days,
             u.name as seller_name, u.email as seller_email
      FROM SellerSubscription ss
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      JOIN Users u ON ss.seller_id = u.id
      WHERE ss.subscription_id = $1
    `;

    try {
      const result = await pool.query(query, [subscriptionId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding seller subscription by ID: ${error.message}`);
      throw error;
    }
  }

  static async findBySellerId(sellerId, limit, offset) {
    const baseQuery = `
      SELECT ss.*, sp.package_name, sp.price, sp.duration_days,
             u.name as seller_name, u.email as seller_email,
             si.invoice_id, si.transaction_id
      FROM SellerSubscription ss
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      JOIN Users u ON ss.seller_id = u.id
      LEFT JOIN SubscriptionInvoice si ON ss.subscription_id = si.subscription_id
      WHERE ss.seller_id = $1
      ORDER BY ss.purchase_date DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM SellerSubscription
      WHERE seller_id = $1
    `;

    try {
      const countResult = await pool.query(countQuery, [sellerId]);
      const totalItems = parseInt(countResult.rows[0].count);

      const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset, 2);
      const result = await pool.query(paginatedQuery, [
        sellerId,
        limit,
        offset,
      ]);

      return {
        subscriptions: result.rows,
        totalItems,
      };
    } catch (error) {
      logger.error(`Error finding seller subscriptions: ${error.message}`);
      throw error;
    }
  }

  static async findActiveSubscriptionBySellerId(sellerId) {
    const query = `
      SELECT ss.*, sp.package_name, sp.price, sp.duration_days
      FROM SellerSubscription ss
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      WHERE ss.seller_id = $1
      AND ss.status = 'active'
      AND ss.expiry_date > NOW()
      ORDER BY ss.expiry_date DESC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [sellerId]);
      return result.rows[0];
    } catch (error) {
      logger.error(
        `Error finding active subscription for seller: ${error.message}`
      );
      throw error;
    }
  }

  static async updateStatus(subscriptionId, status, transactionId = null) {
    const query = `
      UPDATE SellerSubscription
      SET status = $2
      WHERE subscription_id = $1
      RETURNING *
    `;

    const values = [subscriptionId, status];

    try {
      const result = await pool.query(query, values);
      logger.info(
        `Subscription status updated: subscriptionId=${subscriptionId}, status=${status}${
          transactionId ? ', transactionId=' + transactionId : ''
        }`
      );
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating subscription status: ${error.message}`);
      throw error;
    }
  }

  static async findExpiredSubscriptions() {
    const query = `
      SELECT ss.*, u.email as seller_email, u.name as seller_name
      FROM SellerSubscription ss
      JOIN Users u ON ss.seller_id = u.id
      WHERE ss.status = 'active'
      AND ss.expiry_date < NOW()
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding expired subscriptions: ${error.message}`);
      throw error;
    }
  }

  static async delete(subscriptionId) {
    // Check if there are any invoices for this subscription
    const checkQuery =
      'SELECT COUNT(*) FROM SubscriptionInvoice WHERE subscription_id = $1';
    const checkResult = await pool.query(checkQuery, [subscriptionId]);
    const invoiceCount = parseInt(checkResult.rows[0].count);

    if (invoiceCount > 0) {
      throw new Error('Cannot delete subscription with existing invoices');
    }

    const query = `
      DELETE FROM SellerSubscription
      WHERE subscription_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [subscriptionId]);
      logger.info(`Subscription deleted: subscriptionId=${subscriptionId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting subscription: ${error.message}`);
      throw error;
    }
  }

  static async findAllForAdmin(limit, offset) {
    const query = `
      SELECT ss.*, sp.package_name, sp.price, sp.duration_days,
             u.name as seller_name, u.email as seller_email
      FROM SellerSubscription ss
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      JOIN Users u ON ss.seller_id = u.id
      ORDER BY ss.purchase_date DESC
    `;

    const countQuery = `
      SELECT COUNT(*) FROM SellerSubscription
    `;

    try {
      const client = await pool.connect();

      try {
        const countResult = await client.query(countQuery);
        const totalItems = parseInt(countResult.rows[0].count);

        const paginatedQuery = `${query} LIMIT $1 OFFSET $2`;
        const result = await client.query(paginatedQuery, [limit, offset]);

        return {
          subscriptions: result.rows,
          totalItems,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(
        `Error finding all subscriptions for admin: ${error.message}`
      );
      throw error;
    }
  }
}

export default SellerSubscription;
