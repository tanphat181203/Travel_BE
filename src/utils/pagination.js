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

export const addPaginationToQuery = (query, limit, offset) => {
  return `${query} LIMIT ${limit} OFFSET ${offset}`;
};

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
