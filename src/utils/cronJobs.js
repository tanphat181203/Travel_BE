import { pool } from '../config/db.js';
import { CronJob } from 'cron';
import logger from './logger.js';

export const updateOverdueDepartures = async () => {
  const client = await pool.connect();
  
  try {
    logger.info('Starting job: Update overdue departures');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];
    
    await client.query('BEGIN');
    
    const updateQuery = `
      UPDATE Departure
      SET availability = false
      WHERE start_date < $1
      AND availability = true
      RETURNING departure_id, tour_id, start_date
    `;
    
    const result = await client.query(updateQuery, [formattedDate]);
    const updatedDepartures = result.rows;
    
    await client.query('COMMIT');
    
    const count = updatedDepartures.length;
    if (count > 0) {
      logger.info(`Successfully updated ${count} overdue departures to unavailable`);
      logger.debug('Updated departures:', updatedDepartures);
    } else {
      logger.info('No overdue departures found to update');
    }
    
    return {
      success: true,
      count,
      updatedDepartures
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating overdue departures:', error);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

export const initCronJobs = () => {
  const overdueJob = new CronJob(
    '1 0 * * *',
    updateOverdueDepartures,
    null, // onComplete
    false, // start
    null, // timezone (null = server timezone)
    null, // context
    false // runOnInit (don't run immediately on initialization)
  );
  
  overdueJob.start();
  
  logger.info('Cron jobs initialized successfully');
  
  return {
    overdueJob
  };
};
