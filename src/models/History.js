import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

class History {
  static async create(historyData) {
    const { user_id, tour_id, action_type } = historyData;
    
    logger.info(`Creating history entry: userId=${user_id}, tourId=${tour_id}, action=${action_type}`);

    const query = `
      INSERT INTO History (user_id, tour_id, action_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [user_id, tour_id, action_type];

    try {
      const result = await pool.query(query, values);
      logger.info(`History entry created: userId=${user_id}, tourId=${tour_id}, action=${action_type}, historyId=${result.rows[0].history_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating history entry: userId=${user_id}, tourId=${tour_id}, action=${action_type}, error=${error.message}`);
      logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  static async hasRecentView(userId, tourId, minutes = 15) {
    logger.info(`Checking for recent view: userId=${userId}, tourId=${tourId}, window=${minutes}min`);
    
    const query = `
      SELECT COUNT(*) 
      FROM History 
      WHERE user_id = $1 
        AND tour_id = $2 
        AND action_type = 'view'
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
    `;

    try {
      const result = await pool.query(query, [userId, tourId]);
      const hasRecentView = parseInt(result.rows[0].count) > 0;
      logger.info(`Recent view check result: userId=${userId}, tourId=${tourId}, hasRecentView=${hasRecentView}`);
      return hasRecentView;
    } catch (error) {
      logger.error(`Error checking recent tour view: userId=${userId}, tourId=${tourId}, error=${error.message}`);
      logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  static async getUserHistory(userId, limit, offset) {
    const baseQuery = `
      SELECT h.*, t.title as tour_title
      FROM History h
      JOIN Tour t ON h.tour_id = t.tour_id
      WHERE h.user_id = $1
      ORDER BY h.timestamp DESC
    `;
    
    const countQuery = `
      SELECT COUNT(*)
      FROM History
      WHERE user_id = $1
    `;

    try {
      const countResult = await pool.query(countQuery, [userId]);
      const totalItems = parseInt(countResult.rows[0].count);

      let query = baseQuery;
      if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const result = await pool.query(query, [userId]);
      return { history: result.rows, totalItems };
    } catch (error) {
      logger.error(`Error getting user history: userId=${userId}, error=${error.message}`);
      logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}

export default History; 