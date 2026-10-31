import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 'Validation error', formattedErrors, 422);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
    return errorResponse(res, `Unique constraint violation: ${fields} already exists.`, [err.message], 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found.', [err.message], 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, process.env.NODE_ENV === 'development' ? [err.stack] : [], statusCode);
};
