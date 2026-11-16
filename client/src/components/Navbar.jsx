import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    toast.success("Logout Success");
    navigate("/", { replace: true });
  };

  const handleLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" onClick={close}>
          <h2>🧵 TOIMS</h2>
        </Link>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className={menuOpen ? "nav-links active" : "nav-links"}>
        {!user && (
          <Link to="/" onClick={close}>
            Home
          </Link>
        )}
        {user && can("read") && (
          <>
            <Link to="/dashboard" onClick={close}>
              Dashboard
            </Link>
            <Link to="/orders" onClick={close}>
              Orders
            </Link>
            <Link to="/processes" onClick={close}>
              Processes
            </Link>
            <Link to="/inventory" onClick={close}>
              Inventory
            </Link>
            <Link to="/buyers" className="nav-extra" onClick={close}>
              Buyers
            </Link>
            <Link to="/products" className="nav-extra" onClick={close}>
              Products
            </Link>
            {user.role === "admin" && (
              <Link to="/users" className="nav-extra" onClick={close}>
                Users
              </Link>
            )}
            <Link to="/profile" className="nav-extra" onClick={close}>
              Profile
            </Link>
          </>
        )}

        {user ? (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        ) : (
          <button onClick={handleLogin} className="login-btn">
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
