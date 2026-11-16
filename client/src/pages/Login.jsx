import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, hasPermission } from "../context/authContext";
import { errMsg } from "../api/axios";
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success("Login successful");
      navigate(hasPermission(u.role, "read") ? "/dashboard" : "/no-access", {
        replace: true,
      });
    } catch (err) {
      const msg = errMsg(err);
      if (msg.toLowerCase().includes("register")) {
        toast.info("Registered First");
      } else if (msg.toLowerCase().includes("email")) {
        setEmailError("Invalid email address");
      } else if (msg.toLowerCase().includes("password")) {
        setPasswordError("Invalid password");
      } else {
        setEmailError("Invalid email or password");
        setPasswordError("Please check your password");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to Textile Operations Management
        </p>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            placeholder="name@company.com"
          />
          {emailError && <small className="field-error">{emailError}</small>}
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            placeholder="Enter password"
          />
          {passwordError && (
            <small className="field-error">{passwordError}</small>
          )}
        </label>
        <button className="btn primary" disabled={busy}>
          {busy ? "Please wait…" : "Login"}
        </button>
        <p>
          New employee? <Link to="/register">Register here</Link>
        </p>
        <Link to="/" className="back-home">
          Back to Home
        </Link>
      </form>
    </div>
  );
}
