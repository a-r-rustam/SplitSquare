const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../utils/schemas/authSchemas");
const { protect } = require("../middleware/auth");

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", protect, getMe);

module.exports = router;
