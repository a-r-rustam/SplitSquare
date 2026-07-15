const mongoose = require("mongoose");

// One entry per person involved in the split: how much of the total THEY owe
const splitEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountOwed: { type: Number, required: true },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    category: {
      type: String,
      enum: ["food", "rent", "utilities", "travel", "entertainment", "shopping", "other"],
      default: "other",
    },
    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },
    // Who owes how much of THIS expense (excludes the payer's own share automatically
    // handled in the controller logic, not here)
    splits: [splitEntrySchema],
    receiptUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
