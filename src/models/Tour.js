import { pool } from '../config/db.js';
import { generateEmbedding } from '../utils/embeddingHelper.js';

class Tour {
  static async create(tourData) {
    const {
      seller_id,
      title,
      duration,
      departure_location,
      description,
      destination,
      region,
      itinerary,
      max_participants,
      availability = true,
    } = tourData;

    const query = `
      INSERT INTO Tour (
        seller_id, title, duration, departure_location, description, 
        destination, region, itinerary, max_participants, availability
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      RETURNING *
    `;

    const values = [
      seller_id,
      title,
      duration,
      departure_location,
      description,
      destination,
      region,
      JSON.stringify(itinerary),
      max_participants,
      availability,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateEmbedding(tourId, embedding) {
    const query = `
      UPDATE Tour 
      SET embedding = $2
      WHERE tour_id = $1
      RETURNING tour_id
    `;

    const result = await pool.query(query, [tourId, embedding]);
    return result.rows[0];
  }

  static async update(tourId, updateData) {
    const allowedFields = [
      'title',
      'duration',
      'departure_location',
      'description',
      'destination',
      'region',
      'itinerary',
      'max_participants',
      'availability',
    ];

    if (updateData.itinerary) {
      updateData.itinerary = JSON.stringify(updateData.itinerary);
    }

    const setClause = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => {
        if (key === 'itinerary') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');

    const values = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updateData[key]);

    if (values.length === 0) return null;

    const query = `
      UPDATE Tour 
      SET ${setClause} 
      WHERE tour_id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, [tourId, ...values]);
    return result.rows[0];
  }

  static async findById(tourId) {
    const query = 'SELECT * FROM Tour WHERE tour_id = $1';
    const result = await pool.query(query, [tourId]);
    return result.rows[0];
  }

  static async findBySellerId(sellerId) {
    const query = 'SELECT * FROM Tour WHERE seller_id = $1';
    const result = await pool.query(query, [sellerId]);
    return result.rows;
  }

  static async delete(tourId) {
    const query = 'DELETE FROM Tour WHERE tour_id = $1 RETURNING *';
    const result = await pool.query(query, [tourId]);
    return result.rows[0];
  }

  static async search(searchParams) {
    let query = 'SELECT * FROM Tour WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (searchParams.region) {
      query += ` AND region = $${paramIndex++}`;
      values.push(searchParams.region);
    }

    if (searchParams.destination) {
      query += ` AND destination @> ARRAY[$${paramIndex++}]`;
      values.push(searchParams.destination);
    }

    if (searchParams.availability !== undefined) {
      query += ` AND availability = $${paramIndex++}`;
      values.push(searchParams.availability);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async semanticSearch(query) {
    const embedding = await generateEmbedding({ query });
    const searchQuery = `
      SELECT * FROM Tour 
      WHERE embedding <=> $1 < 0.5
      ORDER BY embedding <=> $1
      LIMIT 10
    `;
    const result = await pool.query(searchQuery, [embedding]);
    return result.rows;
  }
}

export default Tour;
