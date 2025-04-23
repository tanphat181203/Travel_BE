import {
  updateOverdueDepartures,
  updateToursWithoutDepartures,
} from '../../utils/cronJobs.js';
import logger from '../../utils/logger.js';

export const triggerOverdueDeparturesUpdate = async (req, res, next) => {
  try {
    logger.info('Manual trigger: Update overdue departures');

    const result = await updateOverdueDepartures();

    if (result.success) {
      return res.status(200).json({
        message: `Successfully updated ${result.count} overdue departures to unavailable`,
        count: result.count,
        updatedDepartures: result.updatedDepartures,
      });
    } else {
      return res.status(500).json({
        message: 'Failed to update overdue departures',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(
      'Error in manual trigger of overdue departures update:',
      error
    );
    next(error);
  }
};

export const triggerToursWithoutDeparturesUpdate = async (req, res, next) => {
  try {
    logger.info('Manual trigger: Update tours without future departures');

    const result = await updateToursWithoutDepartures();

    if (result.success) {
      return res.status(200).json({
        message: `Successfully updated ${result.count} tours without future departures to unavailable`,
        count: result.count,
        updatedTours: result.updatedTours,
      });
    } else {
      return res.status(500).json({
        message: 'Failed to update tours without future departures',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(
      'Error in manual trigger of tours without departures update:',
      error
    );
    next(error);
  }
};
