import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { errMsg } from "../api/axios";
import { useAuth } from "../context/authContext";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

const ROLES = ["admin", "manager", "employee"];
const emptyForm = { name: "", email: "", password: "", role: "employee" };

function Users() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/users", { params: { page, limit: 10 } });
      setRows(data.data);
      setPg(data.pagination);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (id, body, okMsg) => {
    try {
      await api.put(`/users/${id}`, body);
      toast.success(okMsg);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete user ${u.email}?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success("User Deleted");
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/users", form);
      toast.success("User Created");
      setModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Users & Roles</h1>
        <button className="btn primary" onClick={() => { setFormError(""); setModal(true); }}>+ Add User</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => {
              const self = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td>{u.name}{self && " (you)"}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={self} onChange={(e) => update(u._id, { role: e.target.value }, "Role Updated")}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge ${u.isActive ? "ok" : "off"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="actions">
                    <button className="btn" disabled={self} onClick={() => update(u._id, { isActive: !u.isActive }, u.isActive ? "User Deactivated" : "User Activated")}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn danger" disabled={self} onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pg} onPage={setPage} />

      {modal && (
        <Modal title="Add User" onClose={() => setModal(false)}>
          <form className="form" onSubmit={create}>
            {formError && <div className="alert error">{formError}</div>}
            <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Password<input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label>Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
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

export default Users;
