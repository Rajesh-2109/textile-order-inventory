import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

// Same rules as the server routes (authorizeRoles). This only hides buttons,
// the real check is always done by the backend.
const PERMISSIONS = {
  admin: ["create", "read", "update", "delete"],
  manager: ["create", "read", "update", "delete"],
  employee: ["create", "read", "update", "delete"],
};

export const hasPermission = (role, action) => (PERMISSIONS[role] || []).includes(action);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  // page refresh: token is in localStorage, get the user back from the server
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api
      .get("/auth/profile")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("authExpired", onExpired);
    return () => window.removeEventListener("authExpired", onExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const can = (action) => !!user && hasPermission(user.role, action);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
