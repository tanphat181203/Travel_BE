import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;
import logger from '../utils/logger.js';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

pool.on('connect', (client) => {
  client.query('SET timezone = "Asia/Bangkok"');
});

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      logger.info('PostgreSQL connected');
      client.release();
      return;
    } catch (error) {
      logger.error('PostgreSQL connection error:', error);
      retries -= 1;
      logger.info(`Retries left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  logger.error('Failed to connect to PostgreSQL after multiple retries');
  process.exit(1);
};

export { pool };
export default connectDB;
