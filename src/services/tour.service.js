import { pool } from '../config/db.js';
import {
  formatObjectDates,
  formatDateToLocal,
} from '../utils/dateFormatter.js';

class TourService {
  static async search(searchParams) {
    try {
      this.validatePredefinedRanges(searchParams);

      const params = this.prepareSearchParams(searchParams);
      const { query, countQuery, values } = this.buildSearchQuery(params);

      const countResult = await pool.query(countQuery, values);
      const totalItems = parseInt(countResult.rows[0].count);

      let finalQuery = query;
      if (params.limit !== undefined && params.offset !== undefined) {
        finalQuery += ` LIMIT ${params.limit} OFFSET ${params.offset}`;
      }

      const result = await pool.query(finalQuery, values);
      const tours = result.rows;

      if (tours.length === 0) {
        return { tours: [], totalItems };
      }

      for (const tour of tours) {
        if (tour.start_date) {
          tour.start_date = formatDateToLocal(tour.start_date);
        }
      }

      const enrichedTours = await this.enrichToursWithAdditionalData(tours);
      return { tours: enrichedTours, totalItems };
    } catch (error) {
      console.error('Error in tour search:', error);
      throw new Error(`Failed to search tours: ${error.message}`);
    }
  }

  static validatePredefinedRanges(params) {
    const validDurationRanges = ['1-3 ngày', '3-5 ngày', '5-7 ngày', '7+ ngày'];
    const validPeopleRanges = ['1 người', '2 người', '3-5 người', '5+ người'];

    if (params.duration_range) {
      console.log(`Validating duration_range: ${params.duration_range}`);
      if (!validDurationRanges.includes(params.duration_range)) {
        console.log(`Invalid duration_range: ${params.duration_range}`);
        throw new Error(
          `Invalid duration range. Valid options are: ${validDurationRanges.join(
            ', '
          )}`
        );
      }
    }

    if (params.people_range) {
      console.log(`Validating people_range: ${params.people_range}`);
      console.log(`Valid people ranges: ${validPeopleRanges.join(', ')}`);
      console.log(
        `Includes check: ${validPeopleRanges.includes(params.people_range)}`
      );

      const decodedPeopleRange = decodeURIComponent(params.people_range);
      console.log(`Decoded people_range: ${decodedPeopleRange}`);
      console.log(
        `Includes check with decoded: ${validPeopleRanges.includes(
          decodedPeopleRange
        )}`
      );

      if (
        !validPeopleRanges.includes(params.people_range) &&
        !validPeopleRanges.includes(decodedPeopleRange)
      ) {
        console.log(`Invalid people_range: ${params.people_range}`);
        throw new Error(
          `Invalid people range. Valid options are: ${validPeopleRanges.join(
            ', '
          )}`
        );
      }

      if (
        !validPeopleRanges.includes(params.people_range) &&
        validPeopleRanges.includes(decodedPeopleRange)
      ) {
        params.people_range = decodedPeopleRange;
      }
    }
  }

  static mapDurationRange(rangeString) {
    switch (rangeString) {
      case '1-3 ngày':
        return { min_duration: 1, max_duration: 3 };
      case '3-5 ngày':
        return { min_duration: 3, max_duration: 5 };
      case '5-7 ngày':
        return { min_duration: 5, max_duration: 7 };
      case '7+ ngày':
        return { min_duration: 7, max_duration: null };
      default:
        return null;
    }
  }

  static mapPeopleRange(rangeString) {
    switch (rangeString) {
      case '1 người':
        return { min_people: 1, max_people: null };
      case '2 người':
        return { min_people: 2, max_people: null };
      case '3-5 người':
        return { min_people: 3, max_people: null };
      case '5+ người':
        return { min_people: 5, max_people: null };
      default:
        return null;
    }
  }

