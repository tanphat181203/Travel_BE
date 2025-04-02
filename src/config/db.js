import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

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
  console.error('Unexpected error on idle client', err);
});

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      console.log('PostgreSQL connected');
      client.release();
      return;
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  console.error('Failed to connect to PostgreSQL after multiple retries');
  process.exit(1);
};

export { pool };
export default connectDB;
