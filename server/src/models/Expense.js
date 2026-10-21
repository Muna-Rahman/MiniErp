import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    category: { type: String, trim: true, default: "General" },
    amount: { type: Number, required: [true, "Amount is required"], min: [0.01, "Amount must be greater than 0"] },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
