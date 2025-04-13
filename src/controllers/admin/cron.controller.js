import { updateOverdueDepartures } from '../../utils/cronJobs.js';
import logger from '../../utils/logger.js';

/**
 * Manually trigger the update of overdue departures
 * This is an admin-only endpoint
 */
export const triggerOverdueDeparturesUpdate = async (req, res, next) => {
  try {
    logger.info('Manual trigger: Update overdue departures');
    
    const result = await updateOverdueDepartures();
    
    if (result.success) {
      return res.status(200).json({
        message: `Successfully updated ${result.count} overdue departures to unavailable`,
        count: result.count,
        updatedDepartures: result.updatedDepartures
      });
    } else {
      return res.status(500).json({
        message: 'Failed to update overdue departures',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in manual trigger of overdue departures update:', error);
    next(error);
  }
};
