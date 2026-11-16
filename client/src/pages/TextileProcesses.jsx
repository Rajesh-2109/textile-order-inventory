import { useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import { toast } from "react-toastify";
import "./TextileProcesses.css";

const stages = [
  "Yarn Purchase",
  "Yarn Inward",
  "Knitting",
  "Grey Fabric",
  "Dyeing",
  "Printing",
  "Washing",
  "Compacting",
  "Finishing",
  "Quality Inspection",
  "Packing",
  "Shipment",
];

const initial = {
  order: "",
  stage: stages[0],
  plannedQty: 0,
  completedQty: 0,
  unit: "meter",
  plannedCostINR: 0,
  actualCostINR: 0,
  vendor: "",
  notes: "",
};

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

export default function TextileProcesses() {
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // AUTOMATIC COST CALCULATION
  const calculateActualCost = (qty, rate) => {
    return Number(qty || 0) * Number(rate || 0);
  };

  // LOAD PROCESSES AND ORDERS
  const load = async () => {
    try {
      setError("");

      const [p, o] = await Promise.all([
        api.get("/processes"),
        api.get("/orders?limit=100"),
      ]);

      setRows(p.data.data || []);
      setOrders(o.data.data || []);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  // FORM INPUT CHANGE
  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Recalculate whenever planned quantity or rate changes
      if (name === "plannedQty" || name === "plannedCostINR") {
        updated.actualCostINR = calculateActualCost(
          updated.plannedQty,
          updated.plannedCostINR,
        );
      }

      return updated;
    });
  };

  // SAVE OR UPDATE PROCESS
  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const plannedQty = Number(form.plannedQty);
      const completedQty = Number(form.completedQty);
      const plannedCostINR = Number(form.plannedCostINR);

      if (
        !Number.isFinite(plannedQty) ||
        !Number.isFinite(completedQty) ||
        !Number.isFinite(plannedCostINR) ||
        plannedQty < 0 ||
        completedQty < 0 ||
        plannedCostINR < 0
      ) {
        toast.error("Please enter valid positive values");
        return;
      }

      if (completedQty > plannedQty) {
        toast.error("Completed quantity cannot exceed planned quantity");
        return;
      }

      const payload = {
        ...form,
        plannedQty,
        completedQty,
        plannedCostINR,

        // AUTOMATIC ACTUAL COST
        actualCostINR: calculateActualCost(plannedQty, plannedCostINR),
      };

      if (editing) {
        await api.put(`/processes/${editing}`, payload);
        toast.success("Process updated successfully");
      } else {
        await api.post("/processes", payload);
        toast.success("Process saved successfully");
      }

      setForm(initial);
      setEditing(null);

      await load();
    } catch (e) {
      setError(errMsg(e));
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  // EDIT PROCESS
  const edit = (r) => {
    setEditing(r._id);

    const orderId = r.order?._id || r.order || "";

    const plannedQty = Number(r.plannedQty) || 0;
    const plannedCostINR = Number(r.plannedCostINR) || 0;

    setForm({
      order: orderId,
      stage: r.stage || stages[0],
      plannedQty,
      completedQty: Number(r.completedQty) || 0,
      unit: r.unit || "meter",
      plannedCostINR,
      actualCostINR: calculateActualCost(plannedQty, plannedCostINR),
      vendor: r.vendor || "",
      notes: r.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setEditing(null);
    setForm(initial);
    setError("");
  };

  // DELETE PROCESS
  const remove = async (id) => {
    if (!window.confirm("Delete this process record?")) return;

    try {
      setError("");

      await api.delete(`/processes/${id}`);

      toast.success("Process deleted successfully");

      await load();
    } catch (e) {
      setError(errMsg(e));
      toast.error(errMsg(e));
    }
  };

  const actualCostPreview = calculateActualCost(
    form.plannedQty,
    form.plannedCostINR,
  );

  return (
    <div className="process-page">
      {/* PAGE HEADER */}
      <div className="page-head">
        <div>
          <span className="process-kicker">END-TO-END OPERATIONS</span>

          <h1>Textile Processes</h1>

          <p>
            Track every production stage from yarn purchase to final shipment.
          </p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && <div className="alert error">{error}</div>}

      {/* PROCESS FORM */}
      <form className="process-form" onSubmit={submit}>
        <h3>{editing ? "Update Process" : "Add Process Stage"}</h3>

        <div className="process-grid">
          {/* ORDER */}
          <label>
            Order
            <select name="order" value={form.order} onChange={change} required>
              <option value="">Select order</option>

              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber}
                </option>
              ))}
            </select>
          </label>

          {/* STAGE */}
          <label>
            Stage
            <select name="stage" value={form.stage} onChange={change}>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {/* PLANNED QUANTITY */}
          <label>
            Planned Quantity
            <input
              name="plannedQty"
              type="number"
              min="0"
              step="any"
              value={form.plannedQty}
              onChange={change}
              required
            />
          </label>

          {/* COMPLETED QUANTITY */}
          <label>
            Completed Quantity
            <input
              name="completedQty"
              type="number"
              min="0"
              step="any"
              value={form.completedQty}
              onChange={change}
            />
          </label>

          {/* UNIT */}
          <label>
            Unit
            <select name="unit" value={form.unit} onChange={change}>
              <option value="meter">Meter</option>
              <option value="kg">KG</option>
              <option value="pieces">Pieces</option>
              <option value="cones">Cones</option>
            </select>
          </label>

          {/* PLANNED COST PER UNIT */}
          <label>
            Planned Cost Per Unit (₹)
            <input
              name="plannedCostINR"
              type="number"
              min="0"
              step="any"
              value={form.plannedCostINR}
              onChange={change}
              required
            />
          </label>

          {/* AUTOMATIC ACTUAL COST */}
          <label>
            Actual Cost (₹) - Auto Calculated
            <input
              name="actualCostINR"
              type="text"
              value={inr(actualCostPreview)}
              readOnly
              className="auto-cost-input"
            />
            <small>Planned Quantity × Planned Cost Per Unit</small>
          </label>

          {/* VENDOR */}
          <label>
            Vendor / Supplier
            <input
              name="vendor"
              value={form.vendor}
              onChange={change}
              placeholder="Enter vendor name"
            />
          </label>
        </div>

        {/* NOTES */}
        <label>
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={change}
            placeholder="Enter process notes..."
            rows="3"
          />
        </label>

        {/* COST SUMMARY */}
        <div className="cost-summary">
          <div>
            <span>Planned Quantity</span>
            <strong>
              {form.plannedQty || 0} {form.unit}
            </strong>
          </div>

          <div>
            <span>Cost Per Unit</span>
            <strong>{inr(form.plannedCostINR)}</strong>
          </div>

          <div>
            <span>Calculated Actual Cost</span>
            <strong className="actual-cost">{inr(actualCostPreview)}</strong>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="process-actions">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Saving..." : editing ? "Update Stage" : "Save Stage"}
          </button>

          {editing && (
            <button type="button" className="btn" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* PROCESS TABLE */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Process</th>
              <th>Progress</th>
              <th>Planned Cost / Unit</th>
              <th>Actual Cost</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.order?.orderNumber || "-"}</td>

                <td>{r.stage}</td>

                <td>
                  {r.completedQty}/{r.plannedQty} {r.unit}
                </td>

                <td>{inr(r.plannedCostINR)}</td>

                <td>
                  {inr(calculateActualCost(r.plannedQty, r.plannedCostINR))}
                </td>

                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => edit(r)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(r._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan="6">No process stages added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