  static prepareSearchParams(searchParams) {
    const params = { ...searchParams };

    if (params.num_people !== undefined && params.min_people === undefined) {
      params.min_people = params.num_people;
    }

    if (params.duration !== undefined && params.duration_range === undefined) {
      const durationMatch = params.duration.match(/(\d+)/);
      if (durationMatch) {
        const days = parseInt(durationMatch[1]);
        if (!isNaN(days)) {
          if (days >= 1 && days <= 3) {
            params.duration_range = '1-3 ngày';
          } else if (days > 3 && days <= 5) {
            params.duration_range = '3-5 ngày';
          } else if (days > 5 && days <= 7) {
            params.duration_range = '5-7 ngày';
          } else if (days > 7) {
            params.duration_range = '7+ ngày';
          }
        }
      }
    }

    if (params.duration_range) {
      const durationRange = this.mapDurationRange(params.duration_range);
      if (durationRange) {
        params.min_duration = durationRange.min_duration;
        params.max_duration = durationRange.max_duration;
      }
      delete params.duration_range;
    }

    if (params.people_range) {
      console.log(`Processing people_range: ${params.people_range}`);
      const peopleRange = this.mapPeopleRange(params.people_range);
      if (peopleRange) {
        console.log(
          `Mapped to min_people: ${peopleRange.min_people}, max_people: ${peopleRange.max_people}`
        );
        params.min_people = peopleRange.min_people;
        params.max_people = peopleRange.max_people;
      } else {
        console.log(`Failed to map people_range: ${params.people_range}`);
      }
      delete params.people_range;
    }

    if (params.min_price !== undefined)
      params.min_price = parseFloat(params.min_price);
    if (params.max_price !== undefined)
      params.max_price = parseFloat(params.max_price);
    if (params.min_duration !== undefined)
      params.min_duration = parseInt(params.min_duration);
    if (params.max_duration !== undefined)
      params.max_duration = parseInt(params.max_duration);
    if (params.min_people !== undefined)
      params.min_people = parseInt(params.min_people);
    if (params.max_people !== undefined)
      params.max_people = parseInt(params.max_people);
    if (params.region !== undefined) params.region = parseInt(params.region);
    if (params.limit !== undefined) params.limit = parseInt(params.limit);
    if (params.offset !== undefined) params.offset = parseInt(params.offset);
    if (params.seller_id !== undefined)
      params.seller_id = parseInt(params.seller_id);

    if (params.destination) {
      if (!Array.isArray(params.destination)) {
        params.destination = [params.destination];
      }
    }

    if (params.departure_date && params.nearby_days === undefined) {
      params.nearby_days = 3;
    }

    return params;
  }

