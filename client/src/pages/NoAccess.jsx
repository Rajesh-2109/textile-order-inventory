import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext";

function NoAccess() {
  const { user, loading, can, logout } = useAuth();
  const navigate = useNavigate();

  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (loading) return <p className="center-msg">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (can("read")) return <Navigate to="/dashboard" replace />;

  const handleLogout = () => {
    logout();
    toast.success("Logout Success");
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Access Denied</h1>
        <p>Hi {user.name}, your role (<strong>{user.role}</strong>) does not have access to this system.</p>
        <p>Please ask an admin to change your role.</p>
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default NoAccess;
