/**
 * Standard API Success Response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any} data
 * @param {number} statusCode
 */
export const successResponse = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard API Error Response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any[]} errors
 * @param {number} statusCode
 */
export const errorResponse = (res, message = 'Something went wrong', errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
};
