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
      logger.info(
        `Successfully updated ${count} overdue departures to unavailable`
      );
      logger.debug('Updated departures:', updatedDepartures);
    } else {
      logger.info('No overdue departures found to update');
    }

    return {
      success: true,
      count,
      updatedDepartures,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating overdue departures:', error);

    return {
      success: false,
      error: error.message,
    };
  } finally {
    client.release();
  }
};

export const updateToursWithoutDepartures = async () => {
  const client = await pool.connect();

  try {
    logger.info('Starting job: Update tours without future departures');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    await client.query('BEGIN');

    const availableToursQuery = `
      SELECT tour_id FROM Tour
      WHERE availability = true
    `;

    const availableToursResult = await client.query(availableToursQuery);
    const availableTours = availableToursResult.rows;

    const toursToUpdate = [];

    for (const tour of availableTours) {
      const futureDeparturesQuery = `
        SELECT COUNT(*) FROM Departure
        WHERE tour_id = $1
        AND start_date >= $2
        AND availability = true
      `;

      const futureDeparturesResult = await client.query(futureDeparturesQuery, [
        tour.tour_id,
        formattedDate,
      ]);
      const futureDeparturesCount = parseInt(
        futureDeparturesResult.rows[0].count
      );

      if (futureDeparturesCount === 0) {
        toursToUpdate.push(tour.tour_id);
      }
    }

    let updatedTours = [];
    if (toursToUpdate.length > 0) {
      const updateQuery = `
        UPDATE Tour
        SET availability = false
        WHERE tour_id = ANY($1)
        RETURNING tour_id, title
      `;

      const updateResult = await client.query(updateQuery, [toursToUpdate]);
      updatedTours = updateResult.rows;
    }

    await client.query('COMMIT');

    const count = updatedTours.length;
    if (count > 0) {
      logger.info(
        `Successfully updated ${count} tours without future departures to unavailable`
      );
      logger.debug('Updated tours:', updatedTours);
    } else {
      logger.info('No tours without future departures found to update');
    }

    return {
      success: true,
      count,
      updatedTours,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating tours without future departures:', error);

    return {
      success: false,
      error: error.message,
    };
  } finally {
    client.release();
  }
};

export const initCronJobs = () => {
  const overdueJob = new CronJob(
    '1 0 * * *', // Run at 00:01 every day
    updateOverdueDepartures,
    null, // onComplete
    false, // start
    null, // timezone (null = server timezone)
    null, // context
    false // runOnInit (don't run immediately on initialization)
  );

  const toursWithoutDeparturesJob = new CronJob(
    '30 0 * * *', // Run at 00:30 every day
    updateToursWithoutDepartures,
    null, // onComplete
    false, // start
    null, // timezone (null = server timezone)
    null, // context
    false // runOnInit (don't run immediately on initialization)
  );

  overdueJob.start();
  toursWithoutDeparturesJob.start();

  logger.info('Cron jobs initialized successfully');

  return {
    overdueJob,
    toursWithoutDeparturesJob,
  };
};
