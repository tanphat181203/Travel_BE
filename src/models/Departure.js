import { pool } from '../config/db.js';
import { addPaginationToQuery } from '../utils/pagination.js';

class Departure {
  static async create(departureData) {
    const {
      tour_id,
      start_date,
      price_adult,
      price_child_120_140,
      price_child_100_120,
      availability = true,
      description,
    } = departureData;

    const query = `
      INSERT INTO Departure (
        tour_id, start_date, price_adult, price_child_120_140,
        price_child_100_120, availability, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      tour_id,
      start_date,
      price_adult,
      price_child_120_140,
      price_child_100_120,
      availability,
      description,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(departureId) {
    const query = 'SELECT * FROM Departure WHERE departure_id = $1';
    const result = await pool.query(query, [departureId]);
    return result.rows[0];
  }

  static async findByTourId(tourId, limit, offset) {
    const countQuery = 'SELECT COUNT(*) FROM Departure WHERE tour_id = $1';
    const countResult = await pool.query(countQuery, [tourId]);
    const totalItems = parseInt(countResult.rows[0].count);

    let query =
      'SELECT * FROM Departure WHERE tour_id = $1 ORDER BY start_date ASC';

    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    const result = await pool.query(query, [tourId]);
    return { departures: result.rows, totalItems };
  }

  static async findAvailableByTourId(tourId, limit, offset) {
    const countQuery = 'SELECT COUNT(*) FROM Departure WHERE tour_id = $1 AND availability = true';
    const countResult = await pool.query(countQuery, [tourId]);
    const totalItems = parseInt(countResult.rows[0].count);

    let query =
      'SELECT * FROM Departure WHERE tour_id = $1 AND availability = true ORDER BY start_date ASC';

    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    const result = await pool.query(query, [tourId]);
    return { departures: result.rows, totalItems };
  }

  static async update(departureId, updateData) {
    const allowedFields = [
      'start_date',
      'price_adult',
      'price_child_120_140',
      'price_child_100_120',
      'availability',
      'description',
    ];

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE Departure
      SET ${setClause}
      WHERE departure_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [departureId, ...values]);
    return result.rows[0];
  }

  static async delete(departureId) {
    const checkBookingsQuery =
      'SELECT COUNT(*) FROM Booking WHERE departure_id = $1';
    const bookingsResult = await pool.query(checkBookingsQuery, [departureId]);
    const bookingsCount = parseInt(bookingsResult.rows[0].count);

    if (bookingsCount > 0) {
      throw new Error('Cannot delete departure with existing bookings');
    }

    const query = 'DELETE FROM Departure WHERE departure_id = $1 RETURNING *';
    const result = await pool.query(query, [departureId]);
    return result.rows[0];
  }

  static async checkDateExists(tourId, startDate, departureId = null) {
    let query = `
      SELECT COUNT(*) FROM Departure
      WHERE tour_id = $1 AND start_date = $2
    `;

    const values = [tourId, startDate];

    if (departureId) {
      query += ` AND departure_id != $3`;
      values.push(departureId);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  static async search(searchParams) {
    let baseQuery = 'SELECT * FROM Departure WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM Departure WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (searchParams.tour_id) {
      const condition = ` AND tour_id = $${paramIndex++}`;
      baseQuery += condition;
      countQuery += condition;
      values.push(searchParams.tour_id);
    }

    if (searchParams.start_date_from) {
      const condition = ` AND start_date >= $${paramIndex++}`;
      baseQuery += condition;
      countQuery += condition;
      values.push(searchParams.start_date_from);
    }

    if (searchParams.start_date_to) {
      const condition = ` AND start_date <= $${paramIndex++}`;
      baseQuery += condition;
      countQuery += condition;
      values.push(searchParams.start_date_to);
    }

    if (searchParams.availability !== undefined) {
      const condition = ` AND availability = $${paramIndex++}`;
      baseQuery += condition;
      countQuery += condition;
      values.push(searchParams.availability);
    }

    baseQuery += ' ORDER BY start_date ASC';

    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    let query = baseQuery;
    if (searchParams.limit !== undefined && searchParams.offset !== undefined) {
      query = addPaginationToQuery(
        query,
        searchParams.limit,
        searchParams.offset
      );
    }

    const result = await pool.query(query, values);
    return { departures: result.rows, totalItems };
  }
}

export default Departure;
