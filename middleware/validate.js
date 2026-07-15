const { AppError } = require("./errorHandler");

// Generic middleware factory: pass it a Zod schema, get back Express middleware
// that validates req.body against it BEFORE the request reaches the controller.
// Usage: router.post('/register', validate(registerSchema), registerUser)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(message, 400);
  }
  req.body = result.data; // use the parsed/sanitized data going forward
  next();
};

module.exports = validate;
