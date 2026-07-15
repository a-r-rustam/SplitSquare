const express = require("express");
const router = express.Router();
const {
  createExpense,
  getGroupExpenses,
  getGroupBalances,
  deleteExpense,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createExpenseSchema } = require("../utils/schemas/expenseSchemas");

router.use(protect);

router.post("/", validate(createExpenseSchema), createExpense);
router.get("/group/:groupId", getGroupExpenses);
router.get("/group/:groupId/balances", getGroupBalances);
router.delete("/:id", deleteExpense);

module.exports = router;