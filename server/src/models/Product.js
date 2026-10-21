import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    sku: { type: String, required: [true, "SKU is required"], trim: true, uppercase: true, unique: true },
    category: { type: String, trim: true, default: "General" },
    unit: { type: String, trim: true, default: "pcs" },
    costPrice: { type: Number, required: [true, "Cost price is required"], min: [0, "Cost cannot be negative"], default: 0 },
    salePrice: { type: Number, required: [true, "Sale price is required"], min: [0, "Price cannot be negative"], default: 0 },
    stock: { type: Number, default: 0, min: [0, "Stock cannot go below zero"] },
    reorderLevel: { type: Number, default: 10, min: [0, "Reorder level cannot be negative"] },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
