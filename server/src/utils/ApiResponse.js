'use strict';

class ApiResponse {
  static success(data, message = 'Success', meta = null) {
    const response = { success: true, message, data };
    if (meta) {response.meta = meta;}
    return response;
  }

  static paginated(data, pagination, message = 'Success', meta = null) {
    const response = { success: true, message, data, pagination };
    if (meta) {response.meta = meta;}
    return response;
  }

  static error(message, errors = []) {
    const response = { success: false, message };
    if (errors.length > 0) {response.errors = errors;}
    return response;
  }

  static buildPagination(total, page, limit) {
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
}

module.exports = ApiResponse;
