"use client";

import ResourcePage from "@/components/ResourcePage";

const fields = [
  { name: "name", label: "Name", required: true },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "address", label: "Address" },
];

const columns = [
  { key: "name", label: "Supplier" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
];

export default function SuppliersPage() {
  return (
    <ResourcePage
      title="Suppliers"
      icon="🏭"
      endpoint="/suppliers"
      singular="supplier"
      searchPlaceholder="Search name, phone or email..."
      fields={fields}
      columns={columns}
    />
  );
}
