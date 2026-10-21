import { Router } from "express";
import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import { cleanItems, escapeRegex, httpError, makeNumber, round2 } from "../lib/http.js";

const router = Router();

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const filter = q ? { number: new RegExp(escapeRegex(q), "i") } : {};
  res.json(await Purchase.find(filter).populate("supplier", "name").sort({ createdAt: -1 }).limit(100));
});

// Purchase: record the order, then ADD the received quantity to each product's stock.
router.post("/", async (req, res) => {
  const { supplier, items, paymentStatus = "paid", note } = req.body;
  const lines = cleanItems(items, "unitCost");

  const products = await Product.find({ _id: { $in: lines.map((l) => l.product) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  lines.forEach((l, i) => {
    if (!byId.has(String(l.product))) throw httpError(400, `Line ${i + 1}: product not found`);
  });

  const purchase = await Purchase.create({
    number: makeNumber("PO"),
    supplier: supplier || undefined,
    items: lines.map((l) => ({ ...l, name: byId.get(String(l.product)).name })),
    total: round2(lines.reduce((s, l) => s + l.quantity * l.unitCost, 0)),
    paymentStatus,
    note,
  });

  await Promise.all(
    lines.map((l) =>
      Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity }, $set: { costPrice: l.unitCost } })
    )
  );

  res.status(201).json(purchase);
});

export default router;
