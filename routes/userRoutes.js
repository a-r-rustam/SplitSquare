const express = require("express");
const router = express.Router();

// Placeholder — real group CRUD routes coming next
router.get("/", (req, res) => {
  res.json({ success: true, message: "User routes placeholder" });
});

module.exports = router;
