import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

const STATUSES = ["Draft", "Confirmed", "Materials Pending", "In Production", "Quality Check", "Ready to Dispatch", "Dispatched", "Completed", "Cancelled"];
const NEXT = {
  Draft: ["Confirmed", "Cancelled"],
  Confirmed: ["Materials Pending", "In Production", "Cancelled"],
  "Materials Pending": ["In Production", "Cancelled"],
  "In Production": ["Quality Check", "Cancelled"],
  "Quality Check": ["Ready to Dispatch", "In Production"],
  "Ready to Dispatch": ["Dispatched"],
  Dispatched: ["Completed"],
  Completed: [],
  Cancelled: [],
};
const EDITABLE = ["Draft", "Confirmed"];
const DELETABLE = ["Draft", "Cancelled"];
const CLOSED = ["Dispatched", "Completed", "Cancelled"];

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = () => ({ product: "", quantity: 1, unitPrice: 0 });
const emptyForm = () => ({ buyer: "", buyerPONumber: "", orderDate: today(), deliveryDate: "", currency: "INR", notes: "", items: [emptyItem()] });

export default function Orders() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [buyers, setBuyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders", { params: { page, limit: 10, search, status, sort, order: sort === "deliveryDate" ? "asc" : "desc" } });
      setRows(data.data);
      setPg(data.pagination);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  // dropdown data for the order form
  useEffect(() => {
    api.get("/buyers", { params: { limit: 100, isActive: true } }).then((r) => setBuyers(r.data.data)).catch(() => {});
    api.get("/products", { params: { limit: 100, isActive: true } }).then((r) => setProducts(r.data.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError("");
    setModal({});
  };

  const openEdit = (o) => {
    setForm({
      buyer: o.buyer?._id || "",
      buyerPONumber: o.buyerPONumber,
      orderDate: o.orderDate.slice(0, 10),
      deliveryDate: o.deliveryDate.slice(0, 10),
      currency: o.currency,
      notes: o.notes || "",
      items: o.items.map((i) => ({ product: i.product?._id || "", quantity: i.quantity, unitPrice: i.unitPrice })),
    });
    setFormError("");
    setModal({ id: o._id });
  };

  const setItem = (idx, key, value) => {
    const items = form.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it));
    setForm({ ...form, items });
  };

  const formTotal = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        items: form.items.map((i) => ({ product: i.product, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      };
      const res = modal.id ? await api.put(`/orders/${modal.id}`, payload) : await api.post("/orders", payload);
      toast.success(res.data.message || (modal.id ? "Order Updated" : "Order Created"));
      setModal(null);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (o, next) => {
    if (!next || !window.confirm(`Change ${o.orderNumber} to "${next}"?`)) return;
    try {
      await api.put(`/orders/${o._id}/status`, { status: next });
      toast.success(`Status changed to ${next}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete ${o.orderNumber}?`)) return;
    try {
      await api.delete(`/orders/${o._id}`);
      toast.success("Order Deleted");
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const isOverdue = (o) => !CLOSED.includes(o.status) && new Date(o.deliveryDate) < new Date();
  const showActions = can("update") || can("delete");

  return (
    <div>
      <div className="page-head">
        <h1>Orders</h1>
        {can("create") && <button className="btn primary" onClick={openCreate}>+ New Order</button>}
      </div>

      <div className="toolbar">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(input); }}>
          <input placeholder="Order no. / buyer PO" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt">Newest first</option>
          <option value="deliveryDate">Delivery date</option>
          <option value="totalAmount">Amount</option>
        </select>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order No.</th><th>Buyer</th><th>Buyer PO</th><th>Delivery</th><th>Status</th><th>Total</th>{showActions && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7">Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan="7">No orders found</td></tr>}
            {!loading && rows.map((o) => (
              <tr key={o._id}>
                <td>{o.orderNumber}</td>
                <td>{o.buyer?.companyName || "-"}</td>
                <td>{o.buyerPONumber}</td>
                <td className={isOverdue(o) ? "late" : ""}>{o.deliveryDate.slice(0, 10)}{isOverdue(o) && " (overdue)"}</td>
                <td><span className="badge">{o.status}</span></td>
                <td>{o.currency} {o.totalAmount.toFixed(2)}</td>
                {showActions && (
                  <td className="actions">
                    {can("update") && EDITABLE.includes(o.status) && <button className="btn" onClick={() => openEdit(o)}>Edit</button>}
                    {can("update") && NEXT[o.status].length > 0 && (
                      <select value="" onChange={(e) => changeStatus(o, e.target.value)}>
                        <option value="">Move to...</option>
                        {NEXT[o.status].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                    {can("delete") && DELETABLE.includes(o.status) && <button className="btn danger" onClick={() => remove(o)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pg} onPage={setPage} />

      {modal && (
        <Modal wide title={modal.id ? "Edit Order" : "New Order"} onClose={() => setModal(null)}>
          <form className="form" onSubmit={submit}>
            {formError && <div className="alert error">{formError}</div>}
            <div className="grid2">
              <label>Buyer *
                <select required value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })}>
                  <option value="">Select buyer</option>
                  {buyers.map((b) => <option key={b._id} value={b._id}>{b.buyerCode} - {b.companyName}</option>)}
                </select>
              </label>
              <label>Buyer PO Number *<input required value={form.buyerPONumber} onChange={(e) => setForm({ ...form, buyerPONumber: e.target.value })} /></label>
              <label>Order Date *<input type="date" required value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} /></label>
              <label>Delivery Date *<input type="date" required min={form.orderDate} value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></label>
              <label>Currency
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {["INR", "USD", "EUR", "GBP"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>

            <h4>Items</h4>
            {form.items.map((it, idx) => (
              <div className="item-row" key={idx}>
                <select required value={it.product} onChange={(e) => setItem(idx, "product", e.target.value)}>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
                </select>
                <input type="number" min="1" required placeholder="Qty" value={it.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} />
                <input type="number" min="0" step="0.01" required placeholder="Unit price" value={it.unitPrice} onChange={(e) => setItem(idx, "unitPrice", e.target.value)} />
                <button type="button" className="btn danger" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>✕</button>
              </div>
            ))}
            <button type="button" className="btn" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>+ Add item</button>
            <p className="total">Estimated total: {form.currency} {formTotal.toFixed(2)} <small>(final total is calculated by the server)</small></p>

            <label>Notes<textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn primary" disabled={saving}>{saving ? "Saving..." : "Save Order"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
