"use client";

import ResourcePage from "@/components/ResourcePage";
import { Badge } from "@/components/retro";
import { money } from "@/lib/format";

const fields = [
  { name: "name", label: "Name", required: true },
  { name: "sku", label: "SKU", required: true },
  { name: "category", label: "Category" },
  { name: "unit", label: "Unit" },
  { name: "costPrice", label: "Cost price", type: "number", required: true },
  { name: "salePrice", label: "Sale price", type: "number", required: true },
  { name: "reorderLevel", label: "Reorder level", type: "number" },
  { name: "supplier", label: "Supplier", type: "select", optionsFrom: "/suppliers" },
];

const columns = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Product" },
  { key: "category", label: "Category" },
  { key: "supplier", label: "Supplier", render: (r) => r.supplier?.name || "-" },
  { key: "costPrice", label: "Cost", align: "num", render: (r) => money(r.costPrice) },
  { key: "salePrice", label: "Price", align: "num", render: (r) => money(r.salePrice) },
  {
    key: "stock",
    label: "Stock",
    align: "num",
    render: (r) => (
      <>
        {r.stock} {r.unit}{" "}
        {r.stock <= 0 ? <Badge tone="bad">out</Badge> : r.stock <= r.reorderLevel ? <Badge tone="warn">low</Badge> : null}
      </>
    ),
  },
];

export default function ProductsPage() {
  return (
    <ResourcePage
      title="Products"
      icon="📦"
      endpoint="/products"
      singular="product"
      searchPlaceholder="Search name, SKU or category..."
      fields={fields}
      columns={columns}
    />
  );
}
