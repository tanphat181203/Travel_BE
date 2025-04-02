import { pool } from '../config/db.js';

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
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  }

  static async findOne(filter) {
    let query = 'SELECT * FROM users WHERE ';
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

  static async find(filter) {
    let query = 'SELECT * FROM users WHERE ';
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
    return result.rows;
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
      UPDATE users 
      SET ${setClauses.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  static async findByIdAndDelete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  }

  static async create(userData) {
    const fields = [];
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    // Convert camelCase to snake_case for PostgreSQL
    const snakeCaseData = {};
    for (const [key, value] of Object.entries(userData)) {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseData[snakeCaseKey] = value;
    }

    Object.entries(snakeCaseData).forEach(([key, value]) => {
      fields.push(key);
      placeholders.push(`$${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    const query = `
      INSERT INTO users (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')}) 
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }
}

export default User;
