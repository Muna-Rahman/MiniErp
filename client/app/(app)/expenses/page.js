"use client";

import ResourcePage from "@/components/ResourcePage";
import { money } from "@/lib/format";

const fields = [
  { name: "title", label: "Title", required: true },
  { name: "category", label: "Category" },
  { name: "amount", label: "Amount", type: "number", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "note", label: "Note" },
];

const columns = [
  { key: "date", label: "Date", render: (r) => new Date(r.date).toLocaleDateString("en-GB", { dateStyle: "medium" }) },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount", align: "num", render: (r) => money(r.amount) },
];

export default function ExpensesPage() {
  return (
    <ResourcePage
      title="Expenses"
      icon="💸"
      endpoint="/expenses"
      singular="expense"
      searchPlaceholder="Search title or category..."
      fields={fields}
      columns={columns}
    />
  );
}
