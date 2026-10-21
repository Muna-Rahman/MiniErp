import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { connectDB } from "./config/db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import productRoutes from "./routes/products.js";
import supplierRoutes from "./routes/suppliers.js";
import expenseRoutes from "./routes/expenses.js";
import purchaseRoutes from "./routes/purchases.js";
import saleRoutes from "./routes/sales.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Better Auth must be mounted BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Everything below needs a signed-in user
app.use("/api", requireAuth);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Central error handler: validation, duplicate keys, bad ids and our own httpError
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res.status(409).json({ message: `Duplicate ${field}: it already exists` });
  }
  if (err.name === "CastError") return res.status(400).json({ message: `Invalid ${err.path}` });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? "Something went wrong on the server" : err.message });
});

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
