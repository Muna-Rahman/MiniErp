"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { money, dateTime } from "@/lib/format";
import { Window, Button, Field, Loading, Empty, Message, DataTable, Badge } from "@/components/retro";

// One component powers both flows:
//   purchase -> ADDS stock   (supplier, unit cost)
//   sale     -> REDUCES stock (customer, unit price, blocked when stock is not enough)
const CONFIG = {
  purchase: {
    icon: "🧾",
    formTitle: "New Purchase Order",
    historyTitle: "Purchase History",
    endpoint: "/purchases",
    priceKey: "unitCost",
    priceLabel: "Unit cost",
    defaultPrice: (p) => p.costPrice,
    submit: "Receive stock",
    done: (r) => `Purchase ${r.number} saved. Stock was increased.`,
  },
  sale: {
    icon: "🛒",
    formTitle: "New Sale",
    historyTitle: "Sales History",
    endpoint: "/sales",
    priceKey: "unitPrice",
    priceLabel: "Unit price",
    defaultPrice: (p) => p.salePrice,
    submit: "Checkout",
    done: (r) => `Sale ${r.number} saved. Stock was reduced.`,
  },
};

const blankLine = () => ({ product: "", quantity: 1, price: 0 });

export default function TransactionPage({ kind }) {
  const cfg = CONFIG[kind];
  const isSale = kind === "sale";

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [party, setParty] = useState("");
  const [status, setStatus] = useState("paid");
  const [lines, setLines] = useState([blankLine()]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // products + suppliers feed the form (and show fresh stock levels)
  const loadLookups = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api("/products"), isSale ? [] : api("/suppliers")]);
      setProducts(p);
      setSuppliers(s);
    } catch (e) {
      setLoadError(e.message);
    }
  }, [isSale]);

  // history list honours the search box and the payment filter
  const loadHistory = useCallback(async () => {
    try {
      setLoadError("");
      const params = new URLSearchParams({ q, status: statusFilter });
      setHistory(await api(`${cfg.endpoint}?${params}`));
    } catch (e) {
      setLoadError(e.message);
      setHistory((h) => h ?? []);
    }
  }, [cfg.endpoint, q, statusFilter]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    const t = setTimeout(loadHistory, 250);
    return () => clearTimeout(t);
  }, [loadHistory]);

  const load = () => Promise.all([loadLookups(), loadHistory()]);

  async function markPaid(row) {
    try {
      await api(`${cfg.endpoint}/${row._id}/pay`, { method: "PATCH" });
      setOk(`${row.number} marked as paid.`);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  const byId = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  // Client-side checks (the server enforces the same rules)
  const problems = lines.map((l) => {
    if (!l.product) return "Choose a product";
    if (!(Number(l.quantity) > 0)) return "Quantity must be greater than 0";
    if (Number(l.price) < 0) return "Price is invalid";
    if (isSale) {
      const used = lines.filter((x) => x.product === l.product).reduce((s, x) => s + Number(x.quantity || 0), 0);
      const stock = byId.get(l.product)?.stock ?? 0;
      if (used > stock) return `Only ${stock} in stock`;
    }
    return "";
  });
  const total = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.price || 0), 0);
  const hasProblem = problems.some(Boolean);

  const updateLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const pickProduct = (i, id) => updateLine(i, { product: id, price: id ? cfg.defaultPrice(byId.get(id)) || 0 : 0 });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    if (hasProblem) return setError("Fix the highlighted lines first.");
    setSaving(true);
    try {
      const items = lines.map((l) => ({ product: l.product, quantity: Number(l.quantity), [cfg.priceKey]: Number(l.price) }));
      const body = isSale ? { customerName: party, items, paymentStatus: status } : { supplier: party || undefined, items, paymentStatus: status };
      const result = await api(cfg.endpoint, { method: "POST", body });
      setOk(cfg.done(result));
      setLines([blankLine()]);
      setParty("");
      setStatus("paid");
      await load(); // refresh history and the new stock levels
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "number", label: "Ref" },
    { key: "createdAt", label: "Date", render: (r) => dateTime(r.createdAt) },
    { key: "party", label: isSale ? "Customer" : "Supplier", render: (r) => (isSale ? r.customerName : r.supplier?.name || "-") },
    { key: "items", label: "Items", render: (r) => r.items.map((i) => `${i.name} x${i.quantity}`).join(", ") },
    { key: "total", label: "Total", align: "num", render: (r) => money(r.total) },
    { key: "paymentStatus", label: "Payment", render: (r) => <Badge tone={r.paymentStatus === "paid" ? "ok" : "warn"}>{r.paymentStatus}</Badge> },
  ];

  return (
    <>
      <Window title={cfg.formTitle} icon={cfg.icon}>
        {error && <Message kind="error" onClose={() => setError("")}>{error}</Message>}
        {ok && <Message kind="success" onClose={() => setOk("")}>{ok}</Message>}
        {loadError && <Message kind="error">{loadError}</Message>}

        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <Field label={isSale ? "Customer" : "Supplier"}>
              {isSale ? (
                <input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Walk-in customer" />
              ) : (
                <select value={party} onChange={(e) => setParty(e.target.value)}>
                  <option value="">- choose supplier -</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Payment">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="paid">Paid</option>
                <option value="due">Due (pay later)</option>
              </select>
            </Field>
          </div>

          <div className="line line-head">
            <span>Product</span><span>Qty</span><span>{cfg.priceLabel}</span><span style={{ textAlign: "right" }}>Subtotal</span><span />
          </div>
          {lines.map((l, i) => (
            <div className="line" key={i}>
              <select value={l.product} onChange={(e) => pickProduct(i, e.target.value)} aria-label="Product">
                <option value="">- choose product -</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} (stock {p.stock})</option>
                ))}
              </select>
              <input type="number" min="0" step="any" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} aria-label="Quantity" />
              <input type="number" min="0" step="any" value={l.price} onChange={(e) => updateLine(i, { price: e.target.value })} aria-label={cfg.priceLabel} />
              <span className="sub">{money(Number(l.quantity || 0) * Number(l.price || 0))}</span>
              <Button size="small" variant="danger" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} aria-label="Remove line">x</Button>
              {l.product && problems[i] && <div className="line-error">⚠ {problems[i]}</div>}
            </div>
          ))}

          <Button size="small" onClick={() => setLines((ls) => [...ls, blankLine()])}>+ Add line</Button>

          <div className="total-bar sunken">
            <span>TOTAL</span>
            <b>{money(total)}</b>
            <Button variant="primary" type="submit" disabled={saving || hasProblem}>
              {saving ? "Saving..." : cfg.submit}
            </Button>
          </div>
        </form>
      </Window>

      <Window
        title={cfg.historyTitle}
        icon="📜"
        toolbar={
          <>
            <input className="grow" placeholder={isSale ? "Search invoice or customer..." : "Search purchase number..."} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
            <select style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by payment">
              <option value="">All payments</option>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
            </select>
          </>
        }
      >
        {history === null ? (
          <Loading />
        ) : history.length === 0 ? (
          <Empty text={q || statusFilter ? "Nothing matches your search or filter." : `No ${isSale ? "sales" : "purchases"} recorded yet.`} />
        ) : (
          <DataTable
            columns={columns}
            rows={history}
            actions={(row) =>
              row.paymentStatus === "due" ? (
                <Button size="small" onClick={() => markPaid(row)}>Mark paid</Button>
              ) : null
            }
          />
        )}
      </Window>
    </>
  );
}