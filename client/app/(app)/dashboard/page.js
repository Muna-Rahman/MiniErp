"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, shortDay, dateTime } from "@/lib/format";
import { Window, Stat, Loading, Empty, Message, DataTable, Badge, Button } from "@/components/retro";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setData(await api("/dashboard"));
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <Window title="Dashboard" icon="🖥️">
        <Message kind="error">{error}</Message>
        <Button onClick={load}>Retry</Button>
      </Window>
    );
  }
  if (!data) {
    return (
      <Window title="Dashboard" icon="🖥️">
        <Loading />
      </Window>
    );
  }

  const max = Math.max(...data.last7Days.map((d) => d.total), 1);

  return (
    <>
      <Window title="Business Overview" icon="🖥️" toolbar={<Button size="small" onClick={load}>Refresh</Button>}>
        <div className="stats">
          <Stat label="Revenue" value={money(data.revenue)} />
          <Stat label="Purchases" value={money(data.purchases)} />
          <Stat label="Expenses" value={money(data.expenses)} />
          <Stat label="Profit" value={money(data.profit)} tone={data.profit >= 0 ? "good" : "loss"} />
          <Stat label="Stock value" value={money(data.stockValue)} />
          <Stat label="To receive" value={money(data.receivable)} />
          <Stat label="To pay" value={money(data.payable)} />
          <Stat label="Products" value={data.productCount} />
        </div>
      </Window>

      <Window title="Sales: last 7 days" icon="📊">
        <div className="bars sunken">
          {data.last7Days.map((d) => (
            <div className="bar" key={d.date} title={`${d.date}: ${money(d.total)}`}>
              <span className="val">{d.total ? money(d.total) : ""}</span>
              <div className="fill" style={{ height: `${(d.total / max) * 100}%` }} />
              <small>{shortDay(d.date)}</small>
            </div>
          ))}
        </div>
      </Window>

      <Window title="Low stock alerts" icon="⚠️">
        {data.lowStock.length === 0 ? (
          <Empty icon="✅" text="All products are above their reorder level." />
        ) : (
          <DataTable
            columns={[
              { key: "name", label: "Product" },
              { key: "stock", label: "In stock", align: "num", render: (r) => `${r.stock} ${r.unit}` },
              { key: "reorderLevel", label: "Reorder at", align: "num" },
              { key: "status", label: "Status", render: (r) => <Badge tone={r.stock <= 0 ? "bad" : "warn"}>{r.stock <= 0 ? "out" : "low"}</Badge> },
            ]}
            rows={data.lowStock}
          />
        )}
      </Window>

      <Window title="Recent sales" icon="🛒">
        {data.recentSales.length === 0 ? (
          <Empty text="No sales yet. Record one on the Sales page." />
        ) : (
          <DataTable
            columns={[
              { key: "number", label: "Invoice" },
              { key: "createdAt", label: "Date", render: (r) => dateTime(r.createdAt) },
              { key: "customerName", label: "Customer" },
              { key: "total", label: "Total", align: "num", render: (r) => money(r.total) },
              { key: "paymentStatus", label: "Payment", render: (r) => <Badge tone={r.paymentStatus === "paid" ? "ok" : "warn"}>{r.paymentStatus}</Badge> },
            ]}
            rows={data.recentSales}
          />
        )}
      </Window>
    </>
  );
}
