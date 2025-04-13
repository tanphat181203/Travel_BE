import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeDatabase = async () => {
  let client;
  try {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    client = await pool.connect();

    await client.query(schemaSQL);

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing database schema:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

export default initializeDatabase;
