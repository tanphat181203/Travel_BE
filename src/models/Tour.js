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
    const tourQuery = 'SELECT * FROM Tour WHERE tour_id = $1';
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

  static async findBySellerId(sellerId) {
    const query = 'SELECT * FROM Tour WHERE seller_id = $1';
    const result = await pool.query(query, [sellerId]);
    const tours = result.rows;

    if (tours.length === 0) return [];

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

    tours.forEach((tour) => {
      tour.images = imagesByTourId[tour.tour_id] || [];
    });

    return tours;
  }

  static async delete(tourId) {
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
      console.error(`Error deleting tour: tourId=${tourId}`, error);
      throw error;
    }
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

    if (searchParams.seller_id) {
      query += ` AND seller_id = $${paramIndex++}`;
      values.push(searchParams.seller_id);
    }

    const result = await pool.query(query, values);
    const tours = result.rows;

    if (tours.length === 0) return [];

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

    tours.forEach((tour) => {
      tour.images = imagesByTourId[tour.tour_id] || [];
    });

    return tours;
  }

  static async semanticSearch(query) {
    const embedding = await generateEmbedding({ query });
    if (!embedding) return [];

    const searchQuery = `
      SELECT * FROM Tour
      WHERE embedding <=> $1 < 0.5
      ORDER BY embedding <=> $1
      LIMIT 10
    `;
    const result = await pool.query(searchQuery, [embedding]);
    const tours = result.rows;

    if (tours.length === 0) return [];

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

    tours.forEach((tour) => {
      tour.images = imagesByTourId[tour.tour_id] || [];
    });

    return tours;
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

  static async getImages(tourId) {
    const query = `
      SELECT * FROM Images
      WHERE tour_id = $1
      ORDER BY is_cover DESC, upload_date DESC
    `;

    const result = await pool.query(query, [tourId]);
    return result.rows;
  }
}

export default Tour;
