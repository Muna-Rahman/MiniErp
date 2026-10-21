import { Router } from "express";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import { cleanItems, escapeRegex, httpError, makeNumber, round2 } from "../lib/http.js";

const router = Router();

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const rx = new RegExp(escapeRegex(q), "i");
  const filter = q ? { $or: [{ number: rx }, { customerName: rx }] } : {};
  res.json(await Sale.find(filter).sort({ createdAt: -1 }).limit(100));
});

// Sale: atomically take stock for every line (only if enough is available),
// then save the sale. If anything fails, put the stock back.
router.post("/", async (req, res) => {
  const { customerName, items, paymentStatus = "paid", paymentMethod = "cash" } = req.body;
  const lines = cleanItems(items, "unitPrice");

  const taken = [];
  const saleItems = [];
  try {
    for (const l of lines) {
      const before = await Product.findOneAndUpdate(
        { _id: l.product, stock: { $gte: l.quantity } },
        { $inc: { stock: -l.quantity } },
        { new: false }
      );
      if (!before) {
        const current = await Product.findById(l.product);
        if (!current) throw httpError(400, "Product not found");
        throw httpError(400, `Not enough stock for ${current.name}: only ${current.stock} available`);
      }
      taken.push(l);
      saleItems.push({
        product: before._id,
        name: before.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        unitCost: before.costPrice,
      });
    }

    const sale = await Sale.create({
      number: makeNumber("INV"),
      customerName: customerName?.trim() || "Walk-in customer",
      items: saleItems,
      total: round2(saleItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)),
      cost: round2(saleItems.reduce((s, i) => s + i.quantity * i.unitCost, 0)),
      paymentStatus,
      paymentMethod,
    });
    res.status(201).json(sale);
  } catch (err) {
    await Promise.all(taken.map((l) => Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity } })));
    throw err;
  }
});

export default router;
