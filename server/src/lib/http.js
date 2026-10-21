import mongoose from "mongoose";

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const makeNumber = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Validates the line items sent by the purchase / sale forms.
export function cleanItems(raw, priceKey) {
  if (!Array.isArray(raw) || raw.length === 0) throw httpError(400, "Add at least one item");
  return raw.map((it, i) => {
    const quantity = Number(it.quantity);
    const price = Number(it[priceKey]);
    if (!mongoose.isValidObjectId(it.product)) throw httpError(400, `Line ${i + 1}: choose a product`);
    if (!Number.isFinite(quantity) || quantity <= 0) throw httpError(400, `Line ${i + 1}: quantity must be greater than 0`);
    if (!Number.isFinite(price) || price < 0) throw httpError(400, `Line ${i + 1}: price is invalid`);
    return { product: it.product, quantity, [priceKey]: price };
  });
}
