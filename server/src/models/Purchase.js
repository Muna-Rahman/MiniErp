import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: [0.0001, "Quantity must be greater than 0"] },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, "At least one item is required"] },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["paid", "due"], default: "paid" },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
