import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import Pagination from "../components/Pagination";

function AuditLog() {
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/audit", { params: { page, limit: 15 } });
      setRows(data.data);
      setPg(data.pagination);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1>Audit Log</h1>
      {error && <div className="alert error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Summary</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="5">No records</td></tr>}
            {rows.map((a) => (
              <tr key={a._id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{a.actorName}</td>
                <td><span className="badge">{a.action}</span></td>
                <td>{a.entityType}</td>
                <td>{a.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pg} onPage={setPage} />
    </div>
  );
}

export default AuditLog;
