import { pool } from '../config/db.js';
import logger from '../utils/logger.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class SubscriptionInvoice {
  static async create(invoiceData) {
    const { 
      subscription_id, 
      amount_due, 
      details = '{}', 
      transaction_id = null 
    } = invoiceData;

    const query = `
      INSERT INTO SubscriptionInvoice (
        subscription_id, amount_due, details, transaction_id
      )
      VALUES ($1, $2, $3::jsonb, $4)
      RETURNING *
    `;

    const values = [subscription_id, amount_due, details, transaction_id];

    try {
      const result = await pool.query(query, values);
      logger.info(`Subscription invoice created: invoiceId=${result.rows[0].invoice_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating subscription invoice: ${error.message}`);
      throw error;
    }
  }

  static async findById(invoiceId) {
    const query = `
      SELECT si.*, ss.seller_id, ss.package_id, ss.purchase_date, ss.expiry_date, ss.status as subscription_status,
             sp.package_name, sp.price, sp.duration_days,
             u.name as seller_name, u.email as seller_email, u.phone_number as seller_phone
      FROM SubscriptionInvoice si
      JOIN SellerSubscription ss ON si.subscription_id = ss.subscription_id
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      JOIN Users u ON ss.seller_id = u.id
      WHERE si.invoice_id = $1
    `;

    try {
      const result = await pool.query(query, [invoiceId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding subscription invoice by ID: ${error.message}`);
      throw error;
    }
  }

  static async findBySubscriptionId(subscriptionId) {
    const query = `
      SELECT si.*, ss.seller_id, ss.package_id, ss.purchase_date, ss.expiry_date, ss.status as subscription_status,
             sp.package_name, sp.price, sp.duration_days
      FROM SubscriptionInvoice si
      JOIN SellerSubscription ss ON si.subscription_id = ss.subscription_id
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      WHERE si.subscription_id = $1
    `;

    try {
      const result = await pool.query(query, [subscriptionId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding subscription invoice by subscription ID: ${error.message}`);
      throw error;
    }
  }

  static async findBySellerId(sellerId, limit, offset) {
    const baseQuery = `
      SELECT si.*, ss.seller_id, ss.package_id, ss.purchase_date, ss.expiry_date, ss.status as subscription_status,
             sp.package_name, sp.price, sp.duration_days
      FROM SubscriptionInvoice si
      JOIN SellerSubscription ss ON si.subscription_id = ss.subscription_id
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      WHERE ss.seller_id = $1
      ORDER BY si.date_issued DESC
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM SubscriptionInvoice si
      JOIN SellerSubscription ss ON si.subscription_id = ss.subscription_id
      WHERE ss.seller_id = $1
    `;

    try {
      const countResult = await pool.query(countQuery, [sellerId]);
      const totalItems = parseInt(countResult.rows[0].count);

      const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset, 2);
      const result = await pool.query(paginatedQuery, [sellerId, limit, offset]);
      
      return {
        invoices: result.rows,
        totalItems
      };
    } catch (error) {
      logger.error(`Error finding subscription invoices by seller ID: ${error.message}`);
      throw error;
    }
  }

  static async updateTransactionId(invoiceId, transactionId) {
    const query = `
      UPDATE SubscriptionInvoice
      SET transaction_id = $2
      WHERE invoice_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [invoiceId, transactionId]);
      logger.info(`Subscription invoice transaction ID updated: invoiceId=${invoiceId}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating subscription invoice transaction ID: ${error.message}`);
      throw error;
    }
  }

  static async findByTransactionId(transactionId) {
    const query = `
      SELECT si.*, ss.seller_id, ss.package_id, ss.purchase_date, ss.expiry_date, ss.status as subscription_status,
             sp.package_name, sp.price, sp.duration_days
      FROM SubscriptionInvoice si
      JOIN SellerSubscription ss ON si.subscription_id = ss.subscription_id
      JOIN SubscriptionPackage sp ON ss.package_id = sp.package_id
      WHERE si.transaction_id = $1
    `;

    try {
      const result = await pool.query(query, [transactionId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error finding subscription invoice by transaction ID: ${error.message}`);
      throw error;
    }
  }
}

export default SubscriptionInvoice;
