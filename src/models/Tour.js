import { pool } from '../config/db.js';
import { generateEmbedding } from '../utils/embeddingHelper.js';
import { addPaginationToQuery } from '../utils/pagination.js';
import TourService from '../services/tour.service.js';

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
      WHERE tour_id = $1 AND is_deleted = false
      RETURNING *
    `;

    const result = await pool.query(query, [tourId, ...values]);
    return result.rows[0];
  }

  static async findById(tourId) {
    const tourQuery = `
      SELECT t.*, u.name as seller_name 
      FROM Tour t
      JOIN Users u ON t.seller_id = u.id
      WHERE t.tour_id = $1 AND t.is_deleted = false
    `;
    const tourResult = await pool.query(tourQuery, [tourId]);
    const tour = tourResult.rows[0];

    if (!tour) return null;

    const imagesQuery = `
      SELECT * FROM Images
      WHERE tour_id = $1
      ORDER BY is_cover DESC, upload_date DESC
    `;
    const imagesResult = await pool.query(imagesQuery, [tourId]);

    tour.images = imagesResult.rows;

    return tour;
  }

  static async findBySellerId(sellerId, limit, offset) {
    const countQuery = 'SELECT COUNT(*) FROM Tour WHERE seller_id = $1 AND is_deleted = false';
    const countResult = await pool.query(countQuery, [sellerId]);
    const totalItems = parseInt(countResult.rows[0].count);

    let query = `
      SELECT t.*, u.name as seller_name 
      FROM Tour t
      JOIN Users u ON t.seller_id = u.id
      WHERE t.seller_id = $1 AND t.is_deleted = false
    `;

    if (limit !== undefined && offset !== undefined) {
      query = addPaginationToQuery(query, limit, offset);
    }

    const result = await pool.query(query, [sellerId]);
    const tours = result.rows;

    if (tours.length === 0) return { tours: [], totalItems };

    const tourIds = tours.map((tour) => tour.tour_id);
    const imagesQuery = `
      SELECT * FROM Images
      WHERE tour_id = ANY($1)
      ORDER BY tour_id, is_cover DESC, upload_date DESC
    `;
    const imagesResult = await pool.query(imagesQuery, [tourIds]);
    const images = imagesResult.rows;

    const imagesByTourId = {};
    images.forEach((image) => {
      if (!imagesByTourId[image.tour_id]) {
        imagesByTourId[image.tour_id] = [];
      }
      imagesByTourId[image.tour_id].push(image);
    });

    for (const tour of tours) {
      tour.images = imagesByTourId[tour.tour_id] || [];

      if (tour.availability) {
        const nextDeparture = await this.getNextAvailableDeparture(
          tour.tour_id
        );
        if (nextDeparture) {
          tour.next_departure_adult_price = nextDeparture.price_adult;
          tour.next_departure_id = nextDeparture.departure_id;
          tour.next_departure_date = nextDeparture.start_date;
        }
      }
    }

    return { tours, totalItems };
  }

  static async delete(tourId) {
    try {
      const query = `
        UPDATE Tour
        SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
        WHERE tour_id = $1 AND is_deleted = false
        RETURNING *
      `;
      const result = await pool.query(query, [tourId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error soft deleting tour: tourId=${tourId}`, error);
      throw error;
    }
  }

  static async restore(tourId) {
    try {
      const query = `
        UPDATE Tour
        SET is_deleted = false, deleted_at = NULL
        WHERE tour_id = $1 AND is_deleted = true
        RETURNING *
      `;
      const result = await pool.query(query, [tourId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error restoring tour: tourId=${tourId}`, error);
      throw error;
    }
  }

  static async hardDelete(tourId) {
    try {
      const getImagesQuery = 'SELECT * FROM Images WHERE tour_id = $1';
      const imagesResult = await pool.query(getImagesQuery, [tourId]);
      const images = imagesResult.rows;

      if (images.length > 0) {
        const { deleteFromFirebase } = await import(
          '../utils/uploadHandler.js'
        );

        const deletePromises = images.map((image) =>
          deleteFromFirebase(image.image_url)
        );
        await Promise.all(deletePromises);

        await pool.query('DELETE FROM Images WHERE tour_id = $1', [tourId]);
      }

      const query = 'DELETE FROM Tour WHERE tour_id = $1 RETURNING *';
      const result = await pool.query(query, [tourId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error hard deleting tour: tourId=${tourId}`, error);
      throw error;
    }
  }

  static async getNextAvailableDeparture(tourId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    const query = `
      SELECT d.* FROM Departure d
      JOIN Tour t ON d.tour_id = t.tour_id
      WHERE d.tour_id = $1
      AND d.start_date >= $2
      AND d.availability = true
      AND t.is_deleted = false
      ORDER BY d.start_date ASC
      LIMIT 1
    `;

    const result = await pool.query(query, [tourId, formattedDate]);
    return result.rows[0] || null;
  }

  static async search(searchParams) {
    return await TourService.search(searchParams);
  }

  static async semanticSearch(query, limit = 10, offset = 0) {
    const embedding = await generateEmbedding({ query });
    if (!embedding) return { tours: [], totalItems: 0 };

    const countQuery = `
      SELECT COUNT(*) FROM Tour
      WHERE embedding <=> $1 < 1.2 AND is_deleted = false
    `;
    const countResult = await pool.query(countQuery, [embedding]);
    const totalItems = parseInt(countResult.rows[0].count);

    const searchQuery = `
      SELECT * FROM Tour
      WHERE embedding <=> $1 < 1.2 AND is_deleted = false
      ORDER BY embedding <=> $1
      LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await pool.query(searchQuery, [embedding]);
    const tours = result.rows;

    if (tours.length === 0) return { tours: [], totalItems };

    const tourIds = tours.map((tour) => tour.tour_id);
    const imagesQuery = `
      SELECT * FROM Images
      WHERE tour_id = ANY($1)
      ORDER BY tour_id, is_cover DESC, upload_date DESC
    `;
    const imagesResult = await pool.query(imagesQuery, [tourIds]);
    const images = imagesResult.rows;

    const imagesByTourId = {};
    images.forEach((image) => {
      if (!imagesByTourId[image.tour_id]) {
        imagesByTourId[image.tour_id] = [];
      }
      imagesByTourId[image.tour_id].push(image);
    });

    for (const tour of tours) {
      tour.images = imagesByTourId[tour.tour_id] || [];

      if (tour.availability) {
        const nextDeparture = await this.getNextAvailableDeparture(
          tour.tour_id
        );
        if (nextDeparture) {
          tour.next_departure_adult_price = nextDeparture.price_adult;
          tour.next_departure_id = nextDeparture.departure_id;
          tour.next_departure_date = nextDeparture.start_date;
        }
      }
    }

    return { tours, totalItems };
  }

  static async addImages(tourId, imageUrls) {
    const values = [];
    const placeholders = [];
    let paramIndex = 2;

    for (const imageUrl of imageUrls) {
      placeholders.push(`($1, $${paramIndex})`);
      values.push(imageUrl);
      paramIndex++;
    }

    const query = `
      INSERT INTO Images (tour_id, image_url)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, [tourId, ...values]);
    return result.rows;
  }

  static async setCoverImage(tourId, imageId) {
    if (!imageId) {
      await pool.query(
        'UPDATE Images SET is_cover = false WHERE tour_id = $1',
        [tourId]
      );
      return null;
    }
    await pool.query('UPDATE Images SET is_cover = false WHERE tour_id = $1', [
      tourId,
    ]);
    const query = `
      UPDATE Images
      SET is_cover = true
      WHERE image_id = $1 AND tour_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [imageId, tourId]);
    return result.rows[0];
  }

  static async deleteImage(tourId, imageId) {
    try {
      const getImageQuery = `
        SELECT * FROM Images
        WHERE image_id = $1 AND tour_id = $2
      `;
      const imageResult = await pool.query(getImageQuery, [imageId, tourId]);
      const image = imageResult.rows[0];

      if (!image) {
        console.warn(`Image not found: imageId=${imageId}, tourId=${tourId}`);
        return null;
      }

      const { deleteFromFirebase } = await import('../utils/uploadHandler.js');

      await deleteFromFirebase(image.image_url);

      const deleteQuery = `
        DELETE FROM Images
        WHERE image_id = $1 AND tour_id = $2
        RETURNING *
      `;

      const result = await pool.query(deleteQuery, [imageId, tourId]);
      return result.rows[0];
    } catch (error) {
      console.error(
        `Error deleting image: imageId=${imageId}, tourId=${tourId}`,
        error
      );
      throw error;
    }
  }

  static async addCoverImage(tourId, imageUrl) {
    try {
      await this.setCoverImage(tourId, null);

      const query = `
        INSERT INTO Images (tour_id, image_url, is_cover)
        VALUES ($1, $2, true)
        RETURNING *
      `;

      const result = await pool.query(query, [tourId, imageUrl]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error adding cover image for tour ${tourId}:`, error);
      throw error;
    }
  }

  static async getImages(tourId) {
    const query = `
      SELECT * FROM Images
      WHERE tour_id = $1
      ORDER BY is_cover DESC, upload_date DESC
    `;

    const result = await pool.query(query, [tourId]);
    return result.rows;
  }

  static async getDepartureLocations() {
    const query =
      'SELECT DISTINCT departure_location FROM Tour WHERE is_deleted = false ORDER BY departure_location';
    const result = await pool.query(query);
    return result.rows.map((row) => row.departure_location);
  }

  static async getLocations() {
    const query = `
      SELECT
        DISTINCT departure_location,
        UNNEST(destination) as destination
      FROM Tour
      WHERE availability = true AND is_deleted = false
      ORDER BY departure_location, destination;
    `;

    const result = await pool.query(query);

    return {
      departure_locations: [
        ...new Set(result.rows.map((row) => row.departure_location)),
      ],
      destinations: [...new Set(result.rows.map((row) => row.destination))],
    };
  }

  static async getStatsBySellerId(sellerId) {
    try {
      const client = await pool.connect();

      try {
        // Get total tours count
        const toursQuery = `
          SELECT
            COUNT(*) as total_tours,
            COUNT(*) FILTER (WHERE availability = true) as active_tours
          FROM Tour
          WHERE seller_id = $1 AND is_deleted = false
        `;
        const toursResult = await client.query(toursQuery, [sellerId]);

        // Get total departures count
        const departuresQuery = `
          SELECT
            COUNT(*) as total_departures,
            COUNT(*) FILTER (WHERE d.availability = true AND d.start_date >= CURRENT_DATE) as upcoming_departures
          FROM Departure d
          JOIN Tour t ON d.tour_id = t.tour_id
          WHERE t.seller_id = $1 AND t.is_deleted = false
        `;
        const departuresResult = await client.query(departuresQuery, [
          sellerId,
        ]);

        // Get most popular tour
        const popularTourQuery = `
          SELECT
            t.tour_id,
            t.title,
            COUNT(b.booking_id) as booking_count
          FROM Tour t
          JOIN Departure d ON t.tour_id = d.tour_id
          JOIN Booking b ON d.departure_id = b.departure_id
          WHERE t.seller_id = $1 AND t.is_deleted = false
          GROUP BY t.tour_id, t.title
          ORDER BY booking_count DESC
          LIMIT 1
        `;
        const popularTourResult = await client.query(popularTourQuery, [
          sellerId,
        ]);

        return {
          total_tours: parseInt(toursResult.rows[0].total_tours) || 0,
          active_tours: parseInt(toursResult.rows[0].active_tours) || 0,
          total_departures:
            parseInt(departuresResult.rows[0].total_departures) || 0,
          upcoming_departures:
            parseInt(departuresResult.rows[0].upcoming_departures) || 0,
          most_popular_tour: popularTourResult.rows[0] || null,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error getting tour stats for seller ${sellerId}:`, error);
      throw error;
    }
  }

  static async findByIdIncludingDeleted(tourId) {
    const tourQuery = `
      SELECT t.*, u.name as seller_name 
      FROM Tour t
      JOIN Users u ON t.seller_id = u.id
      WHERE t.tour_id = $1
    `;
    const tourResult = await pool.query(tourQuery, [tourId]);
    return tourResult.rows[0];
  }

  static async findDeletedBySellerId(sellerId, limit, offset) {
    try {
      const countQuery = 'SELECT COUNT(*) FROM Tour WHERE seller_id = $1 AND is_deleted = true';
      const countResult = await pool.query(countQuery, [sellerId]);
      const totalItems = parseInt(countResult.rows[0].count);

      const query = `
        SELECT t.*, u.name as seller_name 
        FROM Tour t
        JOIN Users u ON t.seller_id = u.id
        WHERE t.seller_id = $1 AND t.is_deleted = true
        ORDER BY t.deleted_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [sellerId, limit, offset]);
      const tours = result.rows;

      if (tours.length === 0) return { tours: [], totalItems };

      const tourIds = tours.map((tour) => tour.tour_id);
      const imagesQuery = `
        SELECT * FROM Images
        WHERE tour_id = ANY($1)
        ORDER BY tour_id, is_cover DESC, upload_date DESC
      `;
      const imagesResult = await pool.query(imagesQuery, [tourIds]);
      const images = imagesResult.rows;

      const imagesByTourId = {};
      images.forEach((image) => {
        if (!imagesByTourId[image.tour_id]) {
          imagesByTourId[image.tour_id] = [];
        }
        imagesByTourId[image.tour_id].push(image);
      });

      for (const tour of tours) {
        tour.images = imagesByTourId[tour.tour_id] || [];
      }

      return { tours, totalItems };
    } catch (error) {
      console.error(`Error finding deleted tours for seller ${sellerId}:`, error);
      throw error;
    }
  }
}

export default Tour;
