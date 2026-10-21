"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Window, Button, Field, Loading, Empty, Message, DataTable } from "@/components/retro";

const idOf = (v) => (v && typeof v === "object" ? v._id : v ?? "");

/**
 * Generic list + search + create/edit/delete page.
 * fields:  [{ name, label, type: "text"|"number"|"date"|"select", required?, options?, optionsFrom? }]
 * columns: [{ key, label, render?, align? }]
 */
export default function ResourcePage({ title, icon, endpoint, columns, fields, singular = "record", searchPlaceholder = "Search..." }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [editor, setEditor] = useState(null); // { id, values }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [options, setOptions] = useState({});

  const load = useCallback(async () => {
    try {
      setError("");
      setRows(await api(`${endpoint}?q=${encodeURIComponent(q)}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fields
      .filter((f) => f.optionsFrom)
      .forEach(async (f) => {
        try {
          const list = await api(f.optionsFrom);
          setOptions((o) => ({ ...o, [f.name]: list.map((x) => ({ value: x._id, label: x.name })) }));
        } catch {}
      });
  }, [fields]);

  const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.type === "date" ? new Date().toISOString().slice(0, 10) : ""]));

  function openEdit(row) {
    const values = Object.fromEntries(
      fields.map((f) => {
        let v = idOf(row[f.name]);
        if (f.type === "date" && v) v = String(v).slice(0, 10);
        return [f.name, v ?? ""];
      })
    );
    setFormError("");
    setEditor({ id: row._id, values });
  }

  async function save(e) {
    e.preventDefault();
    setFormError("");
    const body = {};
    for (const f of fields) {
      const v = editor.values[f.name];
      if (f.required && (v === "" || v == null)) return setFormError(`${f.label} is required.`);
      if (v === "") {
        if (editor.id && f.type === "select") body[f.name] = null;
        continue;
      }
      body[f.name] = f.type === "number" ? Number(v) : v;
    }
    setSaving(true);
    try {
      await api(editor.id ? `${endpoint}/${editor.id}` : endpoint, { method: editor.id ? "PUT" : "POST", body });
      setEditor(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete this ${singular}? This cannot be undone.`)) return;
    try {
      await api(`${endpoint}/${row._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const setValue = (name) => (e) => setEditor((ed) => ({ ...ed, values: { ...ed.values, [name]: e.target.value } }));

  return (
    <>
      {editor && (
        <Window title={`${editor.id ? "Edit" : "New"} ${singular}`} icon="📝">
          {formError && <Message kind="error">{formError}</Message>}
          <form onSubmit={save}>
            <div className="form-grid">
              {fields.map((f) => (
                <Field key={f.name} label={`${f.label}${f.required ? " *" : ""}`}>
                  {f.type === "select" ? (
                    <select value={editor.values[f.name]} onChange={setValue(f.name)}>
                      <option value="">- none -</option>
                      {(f.options || options[f.name] || []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      step={f.type === "number" ? "any" : undefined}
                      min={f.type === "number" ? 0 : undefined}
                      value={editor.values[f.name]}
                      onChange={setValue(f.name)}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => setEditor(null)}>Cancel</Button>
            </div>
          </form>
        </Window>
      )}

      <Window
        title={title}
        icon={icon}
        toolbar={
          <>
            <input className="grow" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
            <Button variant="primary" onClick={() => { setFormError(""); setEditor({ id: null, values: blank() }); }}>
              + New {singular}
            </Button>
          </>
        }
      >
        {error && <Message kind="error" onClose={() => setError("")}>{error}</Message>}
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty text={q ? `No ${singular} matches "${q}".` : `No ${singular} yet. Click "New ${singular}" to add one.`} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            actions={(row) => (
              <>
                <Button size="small" onClick={() => openEdit(row)}>Edit</Button>{" "}
                <Button size="small" variant="danger" onClick={() => remove(row)}>Delete</Button>
              </>
            )}
          />
        )}
      </Window>
    </>
  );
}
