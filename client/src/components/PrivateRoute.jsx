import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading, can } = useAuth();

  // not logged in -> login page
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (loading) return <p className="center-msg">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  // Every authenticated role with read permission can access read-only pages.
  if (!can("read")) return <Navigate to="/no-access" replace />;

  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}

export default PrivateRoute;
