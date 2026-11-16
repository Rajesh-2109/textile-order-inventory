import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { errMsg } from "../api/axios";
import { useAuth } from "../context/authContext";
import Modal from "./Modal";
import Pagination from "./Pagination";

// List + search + pagination + add/edit modal + delete. Used by Buyers and Products.
export default function ResourcePage({ title, entity, endpoint, columns, fields }) {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { id?, row? }
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(endpoint, { params: { page, limit: 10, search, isActive: active } });
      setRows(data.data);
      setPg(data.pagination);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, active]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const f = {};
    fields.forEach((x) => (f[x.name] = x.type === "file" ? null : x.default ?? ""));
    setForm(f);
    setFormError("");
    setModal({});
  };

  const openEdit = (row) => {
    const f = {};
    fields.forEach((x) => (f[x.name] = x.type === "file" ? null : row[x.name] ?? ""));
    setForm(f);
    setFormError("");
    setModal({ id: row._id, row });
  };

  const buildPayload = () => {
    if (!fields.some((f) => f.type === "file")) {
      const payload = { ...form };
      fields.forEach((x) => {
        if (x.type === "number") payload[x.name] = form[x.name] === "" ? undefined : Number(form[x.name]);
      });
      return payload;
    }
    // has an image -> multipart form data
    const fd = new FormData();
    fields.forEach((x) => {
      const v = form[x.name];
      if (x.type === "file") {
        if (v instanceof File) fd.append(x.name, v);
      } else if (x.type === "number") {
        if (v !== "") fd.append(x.name, v);
      } else {
        fd.append(x.name, v ?? "");
      }
    });
    return fd;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = buildPayload();
      const res = modal.id ? await api.put(`${endpoint}/${modal.id}`, payload) : await api.post(endpoint, payload);
      toast.success(res.data.message);
      setModal(null);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${entity}? (If it is already used in orders it will be deactivated instead)`)) return;
    try {
      const res = await api.delete(`${endpoint}/${row._id}`);
      toast.success(res.data.message);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const activate = async (row) => {
    try {
      await api.put(`${endpoint}/${row._id}`, { isActive: true });
      toast.success(`${entity} activated`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const showActions = can("update") || can("delete");

  return (
    <div>
      <div className="page-head">
        <h1>{title}</h1>
        {can("create") && <button className="btn primary" onClick={openCreate}>+ Add {entity}</button>}
      </div>

      <div className="toolbar">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(input); }}>
          <input placeholder="Search..." value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        <select value={active} onChange={(e) => { setPage(1); setActive(e.target.value); }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={columns.length + 2}>Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={columns.length + 2}>No records found</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r._id}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key] ?? "-"}</td>)}
                <td><span className={`badge ${r.isActive ? "ok" : "off"}`}>{r.isActive ? "Active" : "Inactive"}</span></td>
                {showActions && (
                  <td className="actions">
                    {can("update") && <button className="btn" onClick={() => openEdit(r)}>Edit</button>}
                    {can("update") && !r.isActive && <button className="btn" onClick={() => activate(r)}>Activate</button>}
                    {can("delete") && <button className="btn danger" onClick={() => remove(r)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pg} onPage={setPage} />

      {modal && (
        <Modal title={`${modal.id ? "Edit" : "Add"} ${entity}`} onClose={() => setModal(null)}>
          <form onSubmit={submit} className="form">
            {formError && <div className="alert error">{formError}</div>}
            {fields.map((f) => (
              <label key={f.name}>
                {f.label}
                {f.type === "select" ? (
                  <select value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea rows="3" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : f.type === "file" ? (
                  <>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm({ ...form, [f.name]: e.target.files[0] || null })} />
                    <small>JPG / PNG / WEBP, max 2MB{modal.row?.[f.name] ? " · leave empty to keep the current image" : ""}</small>
                  </>
                ) : (
                  <input
                    type={f.type || "text"}
                    required={f.required}
                    min={f.type === "number" ? 0 : undefined}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
