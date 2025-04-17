/**
 * Pagination utility functions
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
export const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Add pagination to SQL query
 * @param {string} query - SQL query
 * @param {number} limit - Number of records per page
 * @param {number} offset - Offset for pagination
 * @returns {string} SQL query with pagination
 */
export const addPaginationToQuery = (query, limit, offset) => {
  return `${query} LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Create pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Number of records per page
 * @param {number} totalItems - Total number of items
 * @returns {Object} Pagination metadata
 */
export const createPaginationMetadata = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage
  };
};
