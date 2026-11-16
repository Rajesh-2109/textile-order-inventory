import { useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import { useAuth } from "../context/authContext";
import "./Dashboard.css";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const getNumber = (n) => Number(n) || 0;

function AdminInsights() {
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState([]);
  const [rate, setRate] = useState("90");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // LOAD FINANCE AND PRODUCTION DATA
  const load = async () => {
    try {
      setError("");

      const [a, b] = await Promise.all([
        api.get("/admin/finance"),
        api.get("/admin/finance/progress"),
      ]);

      setData(a.data.data);
      setProgress(b.data.data || []);
      setRate(String(a.data.data.exchangeRateINR || 90));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  // FINANCIAL CALCULATIONS

  const orders = data?.orders || [];

  // Total Order Value
  const totalOrderValue = orders.reduce(
    (total, o) => total + getNumber(o.orderValueINR),
    0,
  );

  // Total Expenses
  const totalExpenses = orders.reduce(
    (total, o) => total + getNumber(o.expensesINR),
    0,
  );

  // ACTUAL PROFIT = ORDER VALUE - EXPENSES
  const profit = Math.max(0, totalOrderValue - totalExpenses);

  // LOSS = EXPENSES - ORDER VALUE
  const loss = Math.max(0, totalExpenses - totalOrderValue);

  // NET PROFIT / LOSS
  const netProfitLoss = totalOrderValue - totalExpenses;

  // PROFIT VS LOSS PERCENTAGE
  const totalProfitLoss = profit + loss;

  const profitPercentage = totalProfitLoss
    ? (profit / totalProfitLoss) * 100
    : 0;

  // ORDER VALUE BREAKDOWN
  const expensePercentage = totalOrderValue
    ? Math.min(100, (totalExpenses / totalOrderValue) * 100)
    : totalExpenses > 0
      ? 100
      : 0;

  // UPDATE USD TO INR RATE
  const save = async (e) => {
    e.preventDefault();

    const exchangeRate = Number(rate);

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      setError("Please enter a valid exchange rate.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put("/admin/finance/exchange-rate", {
        exchangeRateINR: exchangeRate,
      });

      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (error && !data) {
    return <p className="alert error">{error}</p>;
  }

  if (!data) {
    return <p>Loading admin analytics...</p>;
  }

  return (
    <section className="admin-insights">
      {/* ADMIN HEADING */}
      <div className="insight-heading">
        <div>
          <span>ADMIN ONLY</span>
          <h2>Production & financial intelligence</h2>
        </div>

        {/* EXCHANGE RATE */}
        <form onSubmit={save} className="rate-form">
          <label>
            USD → INR rate
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </label>

          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Updating..." : "Update rate"}
          </button>
        </form>
      </div>

      {error && <p className="alert error">{error}</p>}

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="insight-cards">
        <article>
          <small>Total order value (INR)</small>
          <strong>{money(totalOrderValue)}</strong>
        </article>

        <article>
          <small>Total expenses (INR)</small>
          <strong>{money(totalExpenses)}</strong>
        </article>

        <article>
          <small>Profit (INR)</small>
          <strong className="positive">{money(profit)}</strong>
        </article>

        <article>
          <small>Loss (INR)</small>
          <strong className="negative">{money(loss)}</strong>
        </article>
      </div>

      {/* FINANCIAL CHARTS */}
      <div className="finance-visuals">
        {/* PROFIT VS LOSS */}
        <div className="finance-donut-card">
          <h3>Profit vs loss distribution</h3>

          <div
            className="finance-donut"
            style={{
              "--profit": `${profitPercentage}%`,
            }}
          >
            <div>
              <b>{Math.round(profitPercentage)}%</b>
              <small>profit share</small>
            </div>
          </div>

          <p>
            <i className="legend-profit" />
            Profit {money(profit)} <i className="legend-loss" />
            Loss {money(loss)}
          </p>
        </div>

        {/* ORDER VALUE BREAKDOWN */}
        <div className="finance-donut-card">
          <h3>Order value breakdown</h3>

          <div
            className="finance-donut expense-donut"
            style={{
              "--expense": `${expensePercentage}%`,
            }}
          >
            <div>
              <b>{orders.length}</b>
              <small>orders</small>
            </div>
          </div>

          <p>Order revenue compared with recorded expenses</p>
        </div>
      </div>

      {/* NET PROFIT / LOSS */}
      <h3>Overall Net Profit / Loss</h3>

      <div className="insight-cards">
        <article>
          <small>Net Result (INR)</small>

          <strong className={netProfitLoss >= 0 ? "positive" : "negative"}>
            {money(netProfitLoss)}
          </strong>
        </article>
      </div>

      {/* ORDER WISE PROFIT / LOSS */}
      <h3>Order-wise profit / loss</h3>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Order value INR</th>
              <th>Expenses INR</th>
              <th>Profit / Loss</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="4">No orders available</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.orderNumber}</td>

                  <td>{money(o.orderValueINR)}</td>

                  <td>{money(o.expensesINR)}</td>

                  <td
                    className={
                      getNumber(o.profitLossINR) >= 0 ? "positive" : "negative"
                    }
                  >
                    {money(o.profitLossINR)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PRODUCTION COMPLETION */}
      <h3>Production completion by order</h3>

      {progress.map((o) => (
        <div className="progress-order" key={o.orderId}>
          <h4>{o.orderNumber}</h4>

          {o.stages.length === 0 ? (
            <p>No process stages recorded.</p>
          ) : (
            o.stages.map((s) => (
              <div className="stage-progress" key={s._id}>
                <div>
                  <span>{s.stage}</span>

                  <b>
                    {s.completedQty} / {s.plannedQty} {s.unit} · {s.percent}%
                  </b>
                </div>

                <div className="progress-track">
                  <i
                    style={{
                      width: `${s.percent}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </section>
  );
}

// MAIN DASHBOARD
export default function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  const { user } = useAuth();

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setD(r.data.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  if (!d) {
    return <p>Loading...</p>;
  }

  const cards = [
    ["Open Orders", d.openOrders, ""],
    ["Overdue Orders", d.overdue, d.overdue ? "red" : ""],
    ["Due in 7 Days", d.dueSoon, d.dueSoon ? "amber" : ""],
    ["Low Stock Items", d.lowStock, d.lowStock ? "red" : ""],
    ["Active Buyers", d.buyers, ""],
    ["Active Products", d.products, ""],
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      {/* DASHBOARD SUMMARY */}
      <div className="cards">
        {cards.map(([label, value, tone]) => (
          <div key={label} className={`card ${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* ORDERS BY STATUS */}
      <h3>Orders by status</h3>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Orders</th>
            </tr>
          </thead>

          <tbody>
            {Object.keys(d.ordersByStatus || {}).length === 0 ? (
              <tr>
                <td colSpan="2">No orders yet</td>
              </tr>
            ) : (
              Object.entries(d.ordersByStatus).map(([status, n]) => (
                <tr key={status}>
                  <td>{status}</td>
                  <td>{n}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADMIN FINANCE */}
      {user?.role === "admin" && <AdminInsights />}
    </div>
  );
}
