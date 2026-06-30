// ============================================================
// FILE: backend/controllers/transactionController.js
// OWNER: Member 2 (Backend Dev)
// RESPONSIBILITY: CRUD logic for transactions
// ============================================================

import Transaction from "../models/Transaction.js"; // Note the explicit .js extension

const getDateRangeFilter = ({ period, startDate, endDate }) => {
  if (startDate || endDate) {
    const range = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    return { date: range };
  }

  if (!period || period === "all") {
    return {};
  }

  const now = new Date();
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "daily":
      break;
    case "weekly":
      start.setDate(now.getDate() - 6);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return {};
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { date: { $gte: start, $lte: end } };
};

const getSortOrder = (sort) => {
  switch (sort) {
    case "date_asc":
      return { date: 1 };
    case "amount_desc":
      return { amount: -1 };
    case "amount_asc":
      return { amount: 1 };
    default:
      return { date: -1 };
  }
};

// @desc    Get all transactions for logged-in user (with filters)
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.auth.userId; // From Clerk middleware
    const { type, category, startDate, endDate, period, search, page = 1, limit = 20, sort } = req.query;

    // Build dynamic filter
    const filter = { userId };
    if (type && type !== "all") filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    Object.assign(filter, getDateRangeFilter({ period, startDate, endDate }));

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(getSortOrder(sort))
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { type, amount, category, description, date, tags } = req.body;

    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      tags,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId }, // Ensure user owns this transaction
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get summary stats (balance, total income, total expense)
// @route   GET /api/summary
// @access  Private
export const getSummary = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { period, startDate, endDate } = req.query;

    const filter = { userId, ...getDateRangeFilter({ period, startDate, endDate }) };

    const result = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    result.forEach((r) => {
      if (r._id === "income") {
        income = r.total;
        incomeCount = r.count;
      }
      if (r._id === "expense") {
        expense = r.total;
        expenseCount = r.count;
      }
    });

    res.json({
      success: true,
      data: {
        balance: income - expense,
        totalIncome: income,
        totalExpense: expense,
        incomeCount,
        expenseCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly breakdown for charts
// @route   GET /api/summary/monthly
// @access  Private
export const getMonthlyBreakdown = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expense breakdown by category (for pie chart)
// @route   GET /api/summary/by-category
// @access  Private
export const getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { period, startDate, endDate } = req.query;

    const filter = {
      userId,
      type: "expense",
      ...getDateRangeFilter({ period, startDate, endDate }),
    };

    const data = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};