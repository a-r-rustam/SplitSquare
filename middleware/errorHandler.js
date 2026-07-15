// Custom error class so we can throw errors with a specific HTTP status code
// e.g. throw new AppError("Group not found", 404)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 404 handler — runs when no route matched the request
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error); // passes the error to errorHandler below
};

// Central error handler — MUST have 4 params (err, req, res, next) for Express
// to recognize it as an error-handling middleware. This is registered LAST
// in server.js, after all routes, so any error thrown or passed via next(err)
// anywhere in the app ends up here instead of crashing the server.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // Mongoose bad ObjectId (e.g. /api/groups/123 with an invalid id format)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Mongoose duplicate key (e.g. registering with an email that already exists)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
  }

  // Mongoose validation error (schema rules failed)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    // stack trace only in development — never leak internals in production
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = { AppError, notFound, errorHandler };
