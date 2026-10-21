import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: [0.0001, "Quantity must be greater than 0"] },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 }, // snapshot of cost at sale time, used for profit
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    customerName: { type: String, trim: true, default: "Walk-in customer" },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, "At least one item is required"] },
    total: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["paid", "due"], default: "paid" },
    paymentMethod: { type: String, enum: ["cash", "stripe"], default: "cash" },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
