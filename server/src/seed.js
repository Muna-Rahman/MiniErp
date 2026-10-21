// Run with: npm run seed   (wipes ERP collections and loads realistic demo data)
import "dotenv/config";
import { auth, db } from "./lib/auth.js";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";
import Supplier from "./models/Supplier.js";
import Purchase from "./models/Purchase.js";
import Sale from "./models/Sale.js";
import Expense from "./models/Expense.js";

const DEMO = { name: "Demo Admin", email: "admin@minierp.dev", password: "admin12345" };
const daysAgo = (n, hour = 11) => {
  const d = new Date(Date.now() - n * 864e5);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// tiny deterministic random so the demo data looks the same every run
let seed = 7;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

async function main() {
  await connectDB();

  try {
    await auth.api.signUpEmail({ body: DEMO });
    console.log(`Created demo user ${DEMO.email} / ${DEMO.password}`);
  } catch {
    console.log("Demo user already exists, skipping");
  }

  await Promise.all([Product.deleteMany(), Supplier.deleteMany(), Purchase.deleteMany(), Sale.deleteMany(), Expense.deleteMany()]);

  const suppliers = await Supplier.insertMany([
    { name: "Meghna Agro Traders", phone: "01711-000111", email: "sales@meghnaagro.example", address: "Kazir Bazar, Sylhet" },
    { name: "Sylhet Tea House Ltd", phone: "01822-000222", email: "orders@sylhettea.example", address: "Zindabazar, Sylhet" },
    { name: "Dhaka Household Supplies", phone: "01933-000333", email: "b2b@dhakahousehold.example", address: "Mouchak, Dhaka" },
  ]);

  const defs = [
    ["Miniket Rice 25kg", "RICE-25", "Grocery", "sack", 1650, 1850, 20, 0, 80],
    ["Soybean Oil 5L", "OIL-5L", "Grocery", "bottle", 780, 860, 25, 0, 24],
    ["Sugar 50kg", "SUG-50", "Grocery", "sack", 5900, 6300, 5, 0, 18],
    ["Red Lentil 30kg", "DAL-30", "Grocery", "sack", 3300, 3650, 8, 0, 30],
    ["Premium Tea 1kg", "TEA-1K", "Beverages", "pack", 420, 520, 30, 1, 120],
    ["Green Tea 500g", "GTEA-500", "Beverages", "pack", 310, 395, 20, 1, 45],
    ["Instant Noodles Carton", "NDL-CTN", "Snacks", "carton", 540, 640, 15, 2, 50],
    ["Laundry Detergent 1kg", "DET-1K", "Household", "pack", 165, 210, 40, 2, 150],
    ["Bath Soap Carton", "SOAP-CTN", "Household", "carton", 1250, 1450, 10, 2, 28],
    ["Mineral Water 12-pack", "WTR-12", "Beverages", "pack", 230, 290, 30, 2, 60],
  ];

  const products = await Product.insertMany(
    defs.map(([name, sku, category, unit, costPrice, salePrice, reorderLevel, s]) => ({
      name, sku, category, unit, costPrice, salePrice, reorderLevel, stock: 0, supplier: suppliers[s]._id,
    }))
  );

  // Opening purchases: one per supplier, receiving stock
  for (let s = 0; s < suppliers.length; s++) {
    const items = defs
      .map((d, i) => ({ d, p: products[i] }))
      .filter(({ d }) => d[7] === s)
      .map(({ d, p }) => ({ product: p._id, name: p.name, quantity: d[8], unitCost: d[4] }));
    await Purchase.create({
      number: `PO-SEED${s + 1}`,
      supplier: suppliers[s]._id,
      items,
      total: items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
      paymentStatus: s === 2 ? "due" : "paid",
      createdAt: daysAgo(9 - s),
    });
    await Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
  }

  // Sales over the last 7 days (never more than available stock)
  const customers = ["Karim Store", "Sylhet Fresh Mart", "Rahman Brothers", "Noor Grocery", "City Hypermart"];
  for (let n = 0; n < 16; n++) {
    const fresh = await Product.find();
    const chosen = [...fresh].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3));
    const items = [];
    for (const p of chosen) {
      const qty = Math.min(p.stock, 1 + Math.floor(rand() * 6));
      if (qty > 0) items.push({ product: p._id, name: p.name, quantity: qty, unitPrice: p.salePrice, unitCost: p.costPrice });
    }
    if (!items.length) continue;
    await Sale.create({
      number: `INV-SEED${String(n + 1).padStart(2, "0")}`,
      customerName: customers[n % customers.length],
      items,
      total: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      cost: items.reduce((s, i) => s + i.quantity * i.unitCost, 0),
      paymentStatus: n % 5 === 4 ? "due" : "paid",
      createdAt: daysAgo(6 - Math.floor(n / 3), 10 + (n % 6)),
    });
    await Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } })));
  }

  await Expense.insertMany([
    { title: "Shop rent", category: "Rent", amount: 18000, date: daysAgo(8) },
    { title: "Electricity bill", category: "Utilities", amount: 4200, date: daysAgo(6) },
    { title: "Delivery van fuel", category: "Transport", amount: 3500, date: daysAgo(4) },
    { title: "Staff wages (weekly)", category: "Salary", amount: 9000, date: daysAgo(3) },
    { title: "Packaging material", category: "Supplies", amount: 1800, date: daysAgo(2) },
    { title: "Mobile & internet", category: "Utilities", amount: 1200, date: daysAgo(1) },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