  static buildSearchQuery(params) {
    const values = [];
    const conditions = [];
    const paramMap = {};
    let paramIndex = 1;

    let baseQuery = `
      WITH tour_search AS (
        SELECT
          t.tour_id,
          t.seller_id,
          t.title,
          t.duration,
          t.departure_location,
          t.description,
          t.destination,
          t.region,
          t.itinerary,
          t.max_participants,
          t.availability AS tour_availability,
          t.embedding,
          d.departure_id,
          d.start_date,
          d.price_adult,
          d.price_child_120_140,
          d.price_child_100_120,
          d.availability AS departure_availability,
          CAST(substring(t.duration from '([0-9]+)') AS INTEGER) AS duration_days
    `;

    if (params.departure_date) {
      baseQuery += `,
          ABS(d.start_date - CAST($${paramIndex} AS DATE)) AS days_from_target
      `;
      values.push(params.departure_date);
      paramMap.departure_date = paramIndex++;
    }

    baseQuery += `
        FROM
          Tour t
        JOIN
          Departure d ON t.tour_id = d.tour_id
        WHERE 1=1
    `;

    conditions.push(`t.availability = true`);
    conditions.push(`d.availability = true`);

    if (params.region !== undefined) {
      conditions.push(`t.region = $${paramIndex}`);
      values.push(params.region);
      paramMap.region = paramIndex++;
    }

    if (params.destination && params.destination.length > 0) {
      conditions.push(`t.destination && $${paramIndex}::TEXT[]`);
      values.push(params.destination);
      paramMap.destination = paramIndex++;
    }

    if (params.departure_location !== undefined) {
      conditions.push(`t.departure_location ILIKE $${paramIndex}`);
      values.push(`%${params.departure_location}%`);
      paramMap.departure_location = paramIndex++;
    }

    if (params.seller_id !== undefined) {
      conditions.push(`t.seller_id = $${paramIndex}`);
      values.push(params.seller_id);
      paramMap.seller_id = paramIndex++;
    }

    if (params.min_price !== undefined && !isNaN(params.min_price)) {
      conditions.push(`d.price_adult >= $${paramIndex}`);
      values.push(params.min_price);
      paramMap.min_price = paramIndex++;
    }

    if (params.max_price !== undefined && !isNaN(params.max_price)) {
      conditions.push(`d.price_adult <= $${paramIndex}`);
      values.push(params.max_price);
      paramMap.max_price = paramIndex++;
    }

    if (params.min_duration !== undefined && !isNaN(params.min_duration)) {
      conditions.push(
        `CAST(substring(t.duration from '([0-9]+)') AS INTEGER) >= $${paramIndex}`
      );
      values.push(params.min_duration);
      paramMap.min_duration = paramIndex++;
    }

    if (params.max_duration !== undefined && !isNaN(params.max_duration)) {
      conditions.push(
        `CAST(substring(t.duration from '([0-9]+)') AS INTEGER) <= $${paramIndex}`
      );
      values.push(params.max_duration);
      paramMap.max_duration = paramIndex++;
    }

    if (params.min_people !== undefined && !isNaN(params.min_people)) {
      conditions.push(`t.max_participants >= $${paramIndex}`);
      values.push(params.min_people);
      paramMap.min_people = paramIndex++;
      console.log(
        `Added condition: t.max_participants >= ${params.min_people}`
      );
    }

    console.log(`Search conditions: ${conditions.join(' AND ')}`);
    console.log(`Search values: ${values.join(', ')}`);

    if (params.departure_date) {
      if (params.nearby_days !== undefined) {
        values.push(params.nearby_days);
        paramMap.nearby_days = paramIndex++;
        conditions.push(`(
          d.start_date = CAST($${paramMap.departure_date} AS DATE) OR
          ABS(d.start_date - CAST($${paramMap.departure_date} AS DATE)) <= $${paramMap.nearby_days}
        )`);
      } else {
        conditions.push(
          `d.start_date = CAST($${paramMap.departure_date} AS DATE)`
        );
      }
    } else {
      conditions.push(`d.start_date >= CURRENT_DATE`);
    }

    baseQuery += conditions.map((c) => ` AND ${c}`).join('');
    baseQuery += `
      )
    `;

    let query = `${baseQuery}
      SELECT DISTINCT ON (ts.tour_id)
        ts.*
      FROM
        tour_search ts
      ORDER BY
        ts.tour_id
    `;

    if (params.departure_date) {
      query = `${baseQuery}
        SELECT DISTINCT ON (ts.tour_id)
          ts.*
        FROM
          tour_search ts
        ORDER BY
          ts.tour_id,
          CASE WHEN ts.start_date = CAST($${paramMap.departure_date} AS DATE) THEN 0 ELSE 1 END,
          ts.days_from_target,
          ts.start_date
      `;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT t.tour_id) as count
      FROM Tour t
      JOIN Departure d ON t.tour_id = d.tour_id
      WHERE ${conditions.join(' AND ')}
    `;

    return { query, countQuery, values };
  }

  static async enrichToursWithAdditionalData(tours) {
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

      if (!tour.next_departure_id && tour.tour_availability) {
        const nextDeparture = await this.getNextAvailableDeparture(
          tour.tour_id
        );
        if (nextDeparture) {
          tour.next_departure_adult_price = nextDeparture.price_adult;
          tour.next_departure_id = nextDeparture.departure_id;
          tour.next_departure_date = nextDeparture.start_date;
        }
      }

      if (tour.start_date) {
        tour.start_date = formatDateToLocal(tour.start_date);
      }
      if (tour.next_departure_date) {
        tour.next_departure_date = formatDateToLocal(tour.next_departure_date);
      }
    }

    return tours;
  }

  static async getNextAvailableDeparture(tourId) {
    const query = `
      SELECT * FROM Departure
      WHERE tour_id = $1
        AND availability = true
        AND start_date >= CURRENT_DATE
      ORDER BY start_date
      LIMIT 1
    `;

    const result = await pool.query(query, [tourId]);
    if (result.rows.length > 0) {
      const departure = result.rows[0];
      if (departure.start_date) {
        departure.start_date = formatDateToLocal(departure.start_date);
      }
      return departure;
    }
    return null;
  }

  static getDurationRanges() {
    return ['1-3 ngày', '3-5 ngày', '5-7 ngày', '7+ ngày'];
  }

  static getPeopleRanges() {
    return ['1 người', '2 người', '3-5 người', '5+ người'];
  }
}

export default TourService;
