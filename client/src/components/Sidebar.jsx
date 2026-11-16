import "./Sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();

  const [open, setOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success("Logout Success");
    navigate("/", { replace: true });
  };

  // not logged in, or employee (no access) -> no sidebar
  if (!user || !can("read")) {
    return null;
  }

  return (
    <div className={open ? "sidebar" : "sidebar collapsed"}>
      <h2>
        {open &&
          `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Panel`}
      </h2>

      <Link to="/dashboard">{open && <span>Dashboard</span>}</Link>
      <Link to="/orders">{open && <span>Orders</span>}</Link>
      <Link to="/processes">{open && <span>Textile Processes</span>}</Link>
      <Link to="/buyers">{open && <span>Buyers</span>}</Link>
      <Link to="/products">{open && <span>Products</span>}</Link>
      <Link to="/inventory">{open && <span>Inventory</span>}</Link>

      {user.role === "admin" && (
        <>
          <Link to="/users">👥{open && <span>Users</span>}</Link>
          <Link to="/audit">📝{open && <span>Audit Log</span>}</Link>
        </>
      )}

      <Link to="/profile">👤{open && <span>Profile</span>}</Link>

      <button onClick={handleLogout} className="sidebar-logout-btn">
        🚪{open && <span>Logout</span>}
      </button>

      <button className="toggle-btn" onClick={() => setOpen(!open)}>
        ☰
      </button>
    </div>
  );
}

export default Sidebar;
