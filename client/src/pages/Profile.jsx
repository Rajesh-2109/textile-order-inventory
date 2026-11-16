import { useState } from "react";
import { toast } from "react-toastify";
import api, { errMsg } from "../api/axios";
import { useAuth } from "../context/authContext";

function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const saveName = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", { name });
      setUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/change-password", pw);
      toast.success(data.message);
      setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <div className="panel">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      <form className="panel form" onSubmit={saveName}>
        <h3>Update name</h3>
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <button className="btn primary">Save</button>
      </form>

      <form className="panel form" onSubmit={savePassword}>
        <h3>Change password</h3>
        <label>Current password<input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label>New password<input type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        <button className="btn primary">Change password</button>
      </form>
    </div>
  );
}

export default Profile;
