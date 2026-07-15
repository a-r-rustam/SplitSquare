const Expense = require("../models/Expense");
const Group = require("../models/Group");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../middleware/errorHandler");
const { calculateEqualSplit, validateCustomSplit } = require("../utils/splitCalculator");

async function assertGroupMember(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  const isMember = group.members.some((m) => m.toString() === userId.toString());
  if (!isMember) throw new AppError("You are not a member of this group", 403);
  return group;
}

const createExpense = asyncHandler(async (req, res) => {
  const { group: groupId, description, amount, category, splitType, splits } = req.body;

  const group = await assertGroupMember(groupId, req.user._id);

  let finalSplits;

  if (splitType === "custom") {
    if (!splits || splits.length === 0) {
      throw new AppError("Custom split requires a splits array", 400);
    }
    if (!validateCustomSplit(amount, splits)) {
      throw new AppError("Custom split amounts must add up to the total expense amount", 400);
    }
    finalSplits = splits;
  } else {
    const memberIds = group.members.map((m) => m.toString());
    finalSplits = calculateEqualSplit(amount, memberIds);
  }

  const expense = await Expense.create({
    group: groupId,
    paidBy: req.user._id,
    description,
    amount,
    category: category || "other",
    splitType,
    splits: finalSplits,
  });

  const populated = await Expense.findById(expense._id)
    .populate("paidBy", "name email")
    .populate("splits.user", "name email");

  res.status(201).json({ success: true, expense: populated });
});

const getGroupExpenses = asyncHandler(async (req, res) => {
  await assertGroupMember(req.params.groupId, req.user._id);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { group: req.params.groupId };

  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.search) {
    filter.description = { $regex: req.query.search, $options: "i" };
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate("paidBy", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  res.json({
    success: true,
    expenses,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  });
});

const getGroupBalances = asyncHandler(async (req, res) => {
  const group = await assertGroupMember(req.params.groupId, req.user._id);

  const expenses = await Expense.find({ group: req.params.groupId });

  const balances = {};
  group.members.forEach((m) => { balances[m.toString()] = 0; });

  expenses.forEach((expense) => {
    const payerId = expense.paidBy.toString();
    expense.splits.forEach((split) => {
      const owerId = split.user.toString();
      if (owerId === payerId) return;
      balances[owerId] = (balances[owerId] || 0) - split.amountOwed;
      balances[payerId] = (balances[payerId] || 0) + split.amountOwed;
    });
  });

  const result = Object.entries(balances).map(([userId, amount]) => ({
    user: userId,
    balance: Math.round(amount * 100) / 100,
  }));

  res.json({ success: true, balances: result });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new AppError("Expense not found", 404);

  if (expense.paidBy.toString() !== req.user._id.toString()) {
    throw new AppError("Only the person who added this expense can delete it", 403);
  }

  await Expense.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Expense deleted" });
});

module.exports = { createExpense, getGroupExpenses, getGroupBalances, deleteExpense };