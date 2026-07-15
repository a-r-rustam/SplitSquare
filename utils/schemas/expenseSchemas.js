const { z } = require("zod");

const splitEntrySchema = z.object({
  user: z.string().min(1, "User id is required"),
  amountOwed: z.number().min(0, "Amount owed cannot be negative"),
});

const createExpenseSchema = z.object({
  group: z.string().min(1, "Group id is required"),
  description: z.string().trim().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z
    .enum(["food", "rent", "utilities", "travel", "entertainment", "shopping", "other"])
    .optional(),
  splitType: z.enum(["equal", "custom"]).default("equal"),
  splits: z.array(splitEntrySchema).optional(),
});

module.exports = { createExpenseSchema };