'use strict';

/**
 * Build MongoDB skip/limit from page/limit query params
 * @param {number} page
 * @param {number} limit
 * @returns {{ skip: number, limit: number }}
 */
function buildSkipLimit(page, limit) {
  return {
    skip: (page - 1) * limit,
    limit,
  };
}

/**
 * Build pagination metadata object
 * @param {number} total - Total documents matching query
 * @param {number} page
 * @param {number} limit
 */
function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

module.exports = { buildSkipLimit, buildPaginationMeta };
