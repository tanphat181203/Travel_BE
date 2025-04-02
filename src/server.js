import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import initializeDatabase from './db/init.js';

const PORT = process.env.PORT || 80;

const startServer = async () => {
  try {
    await connectDB();
    
    try {
      await initializeDatabase();
    } catch (error) {
      console.warn('Database schema initialization error:', error.message);
      console.log('Continuing server startup despite database schema initialization error');
    }
    
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

startServer();
