import { pool } from '../config/db.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class User {
  static async executeQuery(query, params) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('Database error:', error.message);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM Users WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Users WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  }

  static async findOne(filter) {
    let query = 'SELECT * FROM Users WHERE ';
    const values = [];
    let paramIndex = 1;

    Object.entries(filter).forEach(([key, value], index) => {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (index > 0) query += ' AND ';
      query += `${snakeCaseKey} = $${paramIndex}`;
      values.push(value);
      paramIndex++;
    });

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  static async find(filter, limit, offset) {
    let baseQuery = 'SELECT * FROM Users WHERE ';
    let countQuery = 'SELECT COUNT(*) FROM Users WHERE ';
    const values = [];
    let paramIndex = 1;

    Object.entries(filter).forEach(([key, value], index) => {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (index > 0) {
        baseQuery += ' AND ';
        countQuery += ' AND ';
      }
      const condition = `${snakeCaseKey} = $${paramIndex}`;
      baseQuery += condition;
      countQuery += condition;
      values.push(value);
      paramIndex++;
    });

    const countResult = await this.executeQuery(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    let query = baseQuery;
    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    const result = await this.executeQuery(query, values);
    return { users: result.rows, totalItems };
  }

  static async findByIdAndUpdate(id, updates) {
    const entries = Object.entries(updates);
    if (entries.length === 0) return this.findById(id);

    const snakeCaseUpdates = {};
    for (const [key, value] of entries) {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseUpdates[snakeCaseKey] = value;
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(snakeCaseUpdates).forEach(([key, value]) => {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    values.push(id);
    const query = `
      UPDATE Users
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  static async findByIdAndDelete(id) {
    try {
      const user = await this.findById(id);
      if (!user) return null;

      const query = 'DELETE FROM Users WHERE id = $1 RETURNING *';
      const result = await this.executeQuery(query, [id]);
      const deletedUser = result.rows[0];

      if (deletedUser && deletedUser.avatar_url) {
        try {
          const { deleteFromFirebase } = await import(
            '../utils/uploadHandler.js'
          );
          await deleteFromFirebase(deletedUser.avatar_url);
        } catch (error) {
          console.error(`Error deleting avatar for user ${id}:`, error);
        }
      }

      return deletedUser;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  static async create(userData) {
    const fields = [];
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    const snakeCaseData = {};
    for (const [key, value] of Object.entries(userData)) {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseData[snakeCaseKey] = value;
    }

    if (!snakeCaseData.status) snakeCaseData.status = 'pending_verification';
    if (!snakeCaseData.role) snakeCaseData.role = 'user';

    Object.entries(snakeCaseData).forEach(([key, value]) => {
      fields.push(key);
      placeholders.push(`$${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const query = `
      INSERT INTO Users (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  static async findBySellerId(sellerId) {
    const query = 'SELECT * FROM Users WHERE id = $1 AND role = $2';
    const result = await this.executeQuery(query, [sellerId, 'seller']);
    return result.rows[0];
  }

  static async getUserStats(userId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM Booking WHERE user_id = $1) as total_bookings,
        (SELECT COUNT(*) FROM Review WHERE user_id = $1) as total_reviews
    `;
    
    const result = await this.executeQuery(query, [userId]);
    return result.rows[0];
  }
}

export default User;
