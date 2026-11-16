import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

const emptyForm = { product: "", type: "IN", quantity: "", location: "Main", reason: "", reference: "" };

export default function Inventory() {
  const { can } = useAuth();
  const [tab, setTab] = useState("stock");
  const [stock, setStock] = useState([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [history, setHistory] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const loadStock = useCallback(async () => {
    try {
      const { data } = await api.get("/inventory/stock", { params: { low: lowOnly || undefined } });
      setStock(data.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [lowOnly]);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get("/inventory/transactions", { params: { page, limit: 10 } });
      setHistory(data.data);
      setPg(data.pagination);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [page]);

  useEffect(() => {
    if (tab === "stock") loadStock();
    else loadHistory();
  }, [tab, loadStock, loadHistory]);

  useEffect(() => {
    if (can("create")) {
      api.get("/products", { params: { limit: 100, isActive: true } }).then((r) => setProducts(r.data.data)).catch(() => {});
    }
  }, []); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/inventory/transactions", { ...form, quantity: Number(form.quantity) });
      toast.success("Stock movement saved");
      setModal(false);
      setForm(emptyForm);
      tab === "stock" ? loadStock() : loadHistory();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Inventory</h1>
        {can("create") && <button className="btn primary" onClick={() => { setFormError(""); setModal(true); }}>+ Stock Movement</button>}
      </div>

      <div className="tabs">
        <button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>Stock on hand</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Movement history</button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {tab === "stock" && (
        <>
          <label className="check"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Show low stock only</label>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Product</th><th>Location</th><th>Quantity</th><th>Reorder Lvl</th><th></th></tr></thead>
              <tbody>
                {stock.length === 0 && <tr><td colSpan="6">No stock records</td></tr>}
                {stock.map((s) => (
                  <tr key={s.product._id + s.location}>
                    <td>{s.product.sku}</td>
                    <td>{s.product.name}</td>
                    <td>{s.location}</td>
                    <td>{s.quantity} {s.product.unit}</td>
                    <td>{s.product.reorderLevel}</td>
                    <td>{s.low && <span className="badge off">Low stock</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "history" && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Location</th><th>Reason</th><th>By</th></tr></thead>
              <tbody>
                {history.length === 0 && <tr><td colSpan="7">No movements yet</td></tr>}
                {history.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.product?.sku} - {t.product?.name}</td>
                    <td><span className="badge">{t.type}</span></td>
                    <td>{t.signedQty > 0 ? "+" : ""}{t.signedQty}</td>
                    <td>{t.location}</td>
                    <td>{t.reason}</td>
                    <td>{t.createdBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pg} onPage={setPage} />
        </>
      )}

      {modal && (
        <Modal title="Stock Movement" onClose={() => setModal(false)}>
          <form className="form" onSubmit={submit}>
            {formError && <div className="alert error">{formError}</div>}
            <label>Product *
              <select required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>)}
              </select>
            </label>
            <label>Type *
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="IN">IN (stock received)</option>
                <option value="OUT">OUT (stock issued)</option>
                <option value="ADJUST">ADJUST (+ or - correction)</option>
              </select>
            </label>
            <label>Quantity *<input type="number" step="any" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
            <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>Reason *<input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
            <label>Reference (PO / GRN no.)<input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
