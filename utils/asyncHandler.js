// Wraps an async controller function so any error it throws (or rejects with)
// is automatically passed to next(err) -> our errorHandler middleware.
// Without this, every controller would need its own try/catch block.
//
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
