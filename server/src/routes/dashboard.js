import { Router } from "express";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Purchase from "../models/Purchase.js";
import Sale from "../models/Sale.js";
import Expense from "../models/Expense.js";
import { round2 } from "../lib/http.js";

const router = Router();
const TZ = "Asia/Dhaka";
const dayKey = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD

const sumOf = async (Model, field, match = {}) => {
  const [row] = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
  return row?.total || 0;
};

// Every number here is calculated from stored records.
router.get("/", async (req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);

  const [revenue, cogs, purchases, expenses, receivable, payable, productCount, supplierCount, stockAgg, lowStock, recentSales, daily] =
    await Promise.all([
      sumOf(Sale, "total"),
      sumOf(Sale, "cost"),
      sumOf(Purchase, "total"),
      sumOf(Expense, "amount"),
      sumOf(Sale, "total", { paymentStatus: "due" }),
      sumOf(Purchase, "total", { paymentStatus: "due" }),
      Product.countDocuments(),
      Supplier.countDocuments(),
      Product.aggregate([{ $group: { _id: null, value: { $sum: { $multiply: ["$stock", "$costPrice"] } } } }]),
      Product.find({ $expr: { $lte: ["$stock", "$reorderLevel"] } }).sort({ stock: 1 }).limit(8),
      Sale.find().sort({ createdAt: -1 }).limit(6),
      Sale.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, total: { $sum: "$total" } } },
      ]),
    ]);

  const byDay = new Map(daily.map((d) => [d._id, d.total]));
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 864e5));
    last7Days.push({ date: key, total: byDay.get(key) || 0 });
  }

  res.json({
    revenue: round2(revenue),
    cogs: round2(cogs),
    purchases: round2(purchases),
    expenses: round2(expenses),
    profit: round2(revenue - cogs - expenses),
    receivable: round2(receivable),
    payable: round2(payable),
    stockValue: round2(stockAgg[0]?.value || 0),
    productCount,
    supplierCount,
    lowStock,
    recentSales,
    last7Days,
  });
});

export default router;
